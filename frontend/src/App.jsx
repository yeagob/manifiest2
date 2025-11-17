import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CausesPage from './pages/CausesPage'
import ProfilePage from './pages/ProfilePage'
import StepTrackerPage from './pages/StepTrackerPage'
import CreateCausePage from './pages/CreateCausePage'

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="spinner"></div>
      </div>
    )
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
          <Route path="/tracker" element={<StepTrackerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
