import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorldScene } from '../components/ProtestCanvas.jsx'
import { api } from '../lib/api.js'
import { num } from '../lib/format.js'

export default function WorldPage() {
  const navigate = useNavigate()
  const [causes, setCauses] = useState(null)
  useEffect(() => { api.world().then(setCauses).catch(() => setCauses([])) }, [])
  if (!causes) return <p className="muted" style={{ padding: '2rem' }}>Cargando el mundo…</p>
  const people = causes.reduce((s, c) => s + c.uniquePeople, 0)
  return (
    <div className="scene-shell">
      <WorldScene causes={causes} onSelect={id => navigate(`/marcha/${id}`)} />
      <div className="scene-hud">
        <div className="scene-panel">
          <h2 style={{ margin: 0 }}>El mundo en marcha</h2>
          <p style={{ margin: 0 }}>{num(people)} personas en {causes.length} avenidas. La longitud de cada avenida es proporcional a sus pasos reales. Pulsa una para entrar.</p>
        </div>
      </div>
    </div>
  )
}
