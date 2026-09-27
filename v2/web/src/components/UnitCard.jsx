import { RARITY_LABELS, UNIT_ROLES } from '@manifiest/shared'
import UnitSVG from './UnitSVG.jsx'

export default function UnitCard({ unit, selected, onClick, causeLabel, size = 110 }) {
  const frame = unit.loadout?.frame
  const style = frame === 'frame_holo'
    ? { borderImage: 'linear-gradient(135deg,#FF48B0,#FFE800,#82D8D5,#765BA7) 1', borderWidth: 4 }
    : frame === 'frame_sello' ? { borderStyle: 'dashed', borderWidth: 3 } : undefined
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
      <UnitSVG genome={unit.genome} loadout={unit.loadout} size={size} />
      <span className="name">{unit.name}</span>
      <span className="muted" style={{ fontSize: '.78rem' }}>{UNIT_ROLES[unit.role]?.label}{causeLabel ? ` · ${causeLabel}` : ''}</span>
    </button>
  )
}
