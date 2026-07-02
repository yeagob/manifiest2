import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CausesPage from './pages/CausesPage'
import ProfilePage from './pages/ProfilePage'
import StepTrackerPage from './pages/StepTrackerPage'
import CreateCausePage from './pages/CreateCausePage'
import LiveProtestPage from './pages/LiveProtestPage'
import { M2Onboarding, M2_ONBOARDING_KEY } from './components/M2Onboarding'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // Onboarding guiado: la primera vez, antes de entrar (marca en localStorage)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(M2_ONBOARDING_KEY) } catch { return false }
  })
  const cerrarOnboarding = () => {
    try { localStorage.setItem(M2_ONBOARDING_KEY, new Date().toISOString()) } catch { /* nada */ }
    setShowOnboarding(false)
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // El onboarding se muestra a quien aún no ha entrado y no lo ha visto
  if (!isAuthenticated && showOnboarding) {
    return <M2Onboarding onFinish={cerrarOnboarding} onSkip={cerrarOnboarding} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <LoginPage />
        } />

        <Route element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" />
        }>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/causes" element={<CausesPage />} />
          <Route path="/causes/new" element={<CreateCausePage />} />
          <Route path="/causes/:causeId/live" element={<LiveProtestPage />} />
          <Route path="/tracker" element={<StepTrackerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
