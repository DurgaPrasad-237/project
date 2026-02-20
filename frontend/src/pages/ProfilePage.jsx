import { useState } from 'react'
import useAuthStore from '../store/authStore'
import useUsersStore from '../store/usersStore'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const { updateUser } = useUsersStore()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const data = { name: form.name, email: form.email }
      if (form.password) data.password = form.password
      await updateUser(user.id, data)
      await fetchMe()
      setSuccess('Profile updated successfully!')
      setForm(f => ({ ...f, password: '', confirmPassword: '' }))
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Update your personal information</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, maxWidth: 800 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: '1.75rem', margin: '0 auto 16px' }}>
            {initials}
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{user?.name}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 12 }}>{user?.email}</p>
          <span className={`badge badge-${user?.role}`}>{user?.role}</span>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Edit Information</h3>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
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
              <label className="form-label">New Password (leave blank to keep current)</label>
              <input className="form-input" type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handle} placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
