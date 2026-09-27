import { UNIT_ROLES } from './units.js'

export const UPGRADES = {
  imprenta: { label: 'Imprenta de pancartas', description: 'Cada unidad desplegada genera más Eco.', baseCost: 50, growth: 1.6, max: 20, minLevel: 2, effect: l => `+${l * 15} % Eco de unidades` },
  caja: { label: 'Caja de resistencia', description: 'Guarda Eco durante más horas mientras no estás.', baseCost: 80, growth: 1.8, max: 10, minLevel: 2, effect: l => `${8 + l * 4} h de almacenamiento` },
  zapatillas: { label: 'Zapatillas gastadas', description: 'Tus pasos reales rinden más Eco.', baseCost: 60, growth: 1.55, max: 25, minLevel: 3, effect: l => `+${l * 10} % Eco por pasos` },
  furgoneta: { label: 'Furgoneta del colectivo', description: 'Más capacidad para llevar unidades a la calle.', baseCost: 200, growth: 2.1, max: 15, minLevel: 4, effect: l => `+${l} de capacidad` },
  asamblea: { label: 'Asamblea de coordinación', description: 'Multiplica la bonificación por reforzar manis necesitadas.', baseCost: 150, growth: 1.9, max: 10, minLevel: 5, effect: l => `+${l * 25} % de bonus por necesidad` },
  escuela: { label: 'Escuela de activismo', description: 'Tus unidades ganan veteranía antes.', baseCost: 120, growth: 1.7, max: 10, minLevel: 6, effect: l => `−${l * 8} % de tiempo para subir de rango` },
  red: { label: 'Red de apoyo mutuo', description: 'Bonus por cada causa distinta en la que tengas unidades.', baseCost: 250, growth: 2, max: 10, minLevel: 8, effect: l => `+${l * 3} % por causa distinta` },
  carton: { label: 'Taller de cartonería', description: 'Abarata el acuñado de unidades especiales.', baseCost: 300, growth: 1.8, max: 10, minLevel: 10, effect: l => `−${l * 5} % coste de especiales` }
}

export const RANKS = [
  { id: 'novata', label: 'Novata', hours: 0, mult: 1 },
  { id: 'curtida', label: 'Curtida', hours: 24, mult: 1.25 },
  { id: 'veterana', label: 'Veterana', hours: 168, mult: 1.6 },
  { id: 'historica', label: 'Histórica', hours: 720, mult: 2.2 }
]

export const MILESTONES = {
  people: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000],
  steps: [100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000]
}

export const BASE_STORAGE_HOURS = 8
export const FREE_MARCHERS = 3

export function upgradeLevel(upgrades, id) {
  return Math.max(0, Math.min(UPGRADES[id]?.max ?? 0, Math.floor(upgrades?.[id] ?? 0)))
}

export function upgradeCost(id, currentLevel) {
  const u = UPGRADES[id]
  return Math.round(u.baseCost * u.growth ** currentLevel)
}

export function upgradeProblem(id, upgrades, level, eco) {
  const u = UPGRADES[id]
  if (!u) return 'Mejora desconocida'
  if (level < u.minLevel) return `Se desbloquea en el nivel ${u.minLevel}`
  const current = upgradeLevel(upgrades, id)
  if (current >= u.max) return 'Mejora al máximo'
  if (eco < upgradeCost(id, current)) return 'No tienes Eco suficiente'
  return null
}

export function storageHours(upgrades) {
  return BASE_STORAGE_HOURS + 4 * upgradeLevel(upgrades, 'caja')
}

export function extraCapacity(upgrades) {
  return upgradeLevel(upgrades, 'furgoneta')
}

export function stepsEco(delta, upgrades) {
  return (Math.max(0, delta) / 100) * (1 + 0.1 * upgradeLevel(upgrades, 'zapatillas'))
}

export function mintCost(role, upgrades, ownedMarchers = 0) {
  const def = UNIT_ROLES[role]
  if (!def) return Infinity
  if (role === 'marcher') return ownedMarchers < FREE_MARCHERS ? 0 : def.mintCost
  return Math.round(def.mintCost * (1 - 0.05 * upgradeLevel(upgrades, 'carton')))
}

export function rankFor(serviceSeconds, upgrades) {
  const factor = 1 - 0.08 * upgradeLevel(upgrades, 'escuela')
  const hours = Math.max(0, serviceSeconds) / 3600
  let rank = RANKS[0]
  for (const r of RANKS) if (hours >= r.hours * factor) rank = r
  const index = RANKS.indexOf(rank)
  const next = RANKS[index + 1]
  return {
    id: rank.id, label: rank.label, mult: rank.mult, index,
    nextAtHours: next ? next.hours * factor : null,
    hours
  }
}

export function needMultiplier({ people, deployed, globalRatio, ageDays = 30 }) {
  let need
  if (deployed <= 0) need = 3
  else need = Math.max(0.5, Math.min(3, globalRatio / Math.max(deployed / Math.max(people, 1), 0.05)))
  if (ageDays < 7) need = Math.min(3, need + 0.3)
  return Math.round(need * 10) / 10
}

export function effectiveNeed(need, upgrades) {
  if (need <= 1) return need
  return 1 + (need - 1) * (1 + 0.25 * upgradeLevel(upgrades, 'asamblea'))
}

export function ecoRatePerHour(units, needByCause, upgrades) {
  const deployed = units.filter(u => u.causeId)
  const distinct = new Set(deployed.map(u => u.causeId)).size
  const base = deployed.reduce((sum, u) => {
    const def = UNIT_ROLES[u.role]
    if (!def) return sum
    return sum + def.ecoRate * (u.rankMult ?? 1) * effectiveNeed(needByCause[u.causeId] ?? 1, upgrades)
  }, 0)
  return base * (1 + 0.15 * upgradeLevel(upgrades, 'imprenta')) * (1 + 0.03 * upgradeLevel(upgrades, 'red') * distinct)
}

export function pendingEco(ratePerHour, elapsedSeconds, upgrades) {
  const hours = Math.max(0, elapsedSeconds) / 3600
  return Math.min(ratePerHour * hours, ratePerHour * storageHours(upgrades))
}

export function crossedMilestones(kind, before, after) {
  return MILESTONES[kind].filter(t => before < t && after >= t)
}
