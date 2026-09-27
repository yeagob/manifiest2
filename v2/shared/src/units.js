export const UNIT_ROLES = {
  marcher: { label: 'Manifestante', cost: 1, unlockLevel: 1, figures: 1, heldItems: ['sign', 'flag', 'flower', 'none', 'fist'] },
  flag_bearer: { label: 'Abanderada', cost: 2, unlockLevel: 3, figures: 1, heldItems: ['bigflag'] },
  drummer: { label: 'Batucada', cost: 3, unlockLevel: 5, figures: 3, heldItems: ['drum'] },
  megaphone: { label: 'Megáfono', cost: 3, unlockLevel: 7, figures: 1, heldItems: ['megaphone'] },
  color_smoke: { label: 'Humo de colores', cost: 4, unlockLevel: 9, figures: 1, heldItems: ['smoke'] },
  giant_banner: { label: 'Pancarta de cabecera', cost: 6, unlockLevel: 11, figures: 6, heldItems: ['banner'] },
  puppet_giant: { label: 'Gigante', cost: 8, unlockLevel: 14, figures: 1, heldItems: ['puppet'] },
  float: { label: 'Carroza', cost: 20, unlockLevel: 20, figures: 1, heldItems: ['float'] }
}

export function roleUnlocked(role, level) {
  const def = UNIT_ROLES[role]
  return Boolean(def) && level >= def.unlockLevel
}

export function usedCapacity(units) {
  return units.reduce((sum, u) => sum + (UNIT_ROLES[u.role]?.cost ?? 0), 0)
}

export function canMint(role, units, level, capacity) {
  if (!UNIT_ROLES[role]) return 'Rol desconocido'
  if (!roleUnlocked(role, level)) return `Se desbloquea en el nivel ${UNIT_ROLES[role].unlockLevel}`
  if (usedCapacity(units) + UNIT_ROLES[role].cost > capacity) return 'No tienes capacidad libre suficiente'
  return null
}

export function figuresFor(units) {
  return units.reduce((sum, u) => sum + (UNIT_ROLES[u.role]?.figures ?? 0), 0)
}
