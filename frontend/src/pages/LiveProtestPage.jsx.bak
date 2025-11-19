import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Footprints, Heart, Send, ThumbsUp } from 'lucide-react'
import api from '../services/api'
import { useAuthStore } from '../context/store'

function LiveProtestPage() {
  const { causeId } = useParams()
  const { user } = useAuthStore()

  const [cause, setCause] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
    // Reload messages every 10 seconds for "live" feel
    const interval = setInterval(loadMessages, 10000)
    return () => clearInterval(interval)
  }, [causeId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadCause(), loadMessages()])
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
      await loadMessages()
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

  if (loading || !cause) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // Calculate crowd size (supporters count with animation multiplier for visual effect)
  const crowdSize = cause.supporterCount * 10 // Visual multiplier
  const powerLevel = Math.min(100, (cause.totalSteps / 10000) * 100) // Power based on steps

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
              {cause.supporterCount.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <Users size={20} />
              <span>Real Supporters</span>
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
              {powerLevel.toFixed(0)}%
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: 0.9 }}>
              <Heart size={20} />
              <span>Movement Power</span>
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
        {/* Virtual Crowd Visualization */}
        <div className="card" style={{ minHeight: '600px' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>
            🎭 Virtual Protest • LIVE
          </h3>

          {/* Crowd Animation */}
          <div style={{
            position: 'relative',
            height: '500px',
            background: 'linear-gradient(180deg, rgba(99,102,241,0.05) 0%, rgba(16,185,129,0.05) 100%)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: 'var(--space-4)'
          }}>
            {/* Animated Avatars representing the crowd */}
            {Array.from({ length: Math.min(crowdSize, 100) }).map((_, i) => {
              const row = Math.floor(i / 10)
              const col = i % 10
              const delay = (i * 0.1) % 3

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${col * 10}%`,
                    bottom: `${row * 12}%`,
                    fontSize: '2rem',
                    animation: `float 3s ease-in-out infinite`,
                    animationDelay: `${delay}s`,
                    opacity: 0.7 + (Math.random() * 0.3),
                    filter: `hue-rotate(${i * 36}deg)`
                  }}
                >
                  ✊
                </div>
              )
            })}

            {/* Floating Placards Overlay */}
            {messages.slice(0, 5).map((msg, i) => (
              <div
                key={msg.id}
                style={{
                  position: 'absolute',
                  left: `${15 + (i * 15)}%`,
                  top: `${10 + (i * 15)}%`,
                  transform: 'rotate(-5deg)',
                  animation: `float ${3 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  zIndex: 10
                }}
              >
                <div style={{
                  background: 'white',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  maxWidth: '150px',
                  border: '3px solid var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  {msg.message}
                </div>
              </div>
            ))}

            {/* Live indicator */}
            <div style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              background: '#EF4444',
              color: 'white',
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.875rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'white',
                animation: 'pulse 1s ease-in-out infinite'
              }} />
              LIVE
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 'var(--space-4)',
            background: 'rgba(99,102,241,0.1)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            {crowdSize.toLocaleString()} virtual protesters walking for this cause right now
          </div>
        </div>

        {/* Placards Wall */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              📢 Raise Your Placard
            </h3>

            <form onSubmit={handleSubmitMessage}>
              <div className="form-group">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write your message for this cause..."
                  className="form-textarea"
                  maxLength={500}
                  rows={4}
                  style={{ fontSize: '1rem' }}
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--space-1)'
                }}>
                  {newMessage.length}/500 characters
                </div>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || submitting}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Send size={20} />
                {submitting ? 'Posting...' : 'Post Placard'}
              </button>
            </form>
          </div>

          {/* Messages Feed */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-4)' }}>
              Recent Placards ({messages.length})
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
                  <p>No placards yet. Be the first to raise your voice!</p>
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
                      fontSize: '1rem',
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
