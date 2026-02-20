import { create } from 'zustand'
import api from '../api/axios'

const useTasksStore = create((set) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const res = await api.get('/tasks/')
      set({ tasks: res.data, loading: false })
    } catch (e) {
      set({ error: e.response?.data?.error || 'Failed to fetch tasks', loading: false })
    }
  },

  createTask: async (data) => {
    const res = await api.post('/tasks/', data)
    set((state) => ({ tasks: [res.data, ...state.tasks] }))
    return res.data
  },

  updateTask: async (id, data) => {
    const res = await api.put(`/tasks/${id}`, data)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? res.data : t)),
    }))
    return res.data
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },
}))

export default useTasksStore
