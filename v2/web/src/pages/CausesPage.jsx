import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { num } from '../lib/format.js'

const STATUS = { active: 'En marcha', delivered: 'Entregada', won: '¡Ganada!', lost: 'No lograda' }

export default function CausesPage() {
  const { profile, setProfile } = useSession()
  const [causes, setCauses] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState(null)
  useEffect(() => { api.causes().then(setCauses).catch(setError) }, [])

  async function join(id) {
    try { setProfile(await api.joinCause(id)) } catch (err) { setError(err) }
  }

  const filtered = (causes ?? []).filter(c => `${c.title} ${c.demand} ${c.target}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <div className="row" style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Causas</h1>
        <span className="spacer" />
        {profile && <Link to="/causas/nueva" className="btn pink">Nueva causa</Link>}
      </div>
      <input placeholder="Buscar por título, demanda o destinatario" value={query} onChange={e => setQuery(e.target.value)} style={{ marginBottom: '1rem' }} />
      {error && <div className="alert error">{error.message}</div>}
      {!causes && <p className="muted">Cargando…</p>}
      <div className="grid two">
        {filtered.map(c => (
          <article key={c.id} className="card stack" style={{ borderTop: `10px solid ${c.color}` }}>
            <div className="row">
              <span style={{ fontSize: '2rem' }}>{c.icon}</span>
              <h3 style={{ margin: 0 }}>{c.title}</h3>
              <span className="spacer" />
              <span className="chip">{STATUS[c.status] ?? c.status}</span>
            </div>
            <p style={{ margin: 0 }}><b>Exigimos:</b> {c.demand}</p>
            <p className="muted" style={{ margin: 0 }}><b>A:</b> {c.target}</p>
            <div className="row mono" style={{ fontSize: '.9rem' }}>
              <span>{num(c.uniquePeople)} personas</span>·<span>{num(c.totalSteps)} pasos</span>·<span>{num(c.deployedUnits)} unidades</span>
            </div>
            {c.goalPeople && <div className="bar" title={`Objetivo: ${num(c.goalPeople)} personas`}><i style={{ width: `${Math.min(100, (c.uniquePeople / c.goalPeople) * 100)}%` }} /></div>}
            <div className="row">
              <Link to={`/marcha/${c.id}`} className="btn small blue">Ver la marcha</Link>
              {profile && c.status === 'active' && (
                profile.pattern.includes(c.id)
                  ? <span className="chip">✔ En tu patrón</span>
                  : <button className="btn small" onClick={() => join(c.id)}>Sumar mis pasos</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
