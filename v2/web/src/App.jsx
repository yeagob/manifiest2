import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import { useSession } from './lib/store.js'
import HomePage from './pages/HomePage.jsx'
import { LoginPage, RegisterPage, VerifyPage, RecoverPage } from './pages/AuthPages.jsx'
import CausesPage from './pages/CausesPage.jsx'
import CreateCausePage from './pages/CreateCausePage.jsx'
import MovementPage from './pages/MovementPage.jsx'
import DevicesPage from './pages/DevicesPage.jsx'
import ShopPage from './pages/ShopPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

const MarchPage = lazy(() => import('./pages/MarchPage.jsx'))
const WorldPage = lazy(() => import('./pages/WorldPage.jsx'))

const guard = el => <RequireAuth>{el}</RequireAuth>

export default function App() {
  const boot = useSession(s => s.boot)
  useEffect(() => { boot() }, [boot])
  return (
    <Suspense fallback={<p className="muted" style={{ padding: '2rem' }}>Preparando la marcha…</p>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="entrar" element={<LoginPage />} />
          <Route path="registro" element={<RegisterPage />} />
          <Route path="verificar" element={<VerifyPage />} />
          <Route path="recuperar" element={<RecoverPage />} />
          <Route path="mundo" element={<WorldPage />} />
          <Route path="causas" element={<CausesPage />} />
          <Route path="causas/nueva" element={guard(<CreateCausePage />)} />
          <Route path="marcha/:causeId" element={<MarchPage />} />
          <Route path="movimiento" element={guard(<MovementPage />)} />
          <Route path="dispositivos" element={guard(<DevicesPage />)} />
          <Route path="tienda" element={guard(<ShopPage />)} />
          <Route path="perfil" element={guard(<ProfilePage />)} />
          <Route path="*" element={<p>Esta calle no existe.</p>} />
        </Route>
      </Routes>
    </Suspense>
  )
}
