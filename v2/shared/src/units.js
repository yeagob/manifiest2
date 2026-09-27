export const UNIT_ROLES = {
  marcher: { label: 'Manifestante', description: 'La base de toda marcha. Lleva pancarta, bandera, flor o el puño en alto.', cost: 1, unlockLevel: 1, figures: 1, ecoRate: 1, mintCost: 20, heldItems: ['sign', 'flag', 'flower', 'none', 'fist'], sound: 'voices', formation: 'free' },
  flag_bearer: { label: 'Abanderada', description: 'Bandera alta que se ve desde el dron y silba el ritmo.', cost: 2, unlockLevel: 3, figures: 1, ecoRate: 2.2, mintCost: 60, heldItems: ['bigflag'], sound: 'whistle', formation: 'free' },
  drummer: { label: 'Batucada', description: 'Trío de percusión: surdo, caja y repique marcan el paso del bloque.', cost: 3, unlockLevel: 5, figures: 3, ecoRate: 3.5, mintCost: 120, heldItems: ['drum'], sound: 'samba', formation: 'row' },
  megaphone: { label: 'Megáfono', description: 'Lanza los cánticos de tu pancarta y el bloque responde.', cost: 3, unlockLevel: 7, figures: 1, ecoRate: 3.5, mintCost: 120, heldItems: ['megaphone'], sound: 'megaphone', formation: 'free' },
  color_smoke: { label: 'Humo de colores', description: 'Bengalas de humo en las tintas de tu unidad.', cost: 4, unlockLevel: 9, figures: 1, ecoRate: 4.5, mintCost: 180, heldItems: ['smoke'], sound: 'hiss', formation: 'free', special: 'smoke' },
  giant_banner: { label: 'Pancarta de cabecera', description: 'Seis personas sostienen tu pancarta a lo ancho de la calle.', cost: 6, unlockLevel: 11, figures: 6, ecoRate: 7, mintCost: 320, heldItems: ['banner'], sound: 'voices', formation: 'banner', special: 'banner' },
  choir: { label: 'Coro', description: 'Cuatro voces que convierten el lema en canción.', cost: 4, unlockLevel: 12, figures: 4, ecoRate: 5, mintCost: 220, heldItems: ['songbook'], sound: 'choir', formation: 'row' },
  puppet_giant: { label: 'Gigante', description: 'Figura de cartón de tres metros que baila sobre la multitud.', cost: 8, unlockLevel: 14, figures: 1, ecoRate: 9.5, mintCost: 450, heldItems: ['puppet'], sound: 'bombo', formation: 'center', scale: 2.4 },
  bike_bloc: { label: 'Bicicletada', description: 'Tres bicis de cartón con timbre y ruedas que giran.', cost: 5, unlockLevel: 16, figures: 3, ecoRate: 6, mintCost: 300, heldItems: ['bike'], sound: 'bells', formation: 'row' },
  brass_band: { label: 'Charanga', description: 'Trompeta, trombón, tuba y bombo: la fiesta dentro de la protesta.', cost: 7, unlockLevel: 18, figures: 4, ecoRate: 8, mintCost: 420, heldItems: ['trumpet'], sound: 'brass', formation: 'row' },
  float: { label: 'Carroza', description: 'Plataforma de cartón con música propia.', cost: 20, unlockLevel: 20, figures: 1, ecoRate: 24, mintCost: 1500, heldItems: ['float'], sound: 'bass', formation: 'center', scale: 2.2 },
  lanterns: { label: 'Farolillos de papel', description: 'Farolillos que flotan sobre el bloque y brillan de noche.', cost: 6, unlockLevel: 22, figures: 2, ecoRate: 7, mintCost: 380, heldItems: ['lantern'], sound: 'chimes', formation: 'row', special: 'lanterns' },
  paper_dragon: { label: 'Dragón de papel', description: 'Ocho porteadores y un dragón que serpentea entre la gente.', cost: 24, unlockLevel: 25, figures: 8, ecoRate: 30, mintCost: 2400, heldItems: ['pole'], sound: 'dragon', formation: 'dragon', special: 'dragon' },
  card_mosaic: { label: 'Mosaico humano', description: 'Doce cartulinas que, vistas desde el cielo, dibujan el símbolo de la causa.', cost: 28, unlockLevel: 30, figures: 12, ecoRate: 36, mintCost: 3200, heldItems: ['card'], sound: 'cards', formation: 'mosaic', special: 'mosaic' },
  dove_flock: { label: 'Bandada de palomas', description: 'Palomas de papel que alzan el vuelo sobre el bloque.', cost: 8, unlockLevel: 6, figures: 1, ecoRate: 11, mintCost: 700, heldItems: ['dove'], sound: 'doves', formation: 'free', special: 'doves', category: { ids: ['paz'], steps: 50000, label: 'Paz' } },
  walking_tree: { label: 'Árbol andante', description: 'Un disfraz de árbol de cartón con pájaros incluidos.', cost: 8, unlockLevel: 6, figures: 1, ecoRate: 11, mintCost: 700, heldItems: ['tree'], sound: 'forest', formation: 'free', scale: 1.5, category: { ids: ['medio-ambiente'], steps: 50000, label: 'Medio ambiente' } },
  paper_whale: { label: 'Ballena de papel', description: 'Cuatro porteadores y una ballena que nada en el aire.', cost: 12, unlockLevel: 6, figures: 4, ecoRate: 16, mintCost: 1100, heldItems: ['pole'], sound: 'whale', formation: 'carriers', special: 'whale', category: { ids: ['animales'], steps: 80000, label: 'Animales' } },
  carried_house: { label: 'Casa a cuestas', description: 'Una casa de cartón a la espalda: el hogar que se reclama.', cost: 8, unlockLevel: 6, figures: 1, ecoRate: 11, mintCost: 700, heldItems: ['house'], sound: 'knock', formation: 'free', scale: 1.3, category: { ids: ['vivienda'], steps: 50000, label: 'Vivienda' } },
  rainbow_flag: { label: 'Arcoíris gigante', description: 'Cinco personas bajo una bandera arcoíris de veinte metros.', cost: 10, unlockLevel: 6, figures: 5, ecoRate: 13, mintCost: 900, heldItems: ['pole'], sound: 'voices', formation: 'carriers', special: 'rainbow', category: { ids: ['igualdad', 'derechos-humanos'], steps: 60000, label: 'Igualdad y derechos' } }
}

export function categoryProgress(role, categorySteps = {}) {
  const req = UNIT_ROLES[role]?.category
  if (!req) return null
  const steps = req.ids.reduce((s, id) => s + (categorySteps[id] ?? 0), 0)
  return { steps, required: req.steps, label: req.label, ratio: Math.min(1, steps / req.steps) }
}

export function roleUnlocked(role, level, categorySteps = {}) {
  const def = UNIT_ROLES[role]
  if (!def || level < def.unlockLevel) return false
  const progress = categoryProgress(role, categorySteps)
  return !progress || progress.steps >= progress.required
}

export function lockReason(role, level, categorySteps = {}) {
  const def = UNIT_ROLES[role]
  if (!def) return 'Rol desconocido'
  if (level < def.unlockLevel) return `Se desbloquea en el nivel ${def.unlockLevel}`
  const progress = categoryProgress(role, categorySteps)
  if (progress && progress.steps < progress.required) {
    return `Aporta ${progress.required.toLocaleString('es-ES')} pasos a causas de ${progress.label} (llevas ${progress.steps.toLocaleString('es-ES')})`
  }
  return null
}

export function usedCapacity(units) {
  return units.reduce((sum, u) => sum + (UNIT_ROLES[u.role]?.cost ?? 0), 0)
}

export function canMint(role, units, level, capacity, context = {}) {
  const locked = lockReason(role, level, context.categorySteps)
  if (locked) return locked
  if (usedCapacity(units) + UNIT_ROLES[role].cost > capacity) return 'No tienes capacidad libre suficiente'
  if (context.eco !== undefined && context.price !== undefined && context.eco < context.price) return 'No tienes Eco suficiente'
  return null
}

export function figuresFor(units) {
  return units.reduce((sum, u) => sum + (UNIT_ROLES[u.role]?.figures ?? 0), 0)
}
