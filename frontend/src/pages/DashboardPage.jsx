import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCausesStore, useStepsStore, useAuthStore } from '../context/store'
import { Heart, TrendingUp, Users, Plus, Footprints } from 'lucide-react'

function DashboardPage() {
  const { user } = useAuthStore()
  const { causes, fetchCauses } = useCausesStore()
  const { stats, fetchStats } = useStepsStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchCauses(), fetchStats()])
      setLoading(false)
    }
    loadData()
  }, [fetchCauses, fetchStats])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  const topCauses = causes.slice(0, 6)
  const myCauses = causes.filter(c => c.supporters.includes(user?.id))

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '1rem',
        padding: '3rem',
        color: 'white',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>
          Keep walking for the causes you believe in
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Footprints size={24} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Steps</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats?.totalSteps?.toLocaleString() || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Heart size={24} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Causes Supported</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stats?.causesSupported || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '0.75rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={24} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Active Causes</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {causes.length}
            </div>
          </div>
        </div>
      </div>

      {/* My Causes */}
      {myCauses.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2>My Causes</h2>
            <Link to="/tracker" className="btn btn-primary btn-sm">
              <Footprints size={16} />
              Track Steps
            </Link>
          </div>

          <div className="grid grid-2">
            {myCauses.map(cause => {
              const mySteps = stats?.causeStats?.find(cs => cs.cause.id === cause.id)?.steps || 0
              const distribution = user?.stepDistribution?.[cause.id]
              return (
                <div key={cause.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                      fontSize: '2.5rem',
                      flexShrink: 0
                    }}>
                      {cause.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>{cause.title}</h3>
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        marginBottom: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {cause.description}
                      </p>

                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>{mySteps.toLocaleString()}</strong> your steps
                        </div>
                        {distribution && (
                          <div>
                            Every <strong>{distribution.interval}</strong> step{distribution.interval > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Most Active Causes */}
      <section>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2>Most Active Causes</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/causes/new" className="btn btn-primary btn-sm">
              <Plus size={16} />
              Create Cause
            </Link>
            <Link to="/causes" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
        </div>

        {topCauses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Heart size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
            <h3>No causes yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Be the first to create a cause and start walking!
            </p>
            <Link to="/causes/new" className="btn btn-primary">
              <Plus size={20} />
              Create Your First Cause
            </Link>
          </div>
        ) : (
          <div className="grid grid-3">
            {topCauses.map(cause => (
              <div key={cause.id} className="card">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '2rem' }}>{cause.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {cause.title}
                    </h4>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {cause.category}
                    </div>
                  </div>
                </div>

                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  minHeight: '3.9em'
                }}>
                  {cause.description}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Footprints size={16} />
                    <strong style={{ color: 'var(--primary)' }}>
                      {cause.totalSteps.toLocaleString()}
                    </strong> steps
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} />
                    <strong style={{ color: 'var(--primary)' }}>
                      {cause.supporterCount}
                    </strong> supporters
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
