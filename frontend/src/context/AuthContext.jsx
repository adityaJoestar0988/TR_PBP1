import { createContext, useContext, useState } from 'react'
import api, { setAuthToken } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smartpos_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('smartpos_token')
    if (savedToken) {
        setAuthToken(savedToken)
    }
    return savedToken || null
  })

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })

    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)

    localStorage.setItem('smartpos_token', data.token)
    localStorage.setItem('smartpos_user', JSON.stringify(data.user))

    return data.user
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // Ignore error if token is already invalid
    } finally {
      clearAuth()
    }
  }

  function clearAuth() {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem('smartpos_token')
    localStorage.removeItem('smartpos_user')
  }

  return <AuthContext.Provider value={{ user, token, login, logout, clearAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
