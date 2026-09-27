import { useMemo, useState } from 'react'
import { generateGenome, RARITY_LABELS } from '@manifiest/shared'
import UnitSVG from '../UnitSVG.jsx'
import UnitCard from '../UnitCard.jsx'
import { num } from '../../lib/format.js'

function RoleCard({ role, free, eco, busy, onMint }) {
  const genome = useMemo(() => generateGenome(`muestra:${role.id}`, { rarity: 'common', role: role.id }), [role.id])
  const affordable = eco >= role.price
  const fits = free >= role.cost
  return (
    <article className={`card role-card ${role.locked ? 'locked' : ''}`}>
      <div className="role-art"><UnitSVG genome={genome} size={96} /></div>
      <h3 style={{ margin: 0 }}>{role.label}</h3>
      <p className="muted" style={{ margin: 0, fontSize: '.85rem', minHeight: '2.6em' }}>{role.description}</p>
      <div className="row mono" style={{ fontSize: '.8rem', gap: '.5rem' }}>
        <span>🧳 {role.cost}</span><span>📣 {role.ecoRate}/h</span><span>👥 {role.figures}</span>
      </div>
      {role.locked ? (
        <div className="stack" style={{ gap: '.3rem' }}>
          <span className="muted" style={{ fontSize: '.82rem' }}>🔒 {role.locked}</span>
          {role.categoryProgress && <div className="bar"><i style={{ width: `${Math.round(role.categoryProgress.ratio * 100)}%` }} /></div>}
        </div>
      ) : (
        <button className="btn small pink" disabled={busy || !affordable || !fits} onClick={() => onMint(role.id)}
          title={!fits ? 'Sin capacidad libre' : !affordable ? 'Eco insuficiente' : ''}>
          Reclutar · {role.price ? `${num(role.price)} Eco` : 'gratis'}
        </button>
      )}
    </article>
  )
}

export default function Recruitment({ state, units, causes, busy, onMint, onDeploy, onRetire, fresh }) {
  const [selected, setSelected] = useState(new Set())
  const [target, setTarget] = useState('')
  const [filter, setFilter] = useState('all')
  const free = state.capacity - state.usedCapacity
  const causeById = Object.fromEntries(causes.map(c => [c.id, c]))
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const shown = units.filter(u => filter === 'all' || (filter === 'reserve' ? !u.causeId : u.causeId === filter))
  const roles = [...state.roles].sort((a, b) => (a.locked ? 1 : 0) - (b.locked ? 1 : 0) || a.unlockLevel - b.unlockLevel)
  return (
    <div className="stack" style={{ gap: '1.6rem' }}>
      <section className="stack">
        <div className="row"><h2 style={{ margin: 0 }}>Reclutar</h2><span className="chip">{free} de capacidad libre</span></div>
        {fresh && (
          <div className="card taped fresh-unit">
            <UnitCard unit={fresh} size={92} />
            <div>
              <span className="stamp" style={{ '--stamp': `var(--rarity-${fresh.rarity})` }}>{RARITY_LABELS[fresh.rarity]}</span>
              <h3 style={{ margin: '.4rem 0 .2rem' }}>¡Se une {fresh.name}!</h3>
              <p className="muted" style={{ margin: 0 }}>Una unidad única que nadie más tendrá jamás. Ya espera en tu reserva.</p>
            </div>
          </div>
        )}
        <div className="grid roles-grid">
          {roles.map(r => <RoleCard key={r.id} role={r} free={free} eco={state.eco.balance} busy={busy} onMint={onMint} />)}
        </div>
      </section>
      <section className="stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Colección · {units.length}</h2>
          <span className="spacer" />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto' }} aria-label="Filtrar colección">
            <option value="all">Todas</option>
            <option value="reserve">En reserva</option>
            {causes.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
          </select>
        </div>
        {selected.size > 0 && (
          <div className="row card flat">
            <b>{selected.size} seleccionadas</b>
            <select value={target} onChange={e => setTarget(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Volver a la reserva</option>
              {causes.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
            </select>
            <button className="btn pink small" disabled={busy} onClick={() => { onDeploy([...selected], target || null); setSelected(new Set()) }}>Mover</button>
            <button className="btn ghost small" disabled={busy} onClick={() => { if (confirm('¿Jubilar estas unidades? Liberan capacidad, pero pierden su veteranía y no vuelven.')) { onRetire([...selected]); setSelected(new Set()) } }}>Jubilar</button>
          </div>
        )}
        <div className="grid units">
          {shown.map(u => <UnitCard key={u.id} unit={u} selected={selected.has(u.id)} onClick={() => toggle(u.id)} causeLabel={u.causeId ? causeById[u.causeId]?.icon : 'Reserva'} />)}
        </div>
      </section>
    </div>
  )
}
