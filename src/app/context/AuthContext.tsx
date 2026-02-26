import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'cliente' | 'funcionario' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock: Determinar rol basado en el email
    let role: UserRole = 'cliente';
    if (email.includes('funcionario') || email.includes('staff')) {
      role = 'funcionario';
    } else if (email.includes('admin')) {
      role = 'admin';
    }

    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      role,
    });
  };

  const register = async (name: string, email: string, password: string) => {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setUser({
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role: 'cliente',
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
