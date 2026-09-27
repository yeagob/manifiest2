import { num } from '../../lib/format.js'

const ICONS = { imprenta: '🖨️', caja: '🥫', zapatillas: '👟', furgoneta: '🚐', asamblea: '🗣️', escuela: '🎓', red: '🕸️', carton: '✂️' }

export default function Workshop({ state, busy, onBuy }) {
  return (
    <div className="stack" style={{ gap: '1.2rem' }}>
      <p className="muted" style={{ margin: 0, maxWidth: 700 }}>
        El Eco se gana caminando y manteniendo unidades en la calle. Nunca se compra con dinero y nunca cambia las cifras reales: solo mejora cómo y cuánto se ve tu movimiento.
      </p>
      <div className="grid three">
        {state.upgrades.map((u, i) => {
          const locked = state.progress.level < u.minLevel
          const maxed = u.level >= u.max
          return (
            <article key={u.id} className={`card upgrade-card ${i % 3 === 1 ? 'tilt-r' : ''} ${locked ? 'locked' : ''}`}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className="upgrade-icon" aria-hidden>{locked ? '🔒' : ICONS[u.id]}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{u.label}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>{u.description}</p>
                </div>
              </div>
              <div className="upgrade-pips" aria-label={`Nivel ${u.level} de ${u.max}`}>
                {Array.from({ length: u.max }, (_, k) => <i key={k} className={k < u.level ? 'on' : ''} />)}
              </div>
              <p style={{ margin: 0, fontSize: '.9rem' }}>
                <b>{u.effectNow}</b>{u.effectNext && <span className="muted"> → {u.effectNext}</span>}
              </p>
              {locked
                ? <span className="stamp" style={{ '--stamp': 'var(--ink-soft)' }}>Nivel {u.minLevel}</span>
                : maxed
                  ? <span className="stamp" style={{ '--stamp': 'var(--green)' }}>Al máximo</span>
                  : <button className="btn small" disabled={busy || Boolean(u.problem)} onClick={() => onBuy(u.id)}>Mejorar · {num(u.cost)} Eco</button>}
            </article>
          )
        })}
      </div>
    </div>
  )
}
