import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCausesStore } from '../context/store'
import api from '../services/api'
import { ArrowLeft, Plus, AlertCircle, ExternalLink, Sparkles } from 'lucide-react'

const CAUSE_ICONS = ['✊', '🌍', '🌱', '🕊️', '🏳️‍🌈', '♻️', '💚', '🌊', '🌞', '🔥', '❤️', '✨', '🌟', '💪', '🤝']
const CAUSE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const CATEGORIES = ['environment', 'human-rights', 'social-justice', 'health', 'education', 'peace', 'animal-rights', 'other']

function CreateCausePage() {
  const navigate = useNavigate()
  const { createCause } = useCausesStore()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    icon: '✊',
    color: '#3B82F6'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [similarCause, setSimilarCause] = useState(null)
  const [showSimilarModal, setShowSimilarModal] = useState(false)
  const [checkingAI, setCheckingAI] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setCheckingAI(true)
    setError(null)

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }

      // Check for similar causes using AI
      console.log('🤖 Checking for similar causes with AI...')
      const aiResult = await api.checkSimilarCause({
        title: formData.title,
        description: formData.description,
        category: formData.category
      })

      setCheckingAI(false)

      // If AI found a similar cause, show modal for user decision
      if (aiResult.isSimilar && aiResult.matchedCause) {
        console.log('✨ Similar cause found:', aiResult)
        setSimilarCause(aiResult)
        setShowSimilarModal(true)
        setLoading(false)
        return // Don't create yet, wait for user decision
      }

      // No similar cause found, proceed with creation
      console.log('✅ No similar causes found, creating...')
      await createCauseAndNavigate()
    } catch (err) {
      console.error('Error creating cause:', err)
      setError(err.message || 'Failed to create cause')
      setLoading(false)
      setCheckingAI(false)
    }
  }

  // Function to actually create the cause and navigate
  const createCauseAndNavigate = async () => {
    await createCause(formData)
    navigate('/causes')
  }

  // Handle user decision from similar cause modal
  const handleGoToExistingCause = () => {
    setShowSimilarModal(false)
    navigate(`/causes/${similarCause.matchedCause.id}`)
  }

  const handleCreateAnyway = async () => {
    setShowSimilarModal(false)
    setLoading(true)
    try {
      await createCauseAndNavigate()
    } catch (err) {
      setError(err.message || 'Failed to create cause')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/causes')}
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem' }}
      >
        <ArrowLeft size={16} />
        Back to Causes
      </button>

      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Create a New Cause</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Start a movement and let others walk with you
        </p>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., End Plastic Pollution"
              className="form-input"
              required
              maxLength={100}
            />
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              {formData.title.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your cause and why it matters..."
              className="form-textarea"
              required
              maxLength={500}
              rows={5}
            />
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem'
            }}>
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div className="form-group">
            <label className="form-label">
              Icon
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '0.5rem'
            }}>
              {CAUSE_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  style={{
                    fontSize: '2rem',
                    padding: '0.75rem',
                    border: formData.icon === icon ? '3px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: '0.5rem',
                    backgroundColor: formData.icon === icon ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">
              Color
            </label>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {CAUSE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '0.5rem',
                    backgroundColor: color,
                    border: formData.color === color ? '3px solid var(--text-primary)' : '2px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Preview
            </h4>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <div style={{
                fontSize: '3rem',
                backgroundColor: formData.color,
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.75rem'
              }}>
                {formData.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ marginBottom: '0.5rem' }}>
                  {formData.title || 'Your Cause Title'}
                </h3>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  display: 'inline-block',
                  marginBottom: '0.5rem'
                }}>
                  {formData.category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  margin: 0
                }}>
                  {formData.description || 'Your cause description will appear here...'}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {checkingAI ? (
                <>
                  <Sparkles size={20} />
                  Checking with AI...
                </>
              ) : loading ? (
                'Creating...'
              ) : (
                <>
                  <Plus size={20} />
                  Create Cause
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/causes')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Similar Cause Modal */}
      {showSimilarModal && similarCause && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            padding: '2rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                backgroundColor: '#FEF3C7',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                color: '#92400E'
              }}>
                <Sparkles size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: '0.5rem' }}>
                  ¡Causa Similar Encontrada! ✨
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>
                  Nuestra IA detectó una causa parecida con {similarCause.confidence}% de confianza
                </p>
              </div>
            </div>

            {/* AI Explanation */}
            <div style={{
              backgroundColor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                margin: 0,
                color: '#075985',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                {similarCause.reason}
              </p>
            </div>

            {/* Existing Cause Card */}
            <div style={{
              border: '2px solid var(--primary)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  fontSize: '2.5rem',
                  backgroundColor: similarCause.matchedCause.color,
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem'
                }}>
                  {similarCause.matchedCause.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>
                    {similarCause.matchedCause.title}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)'
                  }}>
                    {similarCause.matchedCause.category.split('-').join(' ')}
                  </span>
                </div>
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {similarCause.matchedCause.description}
              </p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <span>👥 {similarCause.matchedCause.supporters} supporters</span>
                <span>🚶 {similarCause.matchedCause.totalSteps.toLocaleString()} steps</span>
              </div>
            </div>

            {/* Suggestion */}
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                margin: 0,
                color: '#166534',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                💡 {similarCause.suggestion}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                onClick={handleGoToExistingCause}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <ExternalLink size={20} />
                Ir a la Causa Existente
              </button>
              <button
                onClick={handleCreateAnyway}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Crear de Todas Formas
              </button>
              <button
                onClick={() => {
                  setShowSimilarModal(false)
                  setLoading(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                Volver a Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateCausePage
