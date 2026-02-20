import { create } from 'zustand'
import api from '../api/axios'

const useUsersStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/users/')
      set({ users: res.data, loading: false })
    } catch (e) {
      set({ error: e.response?.data?.error || 'Failed to fetch users', loading: false })
    }
  },

  createUser: async (data) => {
    const res = await api.post('/users/', data)
    set((state) => ({ users: [...state.users, res.data] }))
    return res.data
  },

  updateUser: async (id, data) => {
    const res = await api.put(`/users/${id}`, data)
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? res.data : u)),
    }))
    return res.data
  },

  deleteUser: async (id) => {
    await api.delete(`/users/${id}`)
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }))
  },
}))

export default useUsersStore
