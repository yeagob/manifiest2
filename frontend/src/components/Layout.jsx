import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore, useStepsStore } from '../context/store'
import { Home, Heart, Footprints, User, LogOut } from 'lucide-react'
import { nivelDesdeXp } from '../lib/gamification'

function Layout() {
  const { user, logout } = useAuthStore()
  const { stats, fetchStats } = useStepsStore()
  const location = useLocation()

  // El chip de nivel vive en el header: que tenga datos en cualquier página
  useEffect(() => { fetchStats() }, [fetchStats])

  const nivel = nivelDesdeXp(stats?.totalSteps || 0)
  const isActive = (path) => location.pathname === path

  const tabs = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Causas', path: '/causes', icon: Heart },
    { name: 'Marchar', path: '/tracker', icon: Footprints, cta: true },
    { name: 'Perfil', path: '/profile', icon: User },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="m2-topbar">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', gap: '0.75rem' }}>
          <Link to="/" className="m2-brand">✊ MANIFIEST<em>2</em></Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <Link to="/profile" className="m2-chip-nivel" style={{ textDecoration: 'none' }} title={`${nivel.xpEnNivel.toLocaleString()} / ${nivel.xpParaSubir.toLocaleString()} XP`}>
              {nivel.icono} NV {nivel.nivel} · {nivel.titulo}
            </Link>

            <nav className="m2-nav-desktop">
              {tabs.filter(t => !t.cta).map(({ name, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={isActive(path) ? 'btn btn-secondary btn-sm' : 'btn btn-sm'}
                  style={{ gap: '0.4rem', textDecoration: 'none', background: isActive(path) ? undefined : 'transparent', boxShadow: isActive(path) ? undefined : 'none', border: isActive(path) ? undefined : '2px solid transparent' }}
                >
                  <Icon size={16} />
                  {name}
                </Link>
              ))}
              <Link to="/tracker" className="btn btn-primary btn-sm" style={{ gap: '0.4rem', textDecoration: 'none' }}>
                <Footprints size={16} />
                ¡A marchar!
              </Link>
              <button onClick={logout} className="btn btn-sm" style={{ background: 'transparent', boxShadow: 'none', border: '2px solid transparent', opacity: 0.6 }} title="Salir">
                <LogOut size={16} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="m2-con-tabbar" style={{ flex: 1, padding: '1.5rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Tab bar móvil con el CTA gordo en el centro */}
      <nav className="m2-tabbar">
        {tabs.map(({ name, path, icon: Icon, cta }) => (
          <Link key={path} to={path} className={cta ? 'm2-tab' : `m2-tab${isActive(path) ? ' activa' : ''}`} style={cta ? { opacity: 1 } : undefined}>
            {cta ? (
              <span className="m2-tab-cta"><Icon size={26} /></span>
            ) : (
              <>
                <Icon size={20} />
                <span>{name}</span>
              </>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Layout
