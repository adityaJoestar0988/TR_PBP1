import axios from 'axios'

// SMART POS - instance axios terpusat.
// Semua request ke backend Laravel harus lewat sini agar token JWT
// otomatis terpasang dari state in-memory AuthContext.
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',
  },
})

let authToken = localStorage.getItem('smartpos_token') || null

export function setAuthToken(token) {
  authToken = token
}

// Pasang token JWT ke setiap request.
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('smartpos_token')
      localStorage.removeItem('smartpos_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
