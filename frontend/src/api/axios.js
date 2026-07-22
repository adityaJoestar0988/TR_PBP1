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

// Pasang token JWT dan Console Log ke setiap request.
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || config.params || '')
  return config
})

// Console log untuk setiap response yang kembali dari backend
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url} - Success`, response.data)
    return response
  },
  (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Failed`, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
