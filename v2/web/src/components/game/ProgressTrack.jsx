import { useEffect, useRef } from 'react'
import { UNIT_ROLES, generateGenome } from '@manifiest/shared'
import UnitSVG from '../UnitSVG.jsx'
import { num } from '../../lib/format.js'

const KIND = { unit: 'Unidad', upgrade: 'Mejora', cosmetic: 'Accesorio', feature: 'Función' }
const KIND_ICON = { unit: '🧍', upgrade: '🛠️', cosmetic: '🎨', feature: '✨' }

export default function ProgressTrack({ state }) {
  const level = state.progress.level
  const next = state.track.find(t => t.level > level)
  const trackRef = useRef(null)
  useEffect(() => {
    const el = trackRef.current?.querySelector('.current')
    if (el) trackRef.current.scrollLeft = el.offsetLeft - 16
  }, [level])
  return (
    <div className="stack" style={{ gap: '1.4rem' }}>
      {next && (
        <div className="card kraft taped next-unlock">
          <div>
            <span className="res-label">Próximo nivel · faltan {num(next.xp - state.progress.xp)} XP (~{Math.max(1, Math.ceil((next.xp - state.progress.xp) / 90))} días caminando)</span>
            <h2 style={{ margin: '.2rem 0' }}>Nivel {next.level}: {next.unlocks.map(u => u.label).join(' · ')}</h2>
          </div>
          {next.unlocks.filter(u => u.kind === 'unit').map(u => (
            <UnitSVG key={u.id} genome={generateGenome(`muestra:${u.id}`, { role: u.id, rarity: 'rare' })} size={80} />
          ))}
        </div>
      )}
      <ol className="track" ref={trackRef} aria-label="Pista de progresión">
        {state.track.map(t => (
          <li key={t.level} className={`track-node ${t.level <= level ? 'done' : ''} ${t.level === level ? 'current' : ''}`}>
            <span className="track-level">{t.level}</span>
            <div className="track-body">
              <span className="muted mono" style={{ fontSize: '.72rem' }}>{num(t.xp)} XP · 🧳 {t.capacity}</span>
              {t.unlocks.map(u => (
                <span key={`${u.kind}-${u.id}`} className={`track-item kind-${u.kind}`} title={u.description}>{KIND_ICON[u.kind]} {u.label}<small> · {KIND[u.kind]}</small></span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <section className="stack">
        <h2 style={{ margin: 0 }}>Unidades de causa</h2>
        <p className="muted" style={{ margin: 0 }}>Se desbloquean aportando pasos reales a causas de su categoría, a partir del nivel 6. Premian el compromiso sostenido con un tema.</p>
        <div className="grid three">
          {state.roles.filter(r => r.category).map(r => (
            <div key={r.id} className="card row" style={{ alignItems: 'center' }}>
              <UnitSVG genome={generateGenome(`muestra:${r.id}`, { role: r.id, rarity: 'epic' })} size={70} />
              <div style={{ flex: 1 }} className="stack">
                <b>{UNIT_ROLES[r.id].label}</b>
                <span className="muted" style={{ fontSize: '.82rem' }}>{r.category.label}: {num(r.categoryProgress.steps)} / {num(r.categoryProgress.required)} pasos</span>
                <div className="bar"><i style={{ width: `${Math.round(r.categoryProgress.ratio * 100)}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
