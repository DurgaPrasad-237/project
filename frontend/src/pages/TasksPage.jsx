import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useTasksStore from '../store/tasksStore'
import useUsersStore from '../store/usersStore'

const STATUS_OPTIONS = ['pending', 'in_progress', 'completed']

function TaskModal({ task, onClose, onSave, users }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
    assigned_to: task?.assigned_to || '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSave({
        ...form,
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
      })
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{task ? 'Edit Task' : 'New Task'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" value={form.title} onChange={handle} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={handle} placeholder="Task description..." />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handle}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select className="form-select" name="assigned_to" value={form.assigned_to} onChange={handle}>
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask } = useTasksStore()
  const { users, fetchUsers } = useUsersStore()
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const handleSave = async (data) => {
    if (modal.task) {
      await updateTask(modal.task.id, data)
    } else {
      await createTask(data)
    }
  }

  const handleDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try {
      await deleteTask(task.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track all tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ task: null })}>
          + New Task
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner">Loading tasks...</div>
          ) : filtered.length === 0 ? (
            <div className="spinner" style={{ color: 'var(--muted)' }}>No tasks found</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td style={{ color: 'var(--muted)', maxWidth: 200 }}>
                      {task.description || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{task.assigned_to_name || '—'}</td>
                    <td>{task.created_by_name}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ task })}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal !== null && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal(null)}
          onSave={handleSave}
          users={users}
        />
      )}
    </div>
  )
}
