import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  // Called once on app mount — server verifies the cookie
  initAuth: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  // Refresh user data after profile update
  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me')
      set({ user: res.data })
    } catch {
      set({ user: null })
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    set({ user: res.data.user, loading: false })
  },

  signup: async (name, email, password, role) => {
    await api.post('/auth/signup', { name, email, password, role })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors, still clear user
    }
    set({ user: null, loading: false })
  },

  clearUser: () => set({ user: null, loading: false }),

  isEmployer: () => {
    const { user } = get()
    return user?.role === 'employer'
  },
}))

export default useAuthStore
