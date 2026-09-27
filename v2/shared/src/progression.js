import { UNIT_ROLES } from './units.js'
import { COSMETICS } from './cosmetics.js'
import { UPGRADES } from './economy.js'

export const STEPS_PER_XP = 100
export const ACTIVE_DAY_MIN_STEPS = 2000
export const ACTIVE_DAY_XP = 20
export const STREAK_XP_PER_DAY = 5
export const STREAK_XP_CAP = 30
export const ACTIVE_DAYS_PER_SENIORITY_UNIT = 30
export const DAILY_STEP_CAP = 70000
export const MAX_TRACK_LEVEL = 30
const CURVE_BASE = 60
const CURVE_EXP = 1.8

export const FEATURES = [
  { id: 'traveling', level: 1, label: 'Traveling de cámara', description: 'Recorre la mani entera bloque a bloque, con su sonido.' },
  { id: 'photo', level: 1, label: 'Modo foto', description: 'Crea carteles de la mani para compartir.' },
  { id: 'workshop', level: 2, label: 'Taller de mejoras', description: 'Invierte Eco en mejoras incrementales.' },
  { id: 'need_map', level: 4, label: 'Mapa de necesidad', description: 'Descubre qué manis necesitan refuerzos y rinden más.' },
  { id: 'photo_riso', level: 6, label: 'Filtro Riso', description: 'Bicromía rosa y azul con desregistro para tus fotos.' },
  { id: 'photo_night', level: 8, label: 'Hora nocturna', description: 'Fotografía la mani a la luz de los farolillos.' },
  { id: 'auto_deploy', level: 10, label: 'Despliegue estratégico', description: 'Envía tu reserva a donde más falta hace con un toque.' },
  { id: 'photo_screen', level: 12, label: 'Filtro Serigrafía', description: 'Trama de semitono y tinta gruesa, estilo cartel.' },
  { id: 'comic_panels', level: 15, label: 'Viñetas épicas', description: 'Planos de cómic automáticos en los momentos culminantes.' }
]

export function xpForDay(steps, streakLength = 0) {
  const credited = Math.min(Math.max(0, steps), DAILY_STEP_CAP)
  let xp = Math.floor(credited / STEPS_PER_XP)
  if (credited >= ACTIVE_DAY_MIN_STEPS) {
    xp += ACTIVE_DAY_XP + Math.min(Math.max(0, streakLength - 1) * STREAK_XP_PER_DAY, STREAK_XP_CAP)
  }
  return xp
}

export function xpForLevel(level) {
  return Math.round(CURVE_BASE * Math.max(0, level - 1) ** CURVE_EXP)
}

export function levelFromXp(xp) {
  let level = Math.floor((Math.max(0, xp) / CURVE_BASE) ** (1 / CURVE_EXP)) + 1
  while (xpForLevel(level + 1) <= xp) level++
  while (level > 1 && xpForLevel(level) > xp) level--
  return level
}

export function levelProgress(xp) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  return { level, xp, levelFloor: floor, levelCeil: ceil, ratio: (xp - floor) / (ceil - floor) }
}

export function unitCapacity(level, activeDays = 0, extra = 0) {
  const base = Math.floor(3 + 1.5 * (level - 1) + 0.1 * level * level)
  return base + Math.floor(Math.max(0, activeDays) / ACTIVE_DAYS_PER_SENIORITY_UNIT) + extra
}

export function unlockTrack(maxLevel = MAX_TRACK_LEVEL) {
  const track = Array.from({ length: maxLevel }, (_, i) => ({ level: i + 1, capacity: unitCapacity(i + 1), xp: xpForLevel(i + 1), unlocks: [] }))
  const push = (level, item) => { if (level >= 1 && level <= maxLevel) track[level - 1].unlocks.push(item) }
  for (const [id, role] of Object.entries(UNIT_ROLES)) {
    if (!role.category) push(role.unlockLevel, { kind: 'unit', id, label: role.label, description: role.description })
  }
  for (const [id, up] of Object.entries(UPGRADES)) push(up.minLevel, { kind: 'upgrade', id, label: up.label, description: up.description })
  for (const item of COSMETICS) if (item.unlockLevel) push(item.unlockLevel, { kind: 'cosmetic', id: item.id, label: item.name, description: 'Accesorio estético' })
  for (const f of FEATURES) push(f.level, { kind: 'feature', id: f.id, label: f.label, description: f.description })
  return track
}

export function categoryUnits() {
  return Object.entries(UNIT_ROLES).filter(([, r]) => r.category).map(([id, r]) => ({ id, label: r.label, description: r.description, category: r.category, level: r.unlockLevel }))
}

export function featureUnlocked(id, level) {
  const f = FEATURES.find(x => x.id === id)
  return Boolean(f) && level >= f.level
}
