import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Footprints, Heart, Send, ThumbsUp, Play, Pause } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../context/store'

function LiveProtestPage() {
  const { causeId } = useParams()
  const { user } = useAuthStore()

  const [cause, setCause] = useState(null)
  const [supporters, setSupporters] = useState([])
  const [maxSteps, setMaxSteps] = useState(0)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Avenue visualization state
  const [scrollPosition, setScrollPosition] = useState(0) // 0-100%
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoveredSupporter, setHoveredSupporter] = useState(null)
  const animationRef = useRef(null)

  useEffect(() => {
    loadData()
    // Reload data every 10 seconds for "live" feel
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [causeId])

  // Auto-scroll animation
  useEffect(() => {
    if (isPlaying) {
      const duration = 30000 // 30 seconds to go from 0 to 100%
      const startTime = Date.now()
      const startPosition = scrollPosition

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration), 1)
        const newPosition = startPosition + ((100 - startPosition) * progress)

        setScrollPosition(newPosition)

        if (newPosition < 100) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsPlaying(false)
        }
      }

      animationRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isPlaying])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadCause(), loadSupporters(), loadMessages()])
    } finally {
      setLoading(false)
    }
  }

  const loadCause = async () => {
    try {
      const data = await api.getCause(causeId)
      setCause(data)
    } catch (error) {
      console.error('Failed to load cause:', error)
    }
  }

  const loadSupporters = async () => {
    try {
      const data = await api.getCauseSupportersWithSteps(causeId)
      setSupporters(data.supporters || [])
      setMaxSteps(data.maxSteps || 0)
    } catch (error) {
      console.error('Failed to load supporters:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/cause/${causeId}`)
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSubmitMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || submitting) return

    setSubmitting(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          causeId,
          message: newMessage.trim(),
          type: 'placard'
        })
      })

      setNewMessage('')
      await loadData()
    } catch (error) {
      console.error('Failed to post message:', error)
      alert('Failed to post message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (messageId) => {
    try {
      await fetch(`/api/messages/${messageId}/like`, {
        method: 'POST',
        credentials: 'include'
      })
      await loadMessages()
    } catch (error) {
      console.error('Failed to like message:', error)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleScrollChange = (e) => {
    setScrollPosition(parseFloat(e.target.value))
    setIsPlaying(false) // Stop animation when manually scrolling
  }

  if (loading || !cause) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  const powerLevel = Math.min(100, (cause.totalSteps / 10000) * 100)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/causes" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} />
          Back to Causes
        </Link>

        <div style={{
          background: `linear-gradient(135deg, ${cause.color}20 0%, ${cause.color}10 100%)`,
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          border: `2px solid ${cause.color}40`,
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
            <div style={{
              fontSize: '4rem',
              background: cause.color,
              width: '100px',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-xl)',
              boxShadow: `0 10px 40px ${cause.color}40`
            }}>
              {cause.icon}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ marginBottom: '0.5rem', color: cause.color }}>
                {cause.title}
              </h1>
              <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', margin: 0 }}>
                {cause.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-2xl)',
        animation: 'fadeInDown 0.6s ease-out'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-6)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {supporters.length.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <Users size={20} />
              <span>Active Walkers</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {cause.totalSteps.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <Footprints size={20} />
              <span>Steps Walked</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {maxSteps > 0 ? `${(maxSteps * 0.762 / 1000).toFixed(1)}km` : '0km'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <Heart size={20} />
              <span>Leader Distance</span>
            </div>
          </div>
        </div>

        {/* Power Bar */}
        <div style={{
          marginTop: 'var(--space-4)',
          height: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${powerLevel}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FFF 0%, rgba(255,255,255,0.8) 100%)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 1s ease-out',
            boxShadow: '0 0 20px rgba(255,255,255,0.5)'
          }} />
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 'var(--space-6)',
        alignItems: 'start'
      }}>
        {/* Avenue Perspective Visualization */}
        <div className="card" style={{ minHeight: '700px' }}>
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>
              🛣️ Avenida de la Manifestación
            </h3>
            <div style={{
              background: '#EF4444',
              color: 'white',
              padding: 'var(--space-1) var(--space-3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'white',
                animation: 'pulse 1s ease-in-out infinite'
              }} />
              LIVE
            </div>
          </div>

          {/* Avenue View with 3D Perspective */}
          <div style={{
            position: 'relative',
            height: '500px',
            background: 'linear-gradient(180deg, #87CEEB 0%, #E0E0E0 70%, #808080 100%)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            perspective: '1000px',
            perspectiveOrigin: '50% 30%'
          }}>
            {supporters.length === 0 ? (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚶</div>
                <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  No hay caminantes aún
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Sé el primero en caminar por esta causa
                </p>
              </div>
            ) : (
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transform: 'rotateX(60deg)',
                transformOrigin: '50% 100%'
              }}>
                {/* Avenue Road */}
                <div style={{
                  position: 'absolute',
                  width: '40%',
                  height: '200%',
                  left: '30%',
                  top: '-100%',
                  background: 'repeating-linear-gradient(0deg, #404040 0px, #404040 40px, #FFF 40px, #FFF 45px, #404040 45px, #404040 80px)',
                  transformOrigin: '50% 100%',
                  boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3)'
                }}></div>

                {/* Supporters as avatars */}
                {supporters.map((supporter, index) => {
                  // Calculate position based on steps
                  // 0% = back (start), 100% = front (finish line)
                  const stepsPercent = maxSteps > 0 ? (supporter.steps / maxSteps) * 100 : 0

                  // Visible range based on scroll position
                  const viewStart = scrollPosition
                  const viewEnd = scrollPosition + 20 // Show 20% range at a time

                  // Check if this supporter is in the visible range
                  const isVisible = stepsPercent >= viewStart && stepsPercent <= viewEnd

                  if (!isVisible) return null

                  // Position within the visible 20% range
                  const relativePosition = ((stepsPercent - viewStart) / 20) * 100

                  // Distance from camera (0 = far, 100 = close)
                  const distanceFromCamera = relativePosition

                  // Calculate Z position (further back = more negative Z)
                  const zPosition = -500 + (distanceFromCamera * 5)

                  // Scale based on distance (perspective)
                  const scale = 0.3 + (distanceFromCamera / 100) * 1.5

                  // Horizontal position (slight variation for realism)
                  const horizontalOffset = (index % 3 - 1) * 50 // -50, 0, or 50

                  return (
                    <div
                      key={supporter.userId}
                      onMouseEnter={() => setHoveredSupporter(supporter)}
                      onMouseLeave={() => setHoveredSupporter(null)}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${horizontalOffset}px)`,
                        bottom: '100%',
                        transform: `translateX(-50%) translateZ(${zPosition}px) scale(${scale}) rotateX(-60deg)`,
                        fontSize: '2rem',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                        zIndex: Math.floor(distanceFromCamera),
                        filter: `brightness(${0.7 + (distanceFromCamera / 100) * 0.5})`
                      }}
                    >
                      ✊

                      {/* Tooltip with message */}
                      {hoveredSupporter?.userId === supporter.userId && supporter.message && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%) rotateX(60deg) translateZ(20px)',
                          background: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          border: `2px solid ${cause.color}`,
                          marginBottom: '0.5rem',
                          maxWidth: '200px',
                          whiteSpace: 'normal',
                          textAlign: 'center',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {supporter.name}
                          </div>
                          "{supporter.message}"
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {supporter.steps.toLocaleString()} pasos
                          </div>
                        </div>
                      )}

                      {/* Tooltip for supporters without message */}
                      {hoveredSupporter?.userId === supporter.userId && !supporter.message && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%) rotateX(60deg) translateZ(20px)',
                          background: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          border: `2px solid ${cause.color}`,
                          marginBottom: '0.5rem',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            {supporter.name}
                          </div>
                          {supporter.steps.toLocaleString()} pasos
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <button
                onClick={togglePlayPause}
                className="btn btn-secondary"
                disabled={supporters.length === 0}
                style={{ minWidth: '120px' }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? 'Pausar' : 'Recorrer'}
              </button>

              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scrollPosition}
                  onChange={handleScrollChange}
                  disabled={supporters.length === 0}
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    outline: 'none',
                    opacity: supporters.length === 0 ? 0.5 : 1,
                    cursor: supporters.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                />
              </div>

              <div style={{
                minWidth: '80px',
                textAlign: 'right',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
              }}>
                {scrollPosition.toFixed(0)}%
              </div>
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              {supporters.length > 0
                ? `Mostrando ${supporters.filter(s => {
                    const stepsPercent = maxSteps > 0 ? (s.steps / maxSteps) * 100 : 0
                    return stepsPercent >= scrollPosition && stepsPercent <= scrollPosition + 20
                  }).length} de ${supporters.length} caminantes`
                : 'No hay caminantes para mostrar'}
            </div>
          </div>
        </div>

        {/* Placards Wall */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              📢 Tu Pancarta
            </h3>

            <form onSubmit={handleSubmitMessage}>
              <div className="form-group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje para esta causa..."
                  className="form-textarea"
                  maxLength={200}
                  rows={4}
                  style={{ fontSize: '1rem' }}
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--space-1)'
                }}>
                  {newMessage.length}/200 caracteres
                </div>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || submitting}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Send size={20} />
                {submitting ? 'Publicando...' : 'Publicar Pancarta'}
              </button>
            </form>

            <div style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-2)',
              background: 'rgba(99,102,241,0.1)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              textAlign: 'center'
            }}>
              💡 Pasa el ratón sobre los avatares en la avenida para ver los mensajes
            </div>
          </div>

          {/* Messages Feed */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              Pancartas Recientes ({messages.length})
            </h3>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📢</div>
                  <p>No hay pancartas aún. ¡Sé el primero!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: '2px solid var(--primary)',
                      transform: `rotate(${Math.random() * 4 - 2}deg)`,
                      transition: 'all 0.2s',
                      animation: 'fadeInUp 0.5s ease-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${Math.random() * 4 - 2}deg) scale(1)`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      <img
                        src={msg.userPicture}
                        alt={msg.userName}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: '2px solid var(--border)'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {msg.userName}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLike(msg.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: 'var(--space-1)',
                          color: msg.likedBy?.includes(user?.id) ? 'var(--primary)' : 'var(--text-secondary)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ThumbsUp
                          size={16}
                          fill={msg.likedBy?.includes(user?.id) ? 'currentColor' : 'none'}
                        />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {msg.likes}
                        </span>
                      </button>
                    </div>

                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      textAlign: 'center',
                      padding: 'var(--space-2) 0'
                    }}>
                      "{msg.message}"
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveProtestPage
