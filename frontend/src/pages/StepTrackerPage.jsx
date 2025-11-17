import { useState, useEffect } from 'react'
import { useStepsStore, useCausesStore, useAuthStore } from '../context/store'
import { Footprints, Play, Pause, Plus, Activity } from 'lucide-react'
import useStepDetector from '../hooks/useStepDetector'

function StepTrackerPage() {
  const { user } = useAuthStore()
  const { recordSteps, fetchStats, stats } = useStepsStore()
  const { causes, fetchCauses } = useCausesStore()

  const [manualSteps, setManualSteps] = useState('')
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastRecorded, setLastRecorded] = useState(null)

  const { steps: detectedSteps, isActive, start, stop, reset } = useStepDetector()

  useEffect(() => {
    fetchCauses()
    fetchStats()
  }, [fetchCauses, fetchStats])

  const myCauses = causes.filter(c => c.supporters.includes(user?.id))

  const handleStartTracking = () => {
    start()
    setRecording(true)
    reset()
  }

  const handleStopAndRecord = async () => {
    stop()
    setRecording(false)

    if (detectedSteps > 0) {
      await handleRecordSteps(detectedSteps)
      reset()
    }
  }

  const handleRecordManual = async (e) => {
    e.preventDefault()
    const steps = parseInt(manualSteps)
    if (steps > 0) {
      await handleRecordSteps(steps)
      setManualSteps('')
    }
  }

  const handleRecordSteps = async (steps) => {
    if (myCauses.length === 0) {
      alert('Please support at least one cause before recording steps!')
      return
    }

    setSubmitting(true)
    try {
      const result = await recordSteps(steps)
      setLastRecorded(result)
      await fetchStats()

      // Auto-dismiss after 3 seconds
      setTimeout(() => setLastRecorded(null), 3000)
    } catch (error) {
      console.error('Failed to record steps:', error)
      alert('Failed to record steps. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Step Tracker</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Track your steps and distribute them to your supported causes
      </p>

      {/* Success Message */}
      {lastRecorded && (
        <div style={{
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          padding: '1rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Footprints size={24} />
          <div>
            <strong>{lastRecorded.totalSteps} steps recorded!</strong>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Distributed across {Object.keys(lastRecorded.distribution).length} cause(s)
            </div>
          </div>
        </div>
      )}

      {/* No Causes Warning */}
      {myCauses.length === 0 && (
        <div style={{
          backgroundColor: '#FEF3C7',
          color: '#92400E',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <strong>No causes supported yet</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            Please support at least one cause before tracking steps. Visit the{' '}
            <a href="/causes" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Causes page
            </a>{' '}
            to get started.
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Automatic Tracking Card */}
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <Activity size={32} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Auto Tracking</h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Track steps automatically
              </p>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '2rem 0',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>
              {detectedSteps}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Steps Detected
            </div>
          </div>

          {!isActive ? (
            <button
              onClick={handleStartTracking}
              disabled={myCauses.length === 0 || submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Play size={20} />
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStopAndRecord}
              disabled={submitting}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              <Pause size={20} />
              Stop & Record
            </button>
          )}

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            {isActive ? (
              <>⏺ Recording... Move your device to detect steps</>
            ) : (
              <>Uses device motion sensors for step detection</>
            )}
          </div>
        </div>

        {/* Manual Entry Card */}
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '1rem',
              borderRadius: '0.75rem'
            }}>
              <Footprints size={32} color="var(--secondary)" />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>Manual Entry</h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Enter steps manually
              </p>
            </div>
          </div>

          <form onSubmit={handleRecordManual}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                Number of Steps
              </label>
              <input
                type="number"
                min="1"
                max="100000"
                value={manualSteps}
                onChange={(e) => setManualSteps(e.target.value)}
                placeholder="e.g., 5000"
                className="form-input"
                style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1.5rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={!manualSteps || parseInt(manualSteps) < 1 || myCauses.length === 0 || submitting}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              <Plus size={20} />
              Record Steps
            </button>
          </form>

          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            Great for importing steps from other trackers
          </div>
        </div>
      </div>

      {/* Step Distribution Preview */}
      {myCauses.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Step Distribution</h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            Your steps will be distributed according to these settings:
          </p>

          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {myCauses.map(cause => {
              const distribution = user?.stepDistribution?.[cause.id]
              if (!distribution) return null

              return (
                <div
                  key={cause.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>{cause.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {cause.title}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      Every <strong>{distribution.interval}</strong> step{distribution.interval > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    1/{distribution.interval}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}>
            <strong>Example:</strong> If you record 10 steps, they will be distributed based on the intervals above.
            You can adjust these settings on the{' '}
            <a href="/causes" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Causes page
            </a>.
          </div>
        </div>
      )}

      {/* Today's Stats */}
      {stats && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Your Stats</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Total Steps
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'var(--primary)'
              }}>
                {stats.totalSteps.toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Causes Supported
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'var(--secondary)'
              }}>
                {stats.causesSupported}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StepTrackerPage
