import { useState } from 'react'
import { X, Shuffle, Save } from 'lucide-react'
import AvatarSVG from './AvatarSVG'
import api from '../services/api'

// Avatar configuration options
const AVATAR_OPTIONS = {
  base: [
    { value: 'face', label: 'Rostro', icon: '😊' },
    { value: 'fist', label: 'Puño', icon: '✊' }
  ],
  eyes: [
    { value: 'determined', label: 'Determinados', preview: '👁️' },
    { value: 'hopeful', label: 'Esperanzados', preview: '✨' },
    { value: 'angry', label: 'Enojados', preview: '😠' },
    { value: 'compassionate', label: 'Compasivos', preview: '🥺' },
    { value: 'closed', label: 'Cerrados', preview: '😌' },
    { value: 'star', label: 'Estrellados', preview: '⭐' }
  ],
  mouth: [
    { value: 'shouting', label: 'Gritando', preview: '📢' },
    { value: 'smile', label: 'Sonriendo', preview: '😊' },
    { value: 'serious', label: 'Seria', preview: '😐' },
    { value: 'whistle', label: 'Silbando', preview: '😗' },
    { value: 'singing', label: 'Cantando', preview: '🎵' },
    { value: 'silent', label: 'Silenciosa', preview: '🤐' }
  ],
  accessory: [
    { value: 'none', label: 'Sin accesorio', preview: '∅' },
    { value: 'bandana', label: 'Pañuelo', preview: '🔴' },
    { value: 'cap', label: 'Gorra', preview: '🧢' },
    { value: 'flowers', label: 'Flores', preview: '🌸' },
    { value: 'megaphone', label: 'Megáfono', preview: '📣' },
    { value: 'sign', label: 'Cartel', preview: '🪧' }
  ],
  skinTone: [
    { value: 'tone1', label: 'Tono 1', color: '#FFE0BD' },
    { value: 'tone2', label: 'Tono 2', color: '#FFCD94' },
    { value: 'tone3', label: 'Tono 3', color: '#E0AC69' },
    { value: 'tone4', label: 'Tono 4', color: '#C68642' },
    { value: 'tone5', label: 'Tono 5', color: '#8D5524' }
  ],
  bgColor: [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarillo' },
    { value: '#EF4444', label: 'Rojo' },
    { value: '#8B5CF6', label: 'Púrpura' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#14B8A6', label: 'Turquesa' },
    { value: '#F97316', label: 'Naranja' }
  ]
}

function AvatarEditor({ isOpen, onClose, currentAvatar, onSave }) {
  const [config, setConfig] = useState({
    base: currentAvatar?.base || 'face',
    eyes: currentAvatar?.eyes || 'determined',
    mouth: currentAvatar?.mouth || 'shouting',
    accessory: currentAvatar?.accessory || 'none',
    bgColor: currentAvatar?.bgColor || '#3B82F6',
    skinTone: currentAvatar?.skinTone || 'tone3'
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('base')
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen) return null

  const handleRandomize = () => {
    const randomConfig = {
      base: AVATAR_OPTIONS.base[Math.floor(Math.random() * AVATAR_OPTIONS.base.length)].value,
      eyes: AVATAR_OPTIONS.eyes[Math.floor(Math.random() * AVATAR_OPTIONS.eyes.length)].value,
      mouth: AVATAR_OPTIONS.mouth[Math.floor(Math.random() * AVATAR_OPTIONS.mouth.length)].value,
      accessory: AVATAR_OPTIONS.accessory[Math.floor(Math.random() * AVATAR_OPTIONS.accessory.length)].value,
      bgColor: AVATAR_OPTIONS.bgColor[Math.floor(Math.random() * AVATAR_OPTIONS.bgColor.length)].value,
      skinTone: AVATAR_OPTIONS.skinTone[Math.floor(Math.random() * AVATAR_OPTIONS.skinTone.length)].value
    }
    setConfig(randomConfig)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.updateAvatar(config)
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onSave(config)
        onClose()
      }, 1000)
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

  const tabs = [
    { id: 'base', label: 'Base', icon: '👤' },
    { id: 'eyes', label: 'Ojos', icon: '👁️', hideFor: ['fist'] },
    { id: 'mouth', label: 'Boca', icon: '👄', hideFor: ['fist'] },
    { id: 'accessory', label: 'Accesorio', icon: '🎩' },
    { id: 'skinTone', label: 'Tono', icon: '🎨' },
    { id: 'bgColor', label: 'Fondo', icon: '🌈' }
  ]

  const visibleTabs = tabs.filter(tab => !tab.hideFor?.includes(config.base))

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
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="card" style={{
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem',
        position: 'relative',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Tu Símbolo de Protesta ✊</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Crea tu identidad única en la manifestación
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: 'var(--text-secondary)'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '2rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '1rem'
        }}>
          <AvatarSVG config={config} size={160} />

          <button
            onClick={handleRandomize}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Shuffle size={16} />
            Aleatorio
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                border: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                borderRadius: '0.5rem',
                backgroundColor: activeTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Options */}
        <div style={{
          minHeight: '200px',
          marginBottom: '2rem'
        }}>
          {/* Base */}
          {activeTab === 'base' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.base.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('base', option.value)}
                  style={{
                    padding: '1.5rem 1rem',
                    border: config.base === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.base === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '2.5rem' }}>{option.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Eyes */}
          {activeTab === 'eyes' && config.base === 'face' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.eyes.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('eyes', option.value)}
                  style={{
                    padding: '1rem',
                    border: config.eyes === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.eyes === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{option.preview}</span>
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mouth */}
          {activeTab === 'mouth' && config.base === 'face' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.mouth.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('mouth', option.value)}
                  style={{
                    padding: '1rem',
                    border: config.mouth === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.mouth === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{option.preview}</span>
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Accessory */}
          {activeTab === 'accessory' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.accessory.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('accessory', option.value)}
                  style={{
                    padding: '1rem',
                    border: config.accessory === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.accessory === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{option.preview}</span>
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Skin Tone */}
          {activeTab === 'skinTone' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.skinTone.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('skinTone', option.value)}
                  style={{
                    padding: '1rem',
                    border: config.skinTone === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.skinTone === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    border: '2px solid var(--border)'
                  }} />
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Background Color */}
          {activeTab === 'bgColor' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: '1rem'
            }}>
              {AVATAR_OPTIONS.bgColor.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateConfig('bgColor', option.value)}
                  style={{
                    padding: '1rem',
                    border: config.bgColor === option.value ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.75rem',
                    backgroundColor: config.bgColor === option.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: option.value,
                    border: '2px solid var(--border)'
                  }} />
                  <span style={{ fontSize: '0.75rem' }}>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)'
        }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {showSuccess ? (
              <>✓ ¡Guardado!</>
            ) : saving ? (
              'Guardando...'
            ) : (
              <>
                <Save size={16} />
                Guardar Avatar
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarEditor
