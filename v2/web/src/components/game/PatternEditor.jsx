import { useState } from 'react'
import { patternShares } from '@manifiest/shared'
import { api } from '../../lib/api.js'

export default function PatternEditor({ causes, profile, onSaved }) {
  const [pattern, setPattern] = useState(profile.pattern)
  const [brush, setBrush] = useState(causes[0]?.id ?? null)
  const [error, setError] = useState(null)
  const byId = Object.fromEntries(causes.map(c => [c.id, c]))
  const shares = patternShares(pattern)
  const dirty = JSON.stringify(pattern) !== JSON.stringify(profile.pattern)

  async function save() {
    try { onSaved(await api.setPattern(pattern)); setError(null) } catch (err) { setError(err) }
  }

  return (
    <section className="card stack">
      <h2>Patrón de reparto</h2>
      <p className="muted" style={{ margin: 0 }}>Tus pasos recorren este ciclo en orden, paso a paso. Nada se pierde: el resto de un día continúa al siguiente.</p>
      <div className="row">
        <b>Pincel:</b>
        {causes.map(c => (
          <button key={c.id} type="button" className="chip" onClick={() => setBrush(c.id)}
            style={{ background: brush === c.id ? c.color : undefined, color: brush === c.id ? '#fff' : undefined, cursor: 'pointer' }}>
            {c.icon} {c.title}
          </button>
        ))}
      </div>
      <div className="pattern" aria-label="Ciclo de reparto">
        {pattern.map((id, i) => (
          <button key={i} type="button" className="slot" title={`${byId[id]?.title ?? 'Causa cerrada'} · clic para quitar`}
            style={{ background: byId[id]?.color }} onClick={() => setPattern(pattern.filter((_, j) => j !== i))}>
            {byId[id]?.icon ?? '∅'}
          </button>
        ))}
        {pattern.length < 20 && brush && <button type="button" className="slot empty" onClick={() => setPattern([...pattern, brush])} aria-label="Añadir posición">＋</button>}
      </div>
      <div className="row mono" style={{ fontSize: '.9rem' }}>
        {Object.entries(shares).map(([id, share]) => <span key={id}>{byId[id]?.icon} {Math.round(share * 100)}%</span>)}
        {!pattern.length && <span className="muted">Vacío: tus pasos se guardan en la reserva.</span>}
      </div>
      {error && <div className="alert error">{error.message}</div>}
      <div className="row">
        <button className="btn pink" disabled={!dirty} onClick={save}>Guardar patrón</button>
        {dirty && <button className="btn ghost small" onClick={() => setPattern(profile.pattern)}>Deshacer</button>}
      </div>
    </section>
  )
}
