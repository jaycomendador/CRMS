import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Dashboard from './features/dashboard/Dashboard'
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import LoginLoadingScreen from './features/auth/LoginLoadingScreen'
import { applyTheme, getSettings } from './features/dashboard/settings'
import AdminAuth from './features/admin/AdminAuth'
import AdminDashboard from './features/admin/AdminDashboard'

// Private Route Guard - Protects dashboard pages from unauthorized access
function PrivateRoute({ staff, children }) {
  if (!staff) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Public Route Guard - Prevents logged-in users from seeing login/register screens
function PublicRoute({ staff, children }) {
  if (staff) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    applyTheme(getSettings().theme)
  }, [])

  // Tab-scoped auth state initialized from sessionStorage (Clears when the tab closes)
  const [staff, setStaff] = useState(() => {
    try {
      const savedStaff = sessionStorage.getItem('crms_staff_session')
      return savedStaff ? JSON.parse(savedStaff) : null
    } catch (err) {
      return null
    }
  })

  // Loading screen state: holds the pending staff object while the animation plays
  const [loadingStaff, setLoadingStaff] = useState(null)
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = sessionStorage.getItem('crms_admin_session')
      return savedAdmin ? JSON.parse(savedAdmin) : null
    } catch {
      return null
    }
  })

  // Handle successful login — show loading screen first, then navigate
  function handleLogin(staffUser) {
    setLoadingStaff(staffUser)
  }

  // Called by LoginLoadingScreen once its animation finishes
  const handleLoadingFinish = useCallback(() => {
    if (!loadingStaff) return
    try {
      sessionStorage.setItem('crms_staff_session', JSON.stringify(loadingStaff))
    } catch (err) {}
    setStaff(loadingStaff)
    setLoadingStaff(null)
    navigate('/dashboard')
  }, [loadingStaff, navigate])

  // Handle staff logout
  function handleLogout() {
    try {
      sessionStorage.removeItem('crms_staff_session')
    } catch (err) {}
    setStaff(null)
    navigate('/login')
  }

  function handleAdminAuthenticated(adminUser) {
    sessionStorage.setItem('crms_admin_session', JSON.stringify(adminUser))
    setAdmin(adminUser)
    navigate('/admin/dashboard')
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('crms_admin_session')
    setAdmin(null)
    navigate('/admin/login')
  }

  // Show animated loading screen after a successful login attempt
  if (loadingStaff) {
    return (
      <LoginLoadingScreen
        organizationName={loadingStaff.organizationName}
        onFinish={handleLoadingFinish}
      />
    )
  }

  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#f5f7fb]">
      <Routes>
        <Route path="/admin/login" element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminAuth mode="login" onAuthenticated={handleAdminAuthenticated} onSwitchMode={() => navigate('/admin/register')} />} />
        <Route path="/admin/register" element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminAuth mode="register" onAuthenticated={handleAdminAuthenticated} onSwitchMode={() => navigate('/admin/login')} />} />
        <Route path="/admin/dashboard" element={admin ? <AdminDashboard admin={admin} onLogout={handleAdminLogout} /> : <Navigate to="/admin/login" replace />} />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute staff={staff}>
              <Login
                onRegister={() => navigate('/register')}
                onLogin={handleLogin}
              />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute staff={staff}>
              <Register
                onLogin={() => navigate('/login')}
              />
            </PublicRoute>
          }
        />


        {/* Private Protected Route */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute staff={staff}>
              <Dashboard staff={staff} onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Default Fallback Redirect */}
        <Route
          path="*"
          element={<Navigate to={staff ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </main>
  )
}

export default App
