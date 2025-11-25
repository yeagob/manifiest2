import { useState } from 'react'
import { X, Shuffle, Save, Smile, User, Palette, Sparkles } from 'lucide-react'
import AvatarSVG from './AvatarSVG'
import api from '../services/api'

// Simplified Avatar configuration
const AVATAR_OPTIONS = {
  base: [
    { value: 'face', label: 'Rostro', icon: '😊' },
    { value: 'fist', label: 'Puño', icon: '✊' }
  ],
  // "Moods" combine Eyes and Mouth for simpler selection
  moods: [
    { id: 'determined', label: 'Determinado', eyes: 'determined', mouth: 'serious', icon: '😤' },
    { id: 'happy', label: 'Esperanzado', eyes: 'hopeful', mouth: 'smile', icon: '✨' },
    { id: 'angry', label: 'Indignado', eyes: 'angry', mouth: 'shouting', icon: '📢' },
    { id: 'peaceful', label: 'Pacífico', eyes: 'closed', mouth: 'smile', icon: '😌' },
    { id: 'loud', label: 'Ruidoso', eyes: 'determined', mouth: 'shouting', icon: '🗣️' },
    { id: 'musical', label: 'Musical', eyes: 'hopeful', mouth: 'singing', icon: '🎵' },
    { id: 'compassionate', label: 'Compasivo', eyes: 'compassionate', mouth: 'serious', icon: '🥺' },
    { id: 'whistling', label: 'Despreocupado', eyes: 'hopeful', mouth: 'whistle', icon: '😗' }
  ],
  accessories: [
    { value: 'none', label: 'Nada', icon: '∅' },
    { value: 'bandana', label: 'Pañuelo', icon: '🧣' },
    { value: 'cap', label: 'Gorra', icon: '🧢' },
    { value: 'flowers', label: 'Flores', icon: '🌸' },
    { value: 'megaphone', label: 'Megáfono', icon: '📣' },
    { value: 'sign', label: 'Cartel', icon: '🪧' }
  ],
  skinTones: [
    { value: 'tone1', color: '#FFE0BD' },
    { value: 'tone2', color: '#FFCD94' },
    { value: 'tone3', color: '#E0AC69' },
    { value: 'tone4', color: '#C68642' },
    { value: 'tone5', color: '#8D5524' }
  ],
  bgColors: [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarillo' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#EC4899', label: 'Rosa' }
  ]
}

function AvatarEditor({ isOpen, onClose, currentAvatar, onSave }) {
  const [config, setConfig] = useState({
    base: currentAvatar?.base || 'face',
    eyes: currentAvatar?.eyes || 'determined',
    mouth: currentAvatar?.mouth || 'serious',
    accessory: currentAvatar?.accessory || 'none',
    bgColor: currentAvatar?.bgColor || '#3B82F6',
    skinTone: currentAvatar?.skinTone || 'tone3'
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('identity') // identity, mood, style

  if (!isOpen) return null

  const handleRandomize = () => {
    const randomMood = AVATAR_OPTIONS.moods[Math.floor(Math.random() * AVATAR_OPTIONS.moods.length)]

    setConfig({
      base: Math.random() > 0.8 ? 'fist' : 'face', // Mostly faces
      eyes: randomMood.eyes,
      mouth: randomMood.mouth,
      accessory: AVATAR_OPTIONS.accessories[Math.floor(Math.random() * AVATAR_OPTIONS.accessories.length)].value,
      bgColor: AVATAR_OPTIONS.bgColors[Math.floor(Math.random() * AVATAR_OPTIONS.bgColors.length)].value,
      skinTone: AVATAR_OPTIONS.skinTones[Math.floor(Math.random() * AVATAR_OPTIONS.skinTones.length)].value
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAvatar(config)
      onSave(config)
      onClose()
    } catch (error) {
      console.error('Failed to save avatar:', error)
      alert('Error al guardar el avatar')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const setMood = (mood) => {
    setConfig(prev => ({
      ...prev,
      eyes: mood.eyes,
      mouth: mood.mouth
    }))
  }

  const tabs = [
    { id: 'identity', label: 'Identidad', icon: <User size={18} /> },
    { id: 'mood', label: 'Estado de Ánimo', icon: <Smile size={18} />, hideFor: ['fist'] },
    { id: 'style', label: 'Estilo', icon: <Palette size={18} /> }
  ]

  const visibleTabs = tabs.filter(tab => !tab.hideFor?.includes(config.base))

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        padding: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
        background: 'var(--bg-primary)',
        borderRadius: '1.5rem'
      }}>
        {/* Header with Preview */}
        <div style={{
          background: `linear-gradient(135deg, ${config.bgColor}40 0%, var(--bg-primary) 100%)`,
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-primary)'
            }}
          >
            <X size={20} />
          </button>

          <div style={{
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
            transform: 'scale(1.2)',
            marginBottom: '1rem'
          }}>
            <AvatarSVG config={config} size={140} />
          </div>

          <button
            onClick={handleRandomize}
            className="btn btn-secondary btn-sm"
            style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              borderRadius: '2rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Shuffle size={14} />
            <span>Sorpréndeme</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          padding: '0 1rem'
        }}>
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              <span style={{ fontSize: '0.9rem' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'var(--bg-secondary)'
        }}>
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Tipo de Avatar</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {AVATAR_OPTIONS.base.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig('base', option.value)}
                      className={`card ${config.base === option.value ? 'selected' : ''}`}
                      style={{
                        padding: '1rem',
                        textAlign: 'center',
                        border: config.base === option.value ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{option.icon}</div>
                      <div style={{ fontWeight: 600 }}>{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Tono de Piel</label>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  {AVATAR_OPTIONS.skinTones.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig('skinTone', option.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: option.color,
                        border: config.skinTone === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                        cursor: 'pointer',
                        transform: config.skinTone === option.value ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mood Tab */}
          {activeTab === 'mood' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {AVATAR_OPTIONS.moods.map(mood => {
                const isSelected = config.eyes === mood.eyes && config.mouth === mood.mouth
                return (
                  <button
                    key={mood.id}
                    onClick={() => setMood(mood)}
                    className="card"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      border: isSelected ? '2px solid var(--primary)' : '2px solid transparent',
                      backgroundColor: isSelected ? 'var(--bg-primary)' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontSize: '2rem' }}>{mood.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mood.label}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Style Tab */}
          {activeTab === 'style' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="form-label">Accesorio</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {AVATAR_OPTIONS.accessories.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig('accessory', option.value)}
                      className="card"
                      style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        border: config.accessory === option.value ? '2px solid var(--primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{option.icon}</div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Color de Fondo</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {AVATAR_OPTIONS.bgColors.map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateConfig('bgColor', option.value)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: option.value,
                        border: config.bgColor === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                        cursor: 'pointer',
                        transform: config.bgColor === option.value ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-primary)'
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {saving ? 'Guardando...' : (
              <>
                <Save size={20} />
                Guardar Mi Avatar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarEditor
