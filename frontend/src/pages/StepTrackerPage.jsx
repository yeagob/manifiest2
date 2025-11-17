import { useState, useEffect } from 'react'
import { useStepsStore, useCausesStore, useAuthStore } from '../context/store'
import { Footprints, Play, Pause, Plus, Navigation, Gauge, Clock } from 'lucide-react'
import useGPSTracker from '../hooks/useGPSTracker'

function StepTrackerPage() {
  const { user } = useAuthStore()
  const { recordSteps, fetchStats, stats } = useStepsStore()
  const { causes, fetchCauses } = useCausesStore()

  const [manualSteps, setManualSteps] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lastRecorded, setLastRecorded] = useState(null)

  // Use GPS tracker instead of accelerometer
  const {
    isActive,
    isSupported,
    permission,
    steps,
    totalDistance,
    distanceKm,
    currentSpeed,
    speedKmh,
    averageSpeed,
    averageSpeedKmh,
    duration,
    currentLocation,
    start,
    stop,
    reset,
    getSessionSummary
  } = useGPSTracker()

  useEffect(() => {
    fetchCauses()
    fetchStats()
  }, [fetchCauses, fetchStats])

  const myCauses = causes.filter(c => c.supporters.includes(user?.id))

  const handleStartTracking = () => {
    start()
  }

  const handleStopAndRecord = async () => {
    stop()

    const summary = getSessionSummary()

    if (summary.steps > 0) {
      await handleRecordSteps(summary.steps, summary)
      reset()
    } else {
      alert('No steps detected. Make sure you walked enough distance (GPS needs movement).')
    }
  }

  const handleRecordManual = async (e) => {
    e.preventDefault()
    const stepsCount = parseInt(manualSteps)
    if (stepsCount > 0) {
      await handleRecordSteps(stepsCount, null)
      setManualSteps('')
    }
  }

  const handleRecordSteps = async (stepsCount, sessionData = null) => {
    if (myCauses.length === 0) {
      alert('Please support at least one cause before recording steps!')
      return
    }

    setSubmitting(true)
    try {
      const result = await recordSteps(stepsCount)
      setLastRecorded({
        ...result,
        sessionData
      })
      await fetchStats()

      // Auto-dismiss after 5 seconds
      setTimeout(() => setLastRecorded(null), 5000)
    } catch (error) {
      console.error('Failed to record steps:', error)
      alert('Failed to record steps. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Format time from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>GPS Step Tracker</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Track your walks using real-time GPS location. Distance, speed, and steps are calculated automatically.
      </p>

      {/* Success Message */}
      {lastRecorded && (
        <div style={{
          backgroundColor: '#D1FAE5',
          color: '#065F46',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Footprints size={24} />
            <div>
              <strong style={{ fontSize: '1.125rem' }}>{lastRecorded.totalSteps} steps recorded!</strong>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Distributed across {Object.keys(lastRecorded.distribution).length} cause(s)
              </div>
            </div>
          </div>
          {lastRecorded.sessionData && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <strong>Distance:</strong> {(lastRecorded.sessionData.distance / 1000).toFixed(2)} km
              </div>
              <div>
                <strong>Duration:</strong> {formatDuration(lastRecorded.sessionData.duration)}
              </div>
              <div>
                <strong>Avg Speed:</strong> {(lastRecorded.sessionData.averageSpeed * 3.6).toFixed(1)} km/h
              </div>
            </div>
          )}
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

      {/* GPS Permission Warning */}
      {!isSupported && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <strong>GPS not available</strong>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            Your browser doesn't support GPS tracking or you denied location permissions.
            Please enable location services or use manual entry.
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* GPS Tracking Card */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
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
              <Navigation size={32} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ marginBottom: '0.25rem' }}>GPS Tracking</h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Real-time location-based step counting
              </p>
            </div>
          </div>

          {/* Real-time Stats Display */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
            padding: '1.5rem',
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                {steps}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Steps
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: isActive ? 'var(--secondary)' : 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                {distanceKm.toFixed(2)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Kilometers
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: isActive ? 'var(--warning)' : 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                {speedKmh.toFixed(1)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                km/h
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: isActive ? 'var(--danger)' : 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                {formatDuration(duration)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Duration
              </div>
            </div>
          </div>

          {/* GPS Location Info */}
          {currentLocation && isActive && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Navigation size={16} color="var(--secondary)" />
                <strong>GPS Active</strong>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Accuracy: ±{currentLocation.accuracy.toFixed(0)}m |
                Lat: {currentLocation.latitude.toFixed(6)} |
                Lon: {currentLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {!isActive ? (
              <button
                onClick={handleStartTracking}
                disabled={myCauses.length === 0 || submitting || !isSupported}
                className="btn btn-primary"
                style={{ gridColumn: 'span 2' }}
              >
                <Play size={20} />
                Start GPS Tracking
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopAndRecord}
                  disabled={submitting}
                  className="btn btn-danger"
                >
                  <Pause size={20} />
                  Stop & Record
                </button>
                <button
                  onClick={() => {
                    stop()
                    reset()
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

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
              <>⏺ GPS Recording... Walk to accumulate steps. Steps are calculated from distance traveled.</>
            ) : (
              <>Uses GPS to track your actual walking distance and calculate steps (avg: 0.762m per step)</>
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
                disabled={isActive}
              />
            </div>

            <button
              type="submit"
              disabled={!manualSteps || parseInt(manualSteps) < 1 || myCauses.length === 0 || submitting || isActive}
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
            Import steps from other fitness trackers
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
            <strong>How it works:</strong> GPS tracks your walking distance in real-time.
            Steps are calculated automatically (1 step ≈ 0.762 meters).
            Configure intervals on the{' '}
            <a href="/causes" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Causes page
            </a>.
          </div>
        </div>
      )}

      {/* User Stats */}
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
