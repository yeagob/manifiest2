import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCausesStore, useAuthStore } from '../context/store'
import { Plus, Heart, Footprints, Users, HeartOff, Settings, Eye } from 'lucide-react'

function CausesPage() {
  const { user } = useAuthStore()
  const { causes, loading, fetchCauses, supportCause, unsupportCause } = useCausesStore()
  const [filter, setFilter] = useState('all') // all, supported, available
  const [category, setCategory] = useState('all')
  const [editingDistribution, setEditingDistribution] = useState(null)
  const [intervalValue, setIntervalValue] = useState(1)

  useEffect(() => {
    fetchCauses()
  }, [fetchCauses])

  const handleSupport = async (causeId) => {
    try {
      await supportCause(causeId, 1) // Default interval of 1 (every step)
    } catch (error) {
      console.error('Failed to support cause:', error)
    }
  }

  const handleUnsupport = async (causeId) => {
    if (window.confirm('Are you sure you want to stop supporting this cause?')) {
      try {
        await unsupportCause(causeId)
      } catch (error) {
        console.error('Failed to unsupport cause:', error)
      }
    }
  }

  const handleUpdateDistribution = async (causeId) => {
    try {
      await supportCause(causeId, intervalValue)
      setEditingDistribution(null)
    } catch (error) {
      console.error('Failed to update distribution:', error)
    }
  }

  const filteredCauses = causes.filter(cause => {
    const isSupported = cause.supporters.includes(user?.id)

    if (filter === 'supported' && !isSupported) return false
    if (filter === 'available' && isSupported) return false
    if (category !== 'all' && cause.category !== category) return false

    return true
  })

  const categories = ['all', ...new Set(causes.map(c => c.category))]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1>All Causes</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Support causes you believe in or create your own
          </p>
        </div>
        <Link to="/causes/new" className="btn btn-primary">
          <Plus size={20} />
          Create Cause
        </Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Filter by
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', 'supported', 'available'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)'
            }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
              style={{ minWidth: '200px' }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Showing {filteredCauses.length} of {causes.length} causes
          </div>
        </div>
      </div>

      {/* Causes Grid */}
      {filteredCauses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Heart size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
          <h3>No causes found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filter === 'supported'
              ? "You haven't supported any causes yet"
              : filter === 'available'
              ? 'All available causes are already supported by you'
              : 'No causes match your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredCauses.map(cause => {
            const isSupported = cause.supporters.includes(user?.id)
            const distribution = user?.stepDistribution?.[cause.id]
            const isEditing = editingDistribution === cause.id

            return (
              <div key={cause.id} className="card">
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '3rem' }}>{cause.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      marginBottom: '0.5rem'
                    }}>
                      <h3 style={{ margin: 0 }}>{cause.title}</h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        whiteSpace: 'nowrap'
                      }}>
                        {cause.category}
                      </span>
                    </div>
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      marginBottom: '1rem'
                    }}>
                      {cause.description}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '2rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Footprints size={16} color="var(--primary)" />
                    <strong>{cause.totalSteps.toLocaleString()}</strong> steps
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} color="var(--primary)" />
                    <strong>{cause.supporterCount}</strong> supporters
                  </div>
                </div>

                {isSupported && distribution && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    {isEditing ? (
                      <div>
                        <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                          Every how many steps?
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                            className="form-input"
                          />
                          <button
                            onClick={() => handleUpdateDistribution(cause.id)}
                            className="btn btn-primary btn-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingDistribution(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem'
                      }}>
                        <span>
                          <strong>Every {distribution.interval}</strong> step{distribution.interval > 1 ? 's' : ''} go to this cause
                        </span>
                        <button
                          onClick={() => {
                            setEditingDistribution(cause.id)
                            setIntervalValue(distribution.interval)
                          }}
                          className="btn btn-secondary btn-sm"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <Link
                    to={`/causes/${cause.id}/live`}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <Eye size={20} />
                    View Live
                  </Link>

                  {isSupported ? (
                    <button
                      onClick={() => handleUnsupport(cause.id)}
                      className="btn btn-danger"
                      style={{ flex: 1 }}
                    >
                      <HeartOff size={20} />
                      Stop Supporting
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSupport(cause.id)}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      <Heart size={20} />
                      Support This Cause
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CausesPage
