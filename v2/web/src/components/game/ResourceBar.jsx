import { num } from '../../lib/format.js'
import { useEcoTicker } from './useEcoTicker.js'

const fmt = n => (n >= 1000 ? num(n) : n.toFixed(n < 10 ? 1 : 0).replace('.', ','))

export default function ResourceBar({ state, profile, onCollect, busy }) {
  const { pending, cap, full } = useEcoTicker(state.eco)
  const p = state.progress
  return (
    <section className="resource-bar card kraft">
      <div className="res res-level">
        <span className="res-stamp">NV<b>{p.level}</b></span>
        <div className="res-body">
          <span className="res-label">Experiencia · {num(p.xp)} / {num(p.levelCeil)}</span>
          <div className="bar"><i style={{ width: `${Math.round(p.ratio * 100)}%` }} /></div>
        </div>
      </div>
      <div className="res">
        <span className="res-icon" aria-hidden>👣</span>
        <div className="res-body">
          <b className="res-value">{num(profile.totalSteps)}</b>
          <span className="res-label">pasos reales{profile.unallocatedSteps > 0 ? ` · ${num(profile.unallocatedSteps)} en reserva` : ''}</span>
        </div>
      </div>
      <div className="res">
        <span className="res-icon" aria-hidden>📣</span>
        <div className="res-body">
          <b className="res-value">{fmt(state.eco.balance)} <small>Eco</small></b>
          <span className="res-label">+{fmt(state.eco.ratePerHour)}/h · caja {state.eco.storageHours} h</span>
        </div>
      </div>
      <div className="res">
        <span className="res-icon" aria-hidden>🧳</span>
        <div className="res-body">
          <b className="res-value">{state.usedCapacity}/{state.capacity}</b>
          <span className="res-label">capacidad de unidades</span>
        </div>
      </div>
      <button className={`btn ${full ? 'pink' : ''} res-collect`} onClick={onCollect} disabled={busy || pending < 0.1} title={`Caja de resistencia: ${fmt(pending)} de ${fmt(cap)}`}>
        <span>Recoger</span>
        <b className="mono">+{fmt(pending)}</b>
        <span className="res-meter"><i style={{ width: `${cap ? Math.min(100, (pending / cap) * 100) : 0}%` }} /></span>
      </button>
    </section>
  )
}
