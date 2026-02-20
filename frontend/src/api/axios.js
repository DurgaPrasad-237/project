import axios from 'axios'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // MUST for cookie auth
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!error.response) return Promise.reject(error)

    const status = error.response.status

    const isAuthRoute =
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/signup') ||
      originalRequest.url.includes('/auth/refresh')

    // Only try refresh for protected routes
    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh') // use SAME instance
        processQueue(null)
        return api(originalRequest)
      } catch (err) {
        processQueue(err)

        // Kill session cleanly
        useAuthStore.getState().clearUser()

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
