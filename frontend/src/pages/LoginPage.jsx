import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../context/store'
import api from '../services/api'
import { Footprints, Trophy, Users } from 'lucide-react'
import { TITULOS } from '../lib/gamification'

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const { setUser } = useAuthStore()

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      setError(null)
      try {
        const user = await api.loginWithGoogle(tokenResponse.access_token)
        setUser(user)
      } catch (err) {
        console.error('Login error:', err)
        setError('No se ha podido entrar con Google. Inténtalo otra vez.')
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google ha fallado. Inténtalo otra vez.')
    }
  })

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('El email hace falta, sí o sí.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await api.loginWithEmail(email.trim(), name.trim())
      setUser(user)
    } catch (err) {
      console.error('Email login error:', err)
      setError(err.message || 'No se ha podido entrar. Inténtalo otra vez.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{
        maxWidth: 960, width: '100%',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem', alignItems: 'center',
      }}>
        {/* El cartel */}
        <div>
          <h1 className="m2-display" style={{ fontSize: 'clamp(2.6rem, 7vw, 4rem)', lineHeight: 0.95, margin: 0 }}>
            TUS PASOS<br />
            <span style={{ color: 'var(--m2-rojo)' }}>SON</span><br />
            <span style={{ background: 'var(--m2-amarillo)', padding: '0 .3em', border: '3px solid var(--m2-tinta)', boxShadow: 'var(--m2-sombra)', display: 'inline-block', transform: 'rotate(-2deg)' }}>
              PROTESTA
            </span>
          </h1>
          <p style={{ fontWeight: 700, opacity: 0.7, margin: '1.2rem 0 1.5rem', fontSize: '1.05rem' }}>
            Cada paso que das se convierte en apoyo real a las causas que te importan.
            Camina, sube de nivel, arrastra a tu gente. ✊
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              { icon: Footprints, texto: '1 paso = 1 XP para tus causas (GPS, podómetro o tu reloj)' },
              { icon: Trophy, texto: `Sube de ${TITULOS[0].titulo} a ${TITULOS[TITULOS.length - 1].titulo} con logros y rachas` },
              { icon: Users, texto: 'Marchas virtuales en vivo con toda la gente de tu causa' },
            ].map(({ icon: Icon, texto }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 700, fontSize: '0.92rem' }}>
                <span style={{ border: '2px solid var(--m2-tinta)', borderRadius: 10, background: 'var(--m2-papel)', boxShadow: 'var(--m2-sombra-mini)', padding: '0.45rem', display: 'flex' }}>
                  <Icon size={18} />
                </span>
                {texto}
              </div>
            ))}
          </div>
        </div>

        {/* La entrada */}
        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>ÚNETE A LA MARCHA</h2>

          {error && (
            <div style={{ background: '#EE426622', border: '2px solid var(--m2-rojo)', color: 'var(--m2-rojo)', padding: '0.8rem 1rem', borderRadius: 12, marginBottom: '1.2rem', fontWeight: 700, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={{ marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.email@ejemplo.com"
                className="form-input" disabled={loading} required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nombre (opcional)</label>
              <input
                id="name" type="text" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre de activista"
                className="form-input" disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem' }}>
              {loading ? 'Entrando…' : '✊ Entrar con email'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.2rem 0' }}>
            <div style={{ flex: 1, height: 2, background: 'var(--m2-linea)' }} />
            <span style={{ opacity: 0.5, fontSize: '0.8rem', fontWeight: 700 }}>O</span>
            <div style={{ flex: 1, height: 2, background: 'var(--m2-linea)' }} />
          </div>

          <button onClick={() => login()} disabled={loading} className="btn btn-secondary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem' }}>
            {loading ? 'Entrando…' : 'Entrar con Google'}
          </button>

          <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.78rem', marginTop: '1.5rem', marginBottom: 0, fontWeight: 700 }}>
            Al continuar te comprometes a caminar por lo que crees.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
