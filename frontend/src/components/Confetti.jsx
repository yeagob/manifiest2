import { useEffect, useRef } from 'react'

const COLORES = ['#FFD23F', '#EE4266', '#3BCEAC', '#540D6E', '#F3752B', '#0EAD69']

// Confetti de celebración (logros, subidas de nivel). Canvas propio, sin deps.
function Confetti({ activo, onFin }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!activo || !ref.current) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const piezas = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      size: 5 + Math.random() * 8,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
    }))
    let frame = 0
    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      piezas.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      })
      frame++
      if (frame < 220) raf = requestAnimationFrame(draw)
      else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (onFin) onFin()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [activo, onFin])

  if (!activo) return null
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90 }} />
}

export default Confetti
