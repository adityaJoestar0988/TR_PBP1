import { createContext, useContext, useState } from 'react'
import api, { setAuthToken } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setAuthToken(savedToken)
    return savedToken || null
  })

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })

    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    return data.user
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAuthToken(null)
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  function clearAuth() {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ user, token, login, logout, clearAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
