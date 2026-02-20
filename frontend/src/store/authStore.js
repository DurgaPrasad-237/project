import { create } from 'zustand'
import api from '../api/axios'

const hasSessionCookie = () => {
  return document.cookie.includes('access_token_cookie')
}

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  initAuth: async () => {
    if (!document.cookie.includes('access_token_cookie')) {
      set({ loading: false })
      return
    }

    try {
      const res = await api.get('/auth/me')
      set({ user: res.data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
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

  // ✅ FIXED — reads state using get()
  isEmployer: () => {
    const { user } = get()
    return user?.role === 'employer'
  },
}))


export default useAuthStore
