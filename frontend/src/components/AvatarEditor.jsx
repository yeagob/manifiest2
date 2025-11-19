import { useState, useEffect } from 'react'
import { X, Sparkles, Shuffle } from 'lucide-react'
import api from '../services/api'

// Avatar emoji categories with curated symbols
const AVATAR_EMOJIS = {
  hands: {
    name: 'Manos & Gestos',
    emojis: ['✊', '👊', '🤘', '✌️', '🙌', '👏', '🤝', '💪', '👍', '🤙', '✋', '🖐️']
  },
  faces: {
    name: 'Expresiones',
    emojis: ['😊', '😎', '🥰', '😤', '😇', '🤔', '😌', '🤗', '😏', '🥳', '🤩', '😁']
  },
  symbols: {
    name: 'Símbolos',
    emojis: ['✨', '⭐', '🔥', '💥', '⚡', '🌈', '☀️', '🌙', '💫', '🌟', '💖', '💜']
  },
  nature: {
    name: 'Naturaleza',
    emojis: ['🌍', '🌱', '🌳', '🌊', '🦋', '🐝', '🌻', '🌺', '🌸', '🍃', '🌿', '🌾']
  },
  objects: {
    name: 'Objetos',
    emojis: ['📢', '🎨', '🎵', '✏️', '📚', '🔔', '💡', '🚀', '🎯', '🏆', '🎪', '🎭']
  }
}

const COLORS = [
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Naranja', value: '#F97316' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Índigo', value: '#6366F1' },
  { name: 'Morado', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Gris', value: '#6B7280' },
  { name: 'Negro', value: '#1F2937' }
]

function AvatarEditor({ isOpen, onClose, currentAvatar, onSave }) {
  const [selectedEmoji, setSelectedEmoji] = useState(currentAvatar?.emoji || '✊')
  const [selectedColor, setSelectedColor] = useState(currentAvatar?.color || '#6366F1')
  const [activeCategory, setActiveCategory] = useState('hands')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (currentAvatar) {
      setSelectedEmoji(currentAvatar.emoji)
      setSelectedColor(currentAvatar.color)
    }
  }, [currentAvatar])

  const handleRandomize = () => {
    // Get random category
    const categories = Object.keys(AVATAR_EMOJIS)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]

    // Get random emoji from that category
    const emojis = AVATAR_EMOJIS[randomCategory].emojis
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]

    // Get random color
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]

    setSelectedEmoji(randomEmoji)
    setSelectedColor(randomColor.value)
    setActiveCategory(randomCategory)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAvatar(selectedEmoji, selectedColor)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onSave({ emoji: selectedEmoji, color: selectedColor })
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Failed to save avatar:', error)
      alert('Failed to save avatar. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '2rem',
        position: 'relative',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--bg-secondary)'
            e.target.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none'
            e.target.style.color = 'var(--text-secondary)'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={28} style={{ color: 'var(--primary)' }} />
            <h2 style={{ margin: 0 }}>Tu Símbolo de Protesta</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
            Personaliza tu identidad en las manifestaciones
          </p>
        </div>

        {/* Preview */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            margin: '0 auto',
            background: selectedColor,
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            boxShadow: `0 8px 32px ${selectedColor}40`,
            transition: 'all 0.3s ease',
            animation: showSuccess ? 'pulse 0.5s ease' : 'none'
          }}>
            {selectedEmoji}
          </div>
          <div style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            {showSuccess ? (
              <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                ✨ ¡Avatar guardado!
              </span>
            ) : (
              'Vista previa de tu avatar'
            )}
          </div>
        </div>

        {/* Random button */}
        <button
          onClick={handleRandomize}
          className="btn btn-secondary"
          style={{
            width: '100%',
            marginBottom: '1.5rem',
            justifyContent: 'center'
          }}
        >
          <Shuffle size={20} />
          Protesta Rápida (Aleatorio)
        </button>

        {/* Category tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {Object.entries(AVATAR_EMOJIS).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeCategory === key ? 'var(--primary)' : 'var(--bg-secondary)',
                color: activeCategory === key ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '0.5rem',
          background: 'var(--bg-secondary)',
          borderRadius: '0.75rem'
        }}>
          {AVATAR_EMOJIS[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setSelectedEmoji(emoji)}
              style={{
                fontSize: '2rem',
                padding: '0.75rem',
                border: selectedEmoji === emoji ? '3px solid var(--primary)' : '2px solid transparent',
                borderRadius: '0.5rem',
                background: selectedEmoji === emoji ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: selectedEmoji === emoji ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (selectedEmoji !== emoji) {
                  e.target.style.background = 'rgba(99, 102, 241, 0.05)'
                  e.target.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedEmoji !== emoji) {
                  e.target.style.background = 'transparent'
                  e.target.style.transform = 'scale(1)'
                }
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.75rem',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            Color de fondo
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.75rem'
          }}>
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                title={color.name}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '0.5rem',
                  background: color.value,
                  border: selectedColor === color.value ? '3px solid var(--text-primary)' : '2px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: selectedColor === color.value ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: selectedColor === color.value ? `0 4px 12px ${color.value}40` : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedColor !== color.value) {
                    e.target.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedColor !== color.value) {
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={saving}
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarEditor
