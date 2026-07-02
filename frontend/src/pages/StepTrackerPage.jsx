import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStepsStore, useCausesStore, useAuthStore } from '../context/store'
import { Footprints, Play, Square, Navigation, Gauge, Clock, Watch, Smartphone, Satellite, Heart } from 'lucide-react'
import useGPSTracker from '../hooks/useGPSTracker'
import useStepDetector from '../hooks/useStepDetector'
import { nivelDesdeXp } from '../lib/gamification'
import Confetti from '../components/Confetti'

const MODOS = [
  { id: 'gps', nombre: 'GPS', icono: Satellite, desc: 'Marcha real por la calle: distancia y pasos por satélite' },
  { id: 'podometro', nombre: 'Podómetro', icono: Smartphone, desc: 'El móvil en el bolsillo cuenta tus pasos (sensor de movimiento)' },
  { id: 'reloj', nombre: 'Reloj / manual', icono: Watch, desc: 'Trae los pasos de tu reloj o pulsera (Garmin, Fitbit, Mi Band…)' },
]

const PRESETS_RELOJ = [1000, 2500, 5000, 10000]

function StepTrackerPage() {
  const { user } = useAuthStore()
  const { recordSteps, fetchStats, stats } = useStepsStore()
  const { causes, fetchCauses } = useCausesStore()

  const [modo, setModo] = useState('gps')
  const [manualSteps, setManualSteps] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState(null) // {pasos, xpAntes, xpDespues}
  const [pulso, setPulso] = useState(false)

  const gps = useGPSTracker()
  const pod = useStepDetector()

  const activo = modo === 'gps' ? gps.isActive : modo === 'podometro' ? pod.isActive : false
  const pasosVivos = modo === 'gps' ? gps.steps : modo === 'podometro' ? pod.steps : parseInt(manualSteps) || 0

  // Pulso visual cuando el contador sube
  const prevPasos = useRef(0)
  useEffect(() => {
    if (pasosVivos > prevPasos.current) {
      setPulso(true)
      const t = setTimeout(() => setPulso(false), 500)
      prevPasos.current = pasosVivos
      return () => clearTimeout(t)
    }
    prevPasos.current = pasosVivos
  }, [pasosVivos])

  useEffect(() => {
    fetchCauses()
    fetchStats()
  }, [fetchCauses, fetchStats])

  const myCauses = causes.filter(c => c.supporters?.includes(user?.id))
  const nivel = nivelDesdeXp(stats?.totalSteps || 0)

  const registrar = async (pasos) => {
    if (pasos <= 0) return
    if (myCauses.length === 0) {
      alert('Apoya al menos una causa antes de sumar pasos: sin causa no hay marcha.')
      return
    }
    setSubmitting(true)
    try {
      const xpAntes = stats?.totalSteps || 0
      await recordSteps(pasos)
      await fetchStats()
      setResultado({ pasos, xpAntes, xpDespues: xpAntes + pasos })
      setTimeout(() => setResultado(null), 6000)
    } catch (e) {
      console.error('Failed to record steps:', e)
      alert('No se han podido registrar los pasos. Inténtalo otra vez.')
    } finally {
      setSubmitting(false)
    }
  }

  const empezar = () => {
    setResultado(null)
    if (modo === 'gps') gps.start()
    else if (modo === 'podometro') pod.start?.()
  }

  const pararYRegistrar = async () => {
    let pasos = 0
    if (modo === 'gps') {
      gps.stop()
      pasos = gps.getSessionSummary().steps
      if (pasos <= 0) {
        alert('El GPS no ha detectado desplazamiento. Camina un poco más (necesita movimiento real).')
        gps.reset()
        return
      }
    } else {
      pod.stop?.()
      pasos = pod.steps
      if (pasos <= 0) {
        alert('El podómetro no ha contado pasos. Lleva el móvil encima y muévete un poco.')
        pod.reset?.()
        return
      }
    }
    await registrar(pasos)
    if (modo === 'gps') gps.reset()
    else pod.reset?.()
  }

  const subioNivel = resultado && nivelDesdeXp(resultado.xpDespues).nivel > nivelDesdeXp(resultado.xpAntes).nivel

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const ModoIcono = MODOS.find(m => m.id === modo)?.icono || Footprints

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Confetti activo={!!resultado} />

      <div>
        <h1 style={{ marginBottom: 4 }}>LA MARCHA</h1>
        <p style={{ opacity: 0.65, margin: 0, fontWeight: 700 }}>
          Cada paso es 1 XP y suma a tus causas. Nivel {nivel.nivel} · {nivel.titulo} {nivel.icono}
        </p>
      </div>

      {/* Resultado de la sesión */}
      {resultado && (
        <div className="m2-toast" style={{ position: 'static', transform: 'none', maxWidth: 'none' }} onClick={() => setResultado(null)}>
          <span className="icono">{subioNivel ? '🎉' : '✊'}</span>
          <div>
            <b>{subioNivel ? `¡SUBES A NIVEL ${nivelDesdeXp(resultado.xpDespues).nivel}!` : '¡Pasos a la causa!'}</b>
            <span>+{resultado.pasos.toLocaleString()} XP repartidos entre tus {myCauses.length} {myCauses.length === 1 ? 'causa' : 'causas'}</span>
          </div>
        </div>
      )}

      {/* Selector de modo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        {MODOS.map(({ id, nombre, icono: Icon }) => (
          <button
            key={id}
            onClick={() => !activo && setModo(id)}
            className="card"
            style={{
              padding: '0.8rem 0.4rem', textAlign: 'center', cursor: activo ? 'not-allowed' : 'pointer',
              background: modo === id ? 'var(--m2-amarillo)' : undefined,
              opacity: activo && modo !== id ? 0.4 : 1,
            }}
          >
            <Icon size={22} style={{ display: 'block', margin: '0 auto 4px' }} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{nombre}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: '-0.5rem 0 0', fontWeight: 700 }}>
        <ModoIcono size={13} style={{ verticalAlign: -2 }} /> {MODOS.find(m => m.id === modo)?.desc}
      </p>

      {/* El contador gordo */}
      {modo !== 'reloj' ? (
        <div className="card" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div className={`m2-contador${pulso ? ' m2-pulso' : ''}`}>{pasosVivos.toLocaleString()}</div>
          <div style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.75rem', opacity: 0.55, marginTop: 4 }}>
            pasos esta sesión
          </div>

          {modo === 'gps' && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: 700 }}>
              <span><Navigation size={14} style={{ verticalAlign: -2 }} /> {gps.distanceKm} km</span>
              <span><Gauge size={14} style={{ verticalAlign: -2 }} /> {gps.speedKmh} km/h</span>
              <span><Clock size={14} style={{ verticalAlign: -2 }} /> {formatDuration(gps.duration)}</span>
            </div>
          )}
          {modo === 'gps' && gps.permission === 'denied' && (
            <p style={{ color: 'var(--m2-rojo)', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.8rem' }}>
              Sin permiso de ubicación no hay GPS: actívalo para esta web en el navegador.
            </p>
          )}
          {modo === 'podometro' && !pod.isSupported && (
            <p style={{ color: 'var(--m2-rojo)', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.8rem' }}>
              Este dispositivo no expone el sensor de movimiento. Prueba GPS o modo Reloj.
            </p>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            {!activo ? (
              <button onClick={empezar} disabled={submitting} className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
                <Play size={20} /> EMPEZAR LA MARCHA
              </button>
            ) : (
              <button onClick={pararYRegistrar} disabled={submitting} className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
                <Square size={20} /> PARAR Y SUMAR {pasosVivos > 0 ? `(+${pasosVivos.toLocaleString()} XP)` : ''}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Modo reloj / manual */
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>⌚ Trae los pasos de tu reloj</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.65, fontWeight: 700 }}>
            Mira los pasos de hoy en tu reloj o pulsera (Garmin, Fitbit, Amazfit, Mi Band, Apple Watch…) y súmalos aquí tal cual.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {PRESETS_RELOJ.map(n => (
              <button key={n} className="btn btn-secondary btn-sm" onClick={() => setManualSteps(String(n))}>
                {n.toLocaleString()}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); registrar(parseInt(manualSteps) || 0).then(() => setManualSteps('')) }} style={{ display: 'flex', gap: '0.6rem' }}>
            <input
              type="number"
              min="1"
              max="100000"
              value={manualSteps}
              onChange={(e) => setManualSteps(e.target.value)}
              placeholder="Pasos del reloj…"
              style={{ flex: 1, border: '2px solid var(--m2-tinta)', borderRadius: 12, padding: '0.8rem 1rem', fontSize: '1.1rem', fontWeight: 700, background: 'var(--m2-papel)' }}
            />
            <button type="submit" disabled={submitting || !(parseInt(manualSteps) > 0)} className="btn btn-primary">
              <Footprints size={18} /> Sumar
            </button>
          </form>
          <p style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '0.8rem', marginBottom: 0, fontWeight: 700 }}>
            Próximamente: sincronización automática con Google Fit / Health Connect.
          </p>
        </div>
      )}

      {/* A quién van los pasos */}
      <div className="card" style={{ padding: '1.2rem 1.5rem' }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={18} /> Tus pasos van a…</h3>
        {myCauses.length === 0 ? (
          <p style={{ opacity: 0.65, fontWeight: 700, fontSize: '0.9rem' }}>
            …ninguna parte todavía. <Link to="/causes">Apoya una causa</Link> para que tu marcha cuente.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {myCauses.map(c => {
              const dist = user?.stepDistribution?.[c.id]
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                  <span style={{ opacity: 0.55, fontSize: '0.75rem' }}>
                    {dist ? `1 de cada ${dist.interval}` : 'reparto por defecto'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default StepTrackerPage
