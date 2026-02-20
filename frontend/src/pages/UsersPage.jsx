import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import useUsersStore from '../store/usersStore'

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = { name: form.name, email: form.email }
      if (form.password) data.password = form.password
      await onSave(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{user ? 'Edit User' : 'Add Employee'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password {user && '(leave blank to keep current)'}</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user: currentUser, isEmployer } = useAuthStore()
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUsersStore()
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchUsers() }, [])

  const canEdit = (u) => {
    if (isEmployer()) return u.id === currentUser.id || u.employer_id === currentUser.id
    return u.id === currentUser.id
  }

  const canDelete = (u) =>
    isEmployer() && u.id !== currentUser.id && u.employer_id === currentUser.id

  const handleSave = async (data) => {
    if (modal.mode === 'add') await createUser(data)
    else await updateUser(modal.user.id, data)
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return
    try {
      await deleteUser(u.id)
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">
            {isEmployer() ? 'Manage your team members' : 'View team members'}
          </p>
        </div>
        {isEmployer() && (
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            + Add Employee
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner">Loading users…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        {u.name}
                        {u.id === currentUser.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>(you)</span>
                        )}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>
                      <div className="actions">
                        {canEdit(u) && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal({ mode: 'edit', user: u })}>
                            Edit
                          </button>
                        )}
                        {canDelete(u) && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>
                            Delete
                          </button>
                        )}
                        {!canEdit(u) && !canDelete(u) && (
                          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
