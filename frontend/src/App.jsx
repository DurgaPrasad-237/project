import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import TasksPage from './pages/TasksPage'
import ProfilePage from './pages/ProfilePage'

function AppLoader() {
  return (
    <div className="app-loader">
      Loading WorkManager…
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <AppLoader />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <AppLoader />
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  const { initAuth, loading } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [])

  // Block render until auth check is done
  if (loading) return <AppLoader />

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest routes */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

        {/* Protected routes inside Layout */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
