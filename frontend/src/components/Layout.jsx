import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../context/store'
import { Home, Heart, Activity, User, LogOut } from 'lucide-react'

function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Causes', path: '/causes', icon: Heart },
    { name: 'Tracker', path: '/tracker', icon: Activity },
    { name: 'Profile', path: '/profile', icon: User }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--bg-primary)',
        boxShadow: '0 1px 3px var(--shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem'
        }}>
          <Link to="/" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'var(--primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ✊ Protest Simulator
          </Link>

          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    color: isActive(item.path) ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive(item.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    fontWeight: isActive(item.path) ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = 'var(--bg-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.path)) {
                      e.target.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginLeft: '1rem',
              paddingLeft: '1rem',
              borderLeft: '1px solid var(--border)'
            }}>
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2px solid var(--border)'
                  }}
                />
              )}
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.5rem' }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--bg-primary)',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 0',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        <div className="container">
          <p style={{ margin: 0 }}>
            Protest Simulator - Turn your steps into support for the causes you believe in
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
