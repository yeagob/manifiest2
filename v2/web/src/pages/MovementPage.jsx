import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UNIT_ROLES, patternShares } from '@manifiest/shared'
import { api } from '../lib/api.js'
import { useSession } from '../lib/store.js'
import { num } from '../lib/format.js'
import UnitCard from '../components/UnitCard.jsx'

function PatternEditor({ causes, profile, onSaved }) {
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

export default function MovementPage() {
  const { profile, setProfile, reload } = useSession()
  const [causes, setCauses] = useState([])
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [target, setTarget] = useState('')
  const [error, setError] = useState(null)
  const [fresh, setFresh] = useState(null)

  const load = () => Promise.all([api.causes(), api.units()]).then(([c, u]) => { setCauses(c.filter(x => x.status === 'active')); setData(u) }).catch(setError)
  useEffect(() => { load() }, [])

  const causeById = useMemo(() => Object.fromEntries(causes.map(c => [c.id, c])), [causes])
  const free = profile.capacity - profile.usedCapacity
  const p = profile.progress

  async function act(fn) {
    setError(null)
    try { await fn(); await Promise.all([load(), reload()]) } catch (err) { setError(err) }
  }

  const mint = role => act(async () => { setFresh(await api.mint(role)) })
  const deploy = () => act(async () => { await api.deploy([...selected], target || null); setSelected(new Set()) })
  const retire = () => act(async () => { for (const id of selected) await api.retire(id); setSelected(new Set()) })
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      <section className="grid three">
        <div className="card stat">
          <b>Nivel {p.level}</b>
          <span>{num(p.xp)} / {num(p.levelCeil)} XP</span>
          <div className="bar" style={{ marginTop: '.5rem' }}><i style={{ width: `${Math.round(p.ratio * 100)}%` }} /></div>
        </div>
        <div className="card stat"><b>{profile.usedCapacity} / {profile.capacity}</b><span>capacidad de unidades · {profile.activeDays} días activos</span></div>
        <div className="card stat">
          <b>{num(profile.totalSteps)}</b><span>pasos verificados</span>
          {profile.unallocatedSteps > 0 && (
            <button className="btn small" style={{ marginTop: '.5rem' }} onClick={() => act(async () => setProfile((await api.allocateReserve()).profile))}>
              Repartir {num(profile.unallocatedSteps)} de la reserva
            </button>
          )}
        </div>
      </section>

      {error && <div className="alert error">{error.message}</div>}

      {causes.length > 0
        ? <PatternEditor key={profile.pattern.join()} causes={causes} profile={profile} onSaved={setProfile} />
        : <div className="card">Aún no hay causas activas. <Link to="/causas/nueva">Lanza la primera</Link>.</div>}

      <section className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Tus unidades</h2>
          <span className="spacer" />
          <span className="chip">{free} de capacidad libre</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Cada unidad es única e irrepetible. Cuantas más despliegues, más grande se verá tu presencia en la avenida;
          pero en los contadores sigues siendo <b>una persona</b>.
        </p>
        <div className="row">
          {Object.entries(UNIT_ROLES).map(([role, def]) => (
            <button key={role} className="btn small" disabled={p.level < def.unlockLevel || free < def.cost} onClick={() => mint(role)}
              title={p.level < def.unlockLevel ? `Nivel ${def.unlockLevel}` : `Coste ${def.cost}`}>
              {p.level < def.unlockLevel ? '🔒' : '＋'} {def.label} · {def.cost}
            </button>
          ))}
        </div>
        {fresh && (
          <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <UnitCard unit={fresh} size={80} />
            <div>¡Ha nacido <b>{fresh.name}</b>! Una unidad {fresh.rarity === 'legendary' ? 'LEGENDARIA' : fresh.rarity === 'epic' ? 'épica' : fresh.rarity === 'rare' ? 'rara' : 'común'} que nadie más tendrá jamás.</div>
          </div>
        )}
        {selected.size > 0 && (
          <div className="row card flat" style={{ padding: '.75rem' }}>
            <b>{selected.size} seleccionadas</b>
            <select value={target} onChange={e => setTarget(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Retirar de la calle</option>
              {causes.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
            </select>
            <button className="btn pink small" onClick={deploy}>Desplegar</button>
            <button className="btn ghost small" onClick={() => { if (confirm('¿Retirar definitivamente estas unidades? Liberan capacidad, pero no se pueden recuperar.')) retire() }}>Jubilar</button>
          </div>
        )}
        <div className="grid units">
          {data?.units.map(u => <UnitCard key={u.id} unit={u} selected={selected.has(u.id)} onClick={() => toggle(u.id)} causeLabel={u.causeId ? causeById[u.causeId]?.icon : 'En reserva'} />)}
        </div>
        {data && !data.units.length && <p className="muted">Aún no tienes unidades. ¡Acuña la primera!</p>}
      </section>
    </div>
  )
}
