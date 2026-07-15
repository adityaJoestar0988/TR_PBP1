import { createContext, useContext, useState } from 'react'
import api, { setAuthToken } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })

    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)

    return data.user
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      setAuthToken(null)
      setToken(null)
      setUser(null)
    }
  }

  function clearAuth() {
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout, clearAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
