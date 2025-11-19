import { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '../context/store'
import api from '../services/api'
import { Heart, TrendingUp, Users } from 'lucide-react'

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
        // Exchange the authorization code for user data
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        const userInfo = await response.json()

        // Create a mock ID token for our backend (in production, use proper OAuth flow)
        const user = await api.loginWithGoogle(tokenResponse.access_token)
        setUser(user)
      } catch (err) {
        console.error('Login error:', err)
        setError('Failed to login. Please try again.')
        setLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.')
    }
  })

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const user = await api.loginWithEmail(email.trim(), name.trim())
      setUser(user)
    } catch (err) {
      console.error('Email login error:', err)
      setError(err.message || 'Failed to login. Please try again.')
      setLoading(false)
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        alignItems: 'center'
      }}>
        {/* Left side - Info */}
        <div style={{ color: 'white' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            ✊ Protest Simulator
          </h1>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
            Turn your daily steps into support for the causes you believe in
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                borderRadius: '0.75rem'
              }}>
                <Heart size={32} />
              </div>
              <div>
                <h3>Support Causes</h3>
                <p style={{ opacity: 0.8, margin: 0 }}>
                  Choose from existing causes or create your own
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                borderRadius: '0.75rem'
              }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <h3>Track Your Steps</h3>
                <p style={{ opacity: 0.8, margin: 0 }}>
                  Every step you take counts towards your causes
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '1rem',
                borderRadius: '0.75rem'
              }}>
                <Users size={32} />
              </div>
              <div>
                <h3>Join the Movement</h3>
                <p style={{ opacity: 0.8, margin: 0 }}>
                  See how many people are walking for the same causes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="card" style={{ padding: '3rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Get Started
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="form-input"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="form-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.125rem'
              }}
            >
              {loading ? 'Logging in...' : 'Continue with Email'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.5rem 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Google Login */}
          <button
            onClick={() => login()}
            disabled={loading}
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.125rem'
            }}
          >
            {loading ? 'Logging in...' : 'Continue with Google'}
          </button>

          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            marginTop: '2rem',
            marginBottom: 0
          }}>
            By continuing, you agree to walk for causes you believe in
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
