import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Work<span>Manager</span></div>
        <nav>
          <NavLink to="/" end>🏠 Dashboard</NavLink>
          <NavLink to="/users">👥 Users</NavLink>
          <NavLink to="/tasks">✅ Tasks</NavLink>
          <NavLink to="/profile">👤 Profile</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
