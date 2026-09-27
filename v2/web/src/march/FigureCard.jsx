import { RARITY_LABELS, UNIT_ROLES, RANKS } from '@manifiest/shared'
import UnitSVG from '../components/UnitSVG.jsx'

export default function FigureCard({ fig, block, onClose }) {
  if (!fig) return null
  const rank = RANKS.find(r => r.id === fig.rank)
  return (
    <div className="scene-panel figure-card taped" role="dialog" aria-label={fig.name ?? 'Manifestante'}>
      <button className="btn small ghost figure-close" onClick={onClose} aria-label="Cerrar">✕</button>
      <UnitSVG genome={fig.genome} loadout={fig.loadout} rank={fig.rank} size={120} />
      <div className="stack" style={{ gap: '.25rem' }}>
        {fig.citizen
          ? <><b>Manifestante ciudadana/o</b><span className="muted">Camina con sus pasos reales, sin unidades desplegadas.</span></>
          : <>
            <span className={`chip rarity-tag rarity-${fig.rarity}`} style={{ justifySelf: 'start' }}>{RARITY_LABELS[fig.rarity]}</span>
            <h3 style={{ margin: 0 }}>{fig.name}</h3>
            <span className="muted">{UNIT_ROLES[fig.role]?.label}{fig.main ? '' : ' · acompañante'}{rank && rank.id !== 'novata' ? ` · ${rank.label}` : ''}</span>
          </>}
        {block && <span className="muted" style={{ fontSize: '.85rem' }}>{block.title}</span>}
      </div>
    </div>
  )
}
