import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for detecting steps using Device Motion API
 * Uses acceleration data to detect step-like movements
 */
function useStepDetector() {
  const [steps, setSteps] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  const lastStepTime = useRef(0)
  const accelerationHistory = useRef([])
  const STEP_THRESHOLD = 1.5 // Acceleration threshold for step detection
  const MIN_STEP_INTERVAL = 200 // Minimum time between steps (ms)

  const handleMotion = useCallback((event) => {
    if (!isActive) return

    const acceleration = event.accelerationIncludingGravity
    if (!acceleration) return

    // Calculate magnitude of acceleration
    const magnitude = Math.sqrt(
      Math.pow(acceleration.x || 0, 2) +
      Math.pow(acceleration.y || 0, 2) +
      Math.pow(acceleration.z || 0, 2)
    )

    // Add to history
    accelerationHistory.current.push(magnitude)
    if (accelerationHistory.current.length > 10) {
      accelerationHistory.current.shift()
    }

    // Calculate average
    const average = accelerationHistory.current.reduce((a, b) => a + b, 0) / accelerationHistory.current.length

    // Detect peaks (steps)
    const currentTime = Date.now()
    const timeSinceLastStep = currentTime - lastStepTime.current

    if (
      magnitude > average + STEP_THRESHOLD &&
      timeSinceLastStep > MIN_STEP_INTERVAL
    ) {
      lastStepTime.current = currentTime
      setSteps(prev => prev + 1)
    }
  }, [isActive])

  useEffect(() => {
    // Check if DeviceMotionEvent is supported
    if (typeof DeviceMotionEvent === 'undefined') {
      setIsSupported(false)
      return
    }

    if (!isActive) return

    // Request permission for iOS 13+ devices
    const requestPermission = async () => {
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function'
      ) {
        try {
          const permission = await DeviceMotionEvent.requestPermission()
          if (permission !== 'granted') {
            setIsSupported(false)
            setIsActive(false)
            return
          }
        } catch (error) {
          console.error('Permission denied:', error)
          setIsSupported(false)
          setIsActive(false)
          return
        }
      }

      window.addEventListener('devicemotion', handleMotion)
    }

    requestPermission()

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [isActive, handleMotion])

  const start = useCallback(() => {
    if (!isSupported) {
      alert('Step detection is not supported on this device. Please use manual entry.')
      return
    }
    setIsActive(true)
  }, [isSupported])

  const stop = useCallback(() => {
    setIsActive(false)
  }, [])

  const reset = useCallback(() => {
    setSteps(0)
    accelerationHistory.current = []
    lastStepTime.current = 0
  }, [])

  return {
    steps,
    isActive,
    isSupported,
    start,
    stop,
    reset
  }
}

export default useStepDetector
