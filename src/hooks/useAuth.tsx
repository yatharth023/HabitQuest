import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { apiClient } from '../lib/api'

interface User {
  id: string
  email: string
  username: string | null
  level: number
  totalXp: number
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await apiClient.getCurrentUser() as any
          setUser(response.user)
        } catch (error) {
          console.error('Auth initialization failed:', error)
          localStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password }) as any
    apiClient.setToken(response.token)
    setUser(response.user)
  }

  const register = async (email: string, password: string, username: string) => {
    const response = await apiClient.register({ email, password, username }) as any
    apiClient.setToken(response.token)
    setUser(response.user)
  }

  const logout = () => {
    apiClient.setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
