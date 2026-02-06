/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, ReactNode } from 'react'
import { storage } from '../../infrastructure/storage/local-storage'

interface AuthContextType {
  isAuthenticated: boolean
  user: string | null
  login: (username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_KEY = 'restaurant:auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(() => {
    return storage.get<string>(AUTH_KEY)
  })

  const login = (username: string) => {
    setUser(username)
    storage.set(AUTH_KEY, username)
  }

  const logout = () => {
    setUser(null)
    storage.remove(AUTH_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        user,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
