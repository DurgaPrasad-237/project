import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  initAuth: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    console.log("📡 About to call API:", import.meta.env.VITE_API_URL)
    const res = await api.post('/auth/login', { email, password })
    console.log("📥 API responded:", res)
    set({ user: res.data.user })
  },

  signup: async (name, email, password, role) => {
    await api.post('/auth/signup', { name, email, password, role })
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({ user: null })
  },

  clearUser: () => set({ user: null }),

  isEmployer: () => {
    const { user } = get()
    return user?.role === 'employer'
  },
}))

export default useAuthStore
