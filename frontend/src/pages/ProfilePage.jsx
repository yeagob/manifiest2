import { useEffect, useState } from 'react'
import { useAuthStore, useStepsStore, useCausesStore } from '../context/store'
import { Footprints, Heart, TrendingUp, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

function ProfilePage() {
  const { user } = useAuthStore()
  const { stats, fetchStats } = useStepsStore()
  const { causes, fetchCauses } = useCausesStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchCauses()])
      setLoading(false)
    }
    loadData()
  }, [fetchStats, fetchCauses])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  const myCauses = causes.filter(c => c.supporters.includes(user?.id))

  // Prepare chart data
  const chartData = stats?.causeStats?.map(cs => ({
    name: cs.cause.title.length > 20 ? cs.cause.title.substring(0, 20) + '...' : cs.cause.title,
    steps: cs.steps,
    icon: cs.cause.icon
  })) || []

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Profile</h1>

      {/* User Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          {user?.picture && (
            <img
              src={user.picture}
              alt={user.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '4px solid var(--primary)'
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{user?.name}</h2>
            <p style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem'
            }}>
              {user?.email}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  Total Steps
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Footprints size={24} />
                  {stats?.totalSteps?.toLocaleString() || 0}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  Causes Supported
                </div>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Heart size={24} />
                  {stats?.causesSupported || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats?.causeStats && stats.causeStats.length > 0 && (
        <>
          {/* Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Bar Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Steps by Cause</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="steps" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="steps"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Cause Stats */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Cause Breakdown</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {stats.causeStats
                .sort((a, b) => b.steps - a.steps)
                .map((cs, index) => {
                  const percentage = (cs.steps / stats.totalSteps) * 100
                  const distribution = user?.stepDistribution?.[cs.cause.id]

                  return (
                    <div
                      key={cs.cause.id}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: '0.75rem',
                        border: index === 0 ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        {index === 0 && (
                          <Award size={24} color="var(--warning)" />
                        )}
                        <div style={{ fontSize: '2.5rem' }}>{cs.cause.icon}</div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ marginBottom: '0.25rem' }}>{cs.cause.title}</h4>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase'
                          }}>
                            {cs.cause.category}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1.75rem',
                            fontWeight: 'bold',
                            color: 'var(--primary)'
                          }}>
                            {cs.steps.toLocaleString()}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)'
                          }}>
                            steps
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            height: '8px',
                            backgroundColor: 'var(--border)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: COLORS[index % COLORS.length],
                              transition: 'width 0.3s'
                            }} />
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          minWidth: '60px',
                          textAlign: 'right'
                        }}>
                          {percentage.toFixed(1)}%
                        </div>
                      </div>

                      {distribution && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)'
                        }}>
                          Configuration: Every <strong>{distribution.interval}</strong> step{distribution.interval > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </>
      )}

      {/* No Data State */}
      {(!stats?.causeStats || stats.causeStats.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TrendingUp size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
          <h3>No step data yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Start tracking your steps to see your progress here
          </p>
          <a href="/tracker" className="btn btn-primary">
            <Footprints size={20} />
            Go to Tracker
          </a>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
