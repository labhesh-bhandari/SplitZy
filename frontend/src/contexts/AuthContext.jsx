import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, restore from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('splitzy_token')
    const savedUser = localStorage.getItem('splitzy_user')
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      } catch (e) {
        localStorage.removeItem('splitzy_token')
        localStorage.removeItem('splitzy_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((tokenValue, userData) => {
    setToken(tokenValue)
    setUser(userData)
    localStorage.setItem('splitzy_token', tokenValue)
    localStorage.setItem('splitzy_user', JSON.stringify(userData))
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('splitzy_token')
    localStorage.removeItem('splitzy_user')
    delete api.defaults.headers.common['Authorization']
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
