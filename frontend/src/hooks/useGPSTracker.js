import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * GPS-based step and distance tracker
 * Uses Geolocation API to track real-time movement
 * Calculates: distance, speed, and estimated steps
 */

// Average step length in meters (adjustable per user)
const AVERAGE_STEP_LENGTH = 0.762 // ~30 inches

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Convert distance in meters to estimated steps
 * @param {number} distanceInMeters
 * @returns {number} Estimated number of steps
 */
function distanceToSteps(distanceInMeters) {
  return Math.round(distanceInMeters / AVERAGE_STEP_LENGTH)
}

function useGPSTracker() {
  const [isActive, setIsActive] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [permission, setPermission] = useState('prompt') // prompt, granted, denied

  // Tracking data
  const [totalDistance, setTotalDistance] = useState(0) // meters
  const [steps, setSteps] = useState(0)
  const [currentSpeed, setCurrentSpeed] = useState(0) // m/s
  const [averageSpeed, setAverageSpeed] = useState(0) // m/s
  const [duration, setDuration] = useState(0) // seconds
  const [currentLocation, setCurrentLocation] = useState(null)

  // Internal tracking state
  const watchId = useRef(null)
  const lastPosition = useRef(null)
  const startTime = useRef(null)
  const trackingHistory = useRef([])
  const durationInterval = useRef(null)

  // Calculate average speed from history
  const calculateAverageSpeed = useCallback(() => {
    if (trackingHistory.current.length === 0) return 0
    const totalSpeed = trackingHistory.current.reduce((sum, point) => sum + (point.speed || 0), 0)
    return totalSpeed / trackingHistory.current.length
  }, [])

  // Handle position update from GPS
  const handlePositionUpdate = useCallback((position) => {
    const { latitude, longitude, speed: gpsSpeed } = position.coords
    const timestamp = position.timestamp

    setCurrentLocation({
      latitude,
      longitude,
      accuracy: position.coords.accuracy,
      timestamp
    })

    if (lastPosition.current) {
      const { latitude: lastLat, longitude: lastLon, timestamp: lastTime } = lastPosition.current

      // Calculate distance from last position
      const distance = calculateDistance(lastLat, lastLon, latitude, longitude)

      // Only count if distance is significant (> 1 meter) to avoid GPS noise
      if (distance > 1 && distance < 100) { // Also filter out unrealistic jumps
        setTotalDistance(prev => prev + distance)

        // Calculate steps from distance
        const newSteps = distanceToSteps(distance)
        setSteps(prev => prev + newSteps)

        // Calculate speed (prefer GPS speed if available and reliable)
        const timeDiff = (timestamp - lastTime) / 1000 // seconds
        let speed = 0

        if (gpsSpeed !== null && gpsSpeed >= 0) {
          speed = gpsSpeed // m/s from GPS
        } else if (timeDiff > 0) {
          speed = distance / timeDiff // m/s calculated
        }

        setCurrentSpeed(speed)

        // Add to tracking history
        trackingHistory.current.push({
          latitude,
          longitude,
          distance,
          speed,
          timestamp,
          accuracy: position.coords.accuracy
        })

        // Update average speed
        setAverageSpeed(calculateAverageSpeed())
      }
    }

    // Update last position
    lastPosition.current = {
      latitude,
      longitude,
      timestamp
    }
  }, [calculateAverageSpeed])

  // Handle GPS errors
  const handlePositionError = useCallback((error) => {
    console.error('GPS Error:', error)

    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermission('denied')
        setIsSupported(false)
        alert('GPS permission denied. Please enable location services to track your steps.')
        break
      case error.POSITION_UNAVAILABLE:
        alert('GPS position unavailable. Make sure you are outdoors or near a window.')
        break
      case error.TIMEOUT:
        console.warn('GPS timeout, retrying...')
        break
      default:
        console.error('Unknown GPS error:', error)
    }
  }, [])

  // Start tracking
  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setIsSupported(false)
      alert('Geolocation is not supported by your browser.')
      return
    }

    // Reset tracking data
    setTotalDistance(0)
    setSteps(0)
    setCurrentSpeed(0)
    setAverageSpeed(0)
    setDuration(0)
    lastPosition.current = null
    trackingHistory.current = []
    startTime.current = Date.now()

    // Start GPS tracking with high accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    watchId.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    )

    // Start duration counter
    durationInterval.current = setInterval(() => {
      if (startTime.current) {
        setDuration(Math.floor((Date.now() - startTime.current) / 1000))
      }
    }, 1000)

    setIsActive(true)
    setPermission('granted')
  }, [handlePositionUpdate, handlePositionError])

  // Stop tracking
  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }

    if (durationInterval.current) {
      clearInterval(durationInterval.current)
      durationInterval.current = null
    }

    setIsActive(false)
  }, [])

  // Reset tracking data
  const reset = useCallback(() => {
    setTotalDistance(0)
    setSteps(0)
    setCurrentSpeed(0)
    setAverageSpeed(0)
    setDuration(0)
    setCurrentLocation(null)
    lastPosition.current = null
    trackingHistory.current = []
    startTime.current = null
  }, [])

  // Get session summary
  const getSessionSummary = useCallback(() => {
    return {
      distance: totalDistance,
      steps,
      duration,
      averageSpeed,
      currentSpeed,
      trackingPoints: trackingHistory.current.length,
      startTime: startTime.current,
      endTime: Date.now()
    }
  }, [totalDistance, steps, duration, averageSpeed, currentSpeed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current)
      }
    }
  }, [])

  return {
    // State
    isActive,
    isSupported,
    permission,

    // Tracking data
    steps,
    totalDistance, // meters
    currentSpeed, // m/s
    averageSpeed, // m/s
    duration, // seconds
    currentLocation,

    // Controls
    start,
    stop,
    reset,
    getSessionSummary,

    // Calculated values
    distanceKm: totalDistance / 1000,
    speedKmh: currentSpeed * 3.6,
    averageSpeedKmh: averageSpeed * 3.6,
    pace: averageSpeed > 0 ? 1000 / (averageSpeed * 60) : 0 // min/km
  }
}

export default useGPSTracker
