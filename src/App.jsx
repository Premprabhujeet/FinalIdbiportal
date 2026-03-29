import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from 'oidc-react'
import './App.css'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/portal/DashboardPage'
import { LanguageUpdatePage } from './pages/portal/LanguageUpdatePage'
import { PortalLayout } from './pages/portal/PortalLayout'
import { QrDetailsPage } from './pages/portal/QrDetailsPage'
import { ReportsPage } from './pages/portal/ReportsPage'
import { logout as logoutUser, saveOidcUserSession } from './services/authService'

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const auth = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = Boolean(auth.userData?.access_token)

  useEffect(() => {
    if (auth.userData) {
      saveOidcUserSession(auth.userData, { persist: false })
    }
  }, [auth.userData])

  const handleLogout = async () => {
    logoutUser()
    await auth.signOutRedirect()
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route path="/redirected" element={<AuthCallbackPage />} />

      <Route
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <PortalLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/language-update"
          element={<LanguageUpdatePage />}
        />
        <Route
          path="/reports"
          element={<ReportsPage />}
        />
        <Route
          path="/qr-details"
          element={<QrDetailsPage />}
        />
      </Route>

      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
