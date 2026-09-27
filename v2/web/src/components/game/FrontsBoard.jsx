import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UNIT_ROLES, featureUnlocked } from '@manifiest/shared'
import { num } from '../../lib/format.js'

function NeedStamp({ need, visible }) {
  if (!visible) return <span className="stamp" style={{ '--stamp': 'var(--ink-soft)' }}>¿Necesidad?</span>
  if (need >= 2) return <span className="stamp" style={{ '--stamp': 'var(--red)' }}>¡Refuerzos! x{need.toFixed(1).replace('.', ',')}</span>
  if (need > 1) return <span className="stamp" style={{ '--stamp': 'var(--orange)' }}>Necesita apoyo x{need.toFixed(1).replace('.', ',')}</span>
  if (need < 1) return <span className="stamp" style={{ '--stamp': 'var(--blue)' }}>Bien cubierta x{need.toFixed(1).replace('.', ',')}</span>
  return <span className="stamp" style={{ '--stamp': 'var(--green)' }}>Equilibrada x1</span>
}

function FrontCard({ front, reserve, level, onSend, onRecall, busy, index }) {
  const available = Object.entries(reserve).filter(([, n]) => n > 0)
  const deployedRoles = Object.entries(front.myRoles)
  const [role, setRole] = useState(available[0]?.[0] ?? 'marcher')
  const showNeed = featureUnlocked('need_map', level)
  const trend = front.steps24h
  return (
    <article className={`card front-card taped ${index % 2 ? 'tilt-r' : 'tilt-l'}`} style={{ '--cause': front.color }}>
      <header className="front-head">
        <span className="front-icon" aria-hidden>{front.icon}</span>
        <h3>{front.title}</h3>
      </header>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <NeedStamp need={front.need} visible={showNeed} />
        <span className="mono muted" style={{ fontSize: '.8rem' }}>{trend > 0 ? `▲ ${num(trend)} pasos/24 h` : 'sin pasos hoy'}</span>
      </div>
      <dl className="front-stats">
        <div><dt>Personas</dt><dd>{num(front.people)}</dd></div>
        <div><dt>Unidades</dt><dd>{num(front.deployed)}</dd></div>
        <div><dt>Tuyas</dt><dd>{front.myUnits}</dd></div>
        <div><dt>Tu Eco/h</dt><dd>{front.myRate.toFixed(1).replace('.', ',')}</dd></div>
      </dl>
      {deployedRoles.length > 0 && (
        <div className="front-roles">
          {deployedRoles.map(([r, n]) => (
            <button key={r} className="chip" disabled={busy} onClick={() => onRecall(front.id, r, 1)} title={`Retirar 1 ${UNIT_ROLES[r].label}`}>
              {UNIT_ROLES[r].label} ×{n} <span aria-hidden>↩</span>
            </button>
          ))}
        </div>
      )}
      <div className="front-actions">
        {available.length > 0 ? (
          <>
            <select value={role} onChange={e => setRole(e.target.value)} aria-label="Tipo de unidad a enviar">
              {available.map(([r, n]) => <option key={r} value={r}>{UNIT_ROLES[r].label} ({n})</option>)}
            </select>
            <button className="btn small pink" disabled={busy || !reserve[role]} onClick={() => onSend(front.id, role, 1)}>+1</button>
            <button className="btn small" disabled={busy || !reserve[role]} onClick={() => onSend(front.id, role, reserve[role])}>Todas</button>
          </>
        ) : <span className="muted" style={{ fontSize: '.85rem' }}>Reserva vacía: recluta más unidades.</span>}
        <span className="spacer" />
        <Link className="btn small ghost" to={`/marcha/${front.id}`}>Ver la mani</Link>
      </div>
    </article>
  )
}

export default function FrontsBoard({ state, busy, onSend, onRecall, onAutoDeploy }) {
  const [sort, setSort] = useState('need')
  const level = state.progress.level
  const fronts = [...state.fronts].sort((a, b) => sort === 'need' ? b.need - a.need : sort === 'mine' ? b.myUnits - a.myUnits : b.people - a.people)
  const reserveTotal = Object.values(state.reserve).reduce((s, n) => s + n, 0)
  return (
    <div className="stack" style={{ gap: '1.4rem' }}>
      <div className="row">
        <p className="muted" style={{ margin: 0, maxWidth: 640 }}>
          Cada unidad desplegada genera Eco. Las manis con pocas unidades para su gente rinden más: reforzarlas es estratégico y hace que ninguna causa se quede vacía.
        </p>
        <span className="spacer" />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }} aria-label="Ordenar frentes">
          <option value="need">Más necesitadas</option>
          <option value="mine">Donde estoy</option>
          <option value="people">Más gente</option>
        </select>
        {featureUnlocked('auto_deploy', level)
          ? <button className="btn blue" disabled={busy || !reserveTotal} onClick={onAutoDeploy}>Despliegue estratégico ({reserveTotal})</button>
          : <span className="chip">🔒 Despliegue estratégico · Nv 10</span>}
      </div>
      <div className="grid two fronts-grid">
        {fronts.map((f, i) => <FrontCard key={f.id} index={i} front={f} reserve={state.reserve} level={level} busy={busy} onSend={onSend} onRecall={onRecall} />)}
      </div>
      {!fronts.length && <div className="card">No hay manis activas. <Link to="/causas/nueva">Lanza la primera</Link>.</div>}
    </div>
  )
}
