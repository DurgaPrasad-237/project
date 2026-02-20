import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useTasksStore from '../store/tasksStore'
import useUsersStore from '../store/usersStore'

export default function DashboardPage() {
  const { user, isEmployer } = useAuthStore()
  const { tasks, fetchTasks } = useTasksStore()
  const { users, fetchUsers } = useUsersStore()

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  const safeTasks = tasks ?? []
  const safeUsers = users ?? []
  const pending = safeTasks.filter((t) => t.status === 'pending').length
  const inProgress = safeTasks.filter((t) => t.status === 'in_progress').length
  const completed = safeTasks.filter((t) => t.status === 'completed').length
  const teamCount = safeUsers.filter((u) => u.employer_id === user?.id).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.name} 👋</h1>
          <p className="page-subtitle">Here's what's happening today</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value" style={{ color: '#4f46e5' }}>{safeTasks.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{completed}</div>
        </div>
        {isEmployer() && (
          <div className="stat-card">
            <div className="stat-label">Team Members</div>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>{teamCount}</div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Recent Tasks</h2>
        {safeTasks.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            No tasks yet. <Link to="/tasks" style={{ color: 'var(--primary)' }}>Create one!</Link>
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                {safeTasks.slice(0, 5).map((task) => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td>
                      <span className={`badge badge-${task.status}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{task.assigned_to_name || '—'}</td>
                    <td>{task.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {safeTasks.length > 5 && (
          <div style={{ marginTop: 12 }}>
            <Link to="/tasks" style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600 }}>
              View all {safeTasks.length} tasks →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
