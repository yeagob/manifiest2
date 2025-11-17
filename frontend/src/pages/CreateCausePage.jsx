import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCausesStore } from '../context/store'
import { ArrowLeft, Plus } from 'lucide-react'

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }

      await createCause(formData)
      navigate('/causes')
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
              {loading ? (
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
    </div>
  )
}

export default CreateCausePage
