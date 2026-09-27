import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../lib/store.js'

export default function RequireAuth({ children }) {
  const { ready, profile } = useSession()
  const location = useLocation()
  if (!ready) return <p className="muted">Cargando…</p>
  if (!profile) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  return children
}
