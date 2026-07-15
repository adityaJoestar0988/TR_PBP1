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

let authToken = null

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

export default api
