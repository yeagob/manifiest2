import { NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '../lib/store.js'

const LINKS = [
  ['/', 'Inicio', true],
  ['/mundo', 'Mundo'],
  ['/causas', 'Causas'],
  ['/movimiento', 'Mi movimiento', false, true],
  ['/dispositivos', 'Relojes', false, true],
  ['/tienda', 'Tienda', false, true],
  ['/perfil', 'Perfil', false, true]
]

export default function Layout() {
  const profile = useSession(s => s.profile)
  const { pathname } = useLocation()
  const immersive = pathname.startsWith('/marcha/') || pathname === '/mundo'
  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand"><span className="brand-dot" aria-hidden />Manifiest</Link>
        <nav className="nav" aria-label="Principal">
          {LINKS.filter(([, , , priv]) => !priv || profile).map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
          {!profile && <NavLink to="/entrar">Entrar</NavLink>}
        </nav>
      </header>
      <main className={`main${immersive ? ' full' : ''}`}>
        <Outlet />
      </main>
      {!immersive && (
        <footer className="footer muted">
          Código abierto · Las cifras son siempre reales: 1 persona = 1 voz · <a href="https://github.com/yeagob/manifiest2">GitHub</a>
        </footer>
      )}
    </div>
  )
}
