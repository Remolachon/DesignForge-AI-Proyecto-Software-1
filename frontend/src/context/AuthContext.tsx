"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { logout as logoutService } from "@/services/auth.service" // ✅ NUEVO

type AuthContextType = {
  user: any
  setUser: (user: any) => void // ✅ NUEVO
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)

  // ✅ NUEVO: persistencia de sesión
  useEffect(() => {
    const token = localStorage.getItem("token")
    const email = localStorage.getItem("email")
    const name = localStorage.getItem("name")

    if (token && email && name) {
      setUser({ email, name })
    }
  }, [])

  async function login(email: string, password: string) {
    console.log("login", email, password)
    setUser({ email })
  }

  async function register(name: string, email: string, password: string) {
    console.log("register", name, email, password)
    setUser({ name, email })
  }

  // 🔥 MODIFICADO: logout también en backend
  async function logout() {
    await logoutService()

    localStorage.removeItem("token")
    localStorage.removeItem("email")
    localStorage.removeItem("name")

    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}