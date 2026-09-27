import { useEffect, useRef, useState } from 'react'

export function useEcoTicker(eco) {
  const fetchedAt = useRef(Date.now())
  const [pending, setPending] = useState(eco?.pending ?? 0)
  useEffect(() => {
    fetchedAt.current = Date.now()
    if (!eco) return
    const cap = eco.ratePerHour * eco.storageHours
    const tick = () => setPending(Math.min(cap, eco.pending + (eco.ratePerHour * (Date.now() - fetchedAt.current)) / 3600000))
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [eco])
  const cap = eco ? eco.ratePerHour * eco.storageHours : 0
  return { pending, cap, full: cap > 0 && pending >= cap - 0.01 }
}
