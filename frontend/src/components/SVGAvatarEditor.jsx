import { useState } from 'react'
import { X, Shuffle, Save } from 'lucide-react'
import ProtestAvatar from './ProtestAvatar'

const SVGAvatarEditor = ({ isOpen, onClose, currentAvatar, onSave }) => {
  const [config, setConfig] = useState(currentAvatar || {
    base: 'face',
    eyes: 'determined',
    mouth: 'shouting',
    accessory: 'none',
    bgColor: '#3B82F6',
    skinTone: 'tone3'
  })

  const [activeTab, setActiveTab] = useState('base')

  const options = {
    base: [
      { id: 'face', name: 'Rostro', desc: 'Cara de protesta' },
      { id: 'fist', name: 'Puño', desc: 'Símbolo de resistencia' }
    ],
    eyes: [
      { id: 'determined', name: 'Determinados', desc: 'Mirada fuerte' },
      { id: 'hopeful', name: 'Esperanzados', desc: 'Llenos de luz' },
      { id: 'angry', name: 'Enojados', desc: 'Rabia justa' },
      { id: 'compassionate', name: 'Compasivos', desc: 'Con empatía' },
      { id: 'closed', name: 'Cerrados', desc: 'Meditación' },
      { id: 'starry', name: 'Estrellados', desc: 'Soñadores' }
    ],
    mouth: [
      { id: 'shouting', name: 'Gritando', desc: 'Consigna fuerte' },
      { id: 'smile', name: 'Sonrisa', desc: 'Esperanza' },
      { id: 'serious', name: 'Seria', desc: 'Determinación' },
      { id: 'whistling', name: 'Silbando', desc: 'Alegre' },
      { id: 'singing', name: 'Cantando', desc: 'Himno de lucha' },
      { id: 'silent', name: 'Silencio', desc: 'Protesta muda' }
    ],
    accessory: [
      { id: 'none', name: 'Sin accesorio', desc: 'Limpio' },
      { id: 'bandana', name: 'Pañuelo', desc: 'Solidaridad' },
      { id: 'cap', name: 'Gorra', desc: 'Activista' },
      { id: 'flowers', name: 'Flores', desc: 'Paz y amor' },
      { id: 'megaphone', name: 'Megáfono', desc: 'Voz amplificada' },
      { id: 'sign', name: 'Cartel', desc: 'Mensaje visual' }
    ],
    skinTone: [
      { id: 'tone1', name: 'Tono 1', color: '#FFDAB9' },
      { id: 'tone2', name: 'Tono 2', color: '#E8B98A' },
      { id: 'tone3', name: 'Tono 3', color: '#C68642' },
      { id: 'tone4', name: 'Tono 4', color: '#8D5524' },
      { id: 'tone5', name: 'Tono 5', color: '#5C4033' }
    ],
    bgColor: [
      { id: '#EF4444', name: 'Rojo', desc: 'Pasión' },
      { id: '#F97316', name: 'Naranja', desc: 'Energía' },
      { id: '#F59E0B', name: 'Amarillo', desc: 'Esperanza' },
      { id: '#10B981', name: 'Verde', desc: 'Vida' },
      { id: '#3B82F6', name: 'Azul', desc: 'Paz' },
      { id: '#6366F1', name: 'Índigo', desc: 'Justicia' },
      { id: '#8B5CF6', name: 'Violeta', desc: 'Igualdad' },
      { id: '#EC4899', name: 'Rosa', desc: 'Amor' }
    ]
  }

  const tabs = [
    { id: 'base', name: 'Base', icon: '👤' },
    { id: 'eyes', name: 'Ojos', icon: '👀' },
    { id: 'mouth', name: 'Boca', icon: '👄' },
    { id: 'accessory', name: 'Accesorio', icon: '🎩' },
    { id: 'skinTone', name: 'Tono', icon: '🎨' },
    { id: 'bgColor', name: 'Fondo', icon: '🌈' }
  ]

  const handleRandomize = () => {
    const randomConfig = {
      base: options.base[Math.floor(Math.random() * options.base.length)].id,
      eyes: options.eyes[Math.floor(Math.random() * options.eyes.length)].id,
      mouth: options.mouth[Math.floor(Math.random() * options.mouth.length)].id,
      accessory: options.accessory[Math.floor(Math.random() * options.accessory.length)].id,
      bgColor: options.bgColor[Math.floor(Math.random() * options.bgColor.length)].id,
      skinTone: options.skinTone[Math.floor(Math.random() * options.skinTone.length)].id
    }
    setConfig(randomConfig)
  }

  const handleSave = async () => {
    await onSave(config)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '2rem',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Tu Rostro de Protesta ✊</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
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

        {/* Preview and Random */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '1rem',
              border: '3px solid var(--primary)'
            }}>
              <ProtestAvatar config={config} size={120} />
            </div>
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
              Protesta Rápida
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          borderBottom: '2px solid var(--border)',
          paddingBottom: '0.5rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'skinTone' ? 'repeat(5, 1fr)' : activeTab === 'bgColor' ? 'repeat(4, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
          minHeight: '200px'
        }}>
          {activeTab === 'skinTone' ? (
            // Skin tone selector - color circles
            options.skinTone.map(option => (
              <button
                key={option.id}
                onClick={() => setConfig(prev => ({ ...prev, skinTone: option.id }))}
                style={{
                  padding: '1rem',
                  border: config.skinTone === option.id ? '3px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: option.color,
                  border: '2px solid var(--border)'
                }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                  {option.name}
                </span>
              </button>
            ))
          ) : activeTab === 'bgColor' ? (
            // Background color selector - color squares
            options.bgColor.map(option => (
              <button
                key={option.id}
                onClick={() => setConfig(prev => ({ ...prev, bgColor: option.id }))}
                style={{
                  padding: '1rem',
                  border: config.bgColor === option.id ? '3px solid var(--text-primary)' : '2px solid var(--border)',
                  borderRadius: '0.75rem',
                  backgroundColor: option.id,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {option.name}
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>
                  {option.desc}
                </span>
              </button>
            ))
          ) : (
            // Other options with preview
            options[activeTab]?.map(option => (
              <button
                key={option.id}
                onClick={() => setConfig(prev => ({ ...prev, [activeTab]: option.id }))}
                style={{
                  padding: '1rem',
                  border: config[activeTab] === option.id ? '3px solid var(--primary)' : '2px solid var(--border)',
                  borderRadius: '0.75rem',
                  backgroundColor: config[activeTab] === option.id ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                {/* Mini preview of this option */}
                <ProtestAvatar
                  config={{ ...config, [activeTab]: option.id }}
                  size={60}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {option.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {option.desc}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
          borderTop: '2px solid var(--border)',
          paddingTop: '1.5rem'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Save size={16} />
            Guardar Avatar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SVGAvatarEditor
