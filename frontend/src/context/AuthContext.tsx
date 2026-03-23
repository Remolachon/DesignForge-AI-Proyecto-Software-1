"use client"

import { createContext, useContext, useState } from "react"

type AuthContextType = {
  user: any
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)

  async function login(email: string, password: string) {
    console.log("login", email, password)
    setUser({ email })
  }

  async function register(name: string, email: string, password: string) {
    console.log("register", name, email, password)
    setUser({ name, email })
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
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