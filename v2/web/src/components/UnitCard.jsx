import { RARITY_LABELS, UNIT_ROLES } from '@manifiest/shared'

const RANK_LABEL = { curtida: '★ Curtida', veterana: '✪ Veterana', historica: '♛ Histórica' }
import UnitSVG from './UnitSVG.jsx'

export default function UnitCard({ unit, selected, onClick, causeLabel, size = 110 }) {
  const frame = unit.loadout?.frame
  const style = frame === 'frame_holo'
    ? { outline: '4px solid transparent', background: 'linear-gradient(var(--sheet), var(--sheet)) padding-box, linear-gradient(135deg,#FF48B0,#FFE800,#82D8D5,#765BA7) border-box', border: '4px solid transparent' }
    : frame === 'frame_sello' ? { border: '3px dashed var(--ink-soft)' }
      : frame === 'frame_kraft' ? { background: 'var(--kraft)', border: '2px dashed #6A4028' }
        : frame === 'frame_serigrafia' ? { border: '3px solid var(--ink)', boxShadow: '4px 4px 0 var(--pink), 7px 7px 0 var(--blue)' } : undefined
  return (
    <button
      type="button"
      className={`unit-card rarity-${unit.rarity}${selected ? ' selected' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', font: 'inherit', color: 'inherit', ...style }}
      aria-pressed={selected}
    >
      <span className={`chip rarity-tag`} style={{ position: 'absolute', top: 6, left: 6, fontSize: '.65rem' }}>{RARITY_LABELS[unit.rarity]}</span>
      <span className="mono muted" style={{ position: 'absolute', top: 8, right: 8, fontSize: '.7rem' }}>#{String(unit.serial).padStart(3, '0')}</span>
      <UnitSVG genome={unit.genome} loadout={unit.loadout} size={size} rank={unit.rank?.id} />
      {unit.rank && unit.rank.id !== 'novata' && <span className="rank-ribbon">{RANK_LABEL[unit.rank.id]}</span>}
      <span className="name">{unit.name}</span>
      <span className="muted" style={{ fontSize: '.78rem' }}>{UNIT_ROLES[unit.role]?.label}{causeLabel ? ` · ${causeLabel}` : ''}</span>
    </button>
  )
}
