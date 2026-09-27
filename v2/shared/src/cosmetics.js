export const COSMETIC_KINDS = ['placardStyle', 'effect', 'palette', 'frame', 'avenueTheme']

export const COSMETICS = [
  { id: 'placard_carton', kind: 'placardStyle', name: 'Cartón reciclado', unlockLevel: 1, priceCents: null },
  { id: 'placard_riso', kind: 'placardStyle', name: 'Risografía', unlockLevel: 4, priceCents: null },
  { id: 'placard_serigrafia', kind: 'placardStyle', name: 'Serigrafía', unlockLevel: 12, priceCents: null },
  { id: 'placard_neon', kind: 'placardStyle', name: 'Neón nocturno', unlockLevel: null, priceCents: 199 },
  { id: 'placard_bordado', kind: 'placardStyle', name: 'Bordado a mano', unlockLevel: null, priceCents: 299 },
  { id: 'effect_confetti', kind: 'effect', name: 'Confeti', unlockLevel: 6, priceCents: null },
  { id: 'effect_petals', kind: 'effect', name: 'Lluvia de pétalos', unlockLevel: 15, priceCents: null },
  { id: 'effect_lanterns', kind: 'effect', name: 'Farolillos', unlockLevel: null, priceCents: 199 },
  { id: 'effect_aurora', kind: 'effect', name: 'Aurora boreal', unlockLevel: null, priceCents: 399 },
  { id: 'palette_bosque', kind: 'palette', name: 'Paleta Bosque', unlockLevel: 8, priceCents: null },
  { id: 'palette_marea', kind: 'palette', name: 'Paleta Marea', unlockLevel: null, priceCents: 149 },
  { id: 'palette_noche', kind: 'palette', name: 'Paleta Noche', unlockLevel: null, priceCents: 149 },
  { id: 'frame_sello', kind: 'frame', name: 'Marco sello postal', unlockLevel: 10, priceCents: null },
  { id: 'frame_holo', kind: 'frame', name: 'Marco holográfico', unlockLevel: null, priceCents: 249 },
  { id: 'theme_plaza', kind: 'avenueTheme', name: 'Plaza Mayor', unlockLevel: 1, priceCents: null },
  { id: 'theme_litoral', kind: 'avenueTheme', name: 'Paseo Litoral', unlockLevel: null, priceCents: 999 },
  { id: 'theme_neon', kind: 'avenueTheme', name: 'Avenida Neón', unlockLevel: null, priceCents: 999 },
  { id: 'theme_bosque', kind: 'avenueTheme', name: 'Sendero del Bosque', unlockLevel: 18, priceCents: null },
  { id: 'effect_serpentinas', kind: 'effect', name: 'Serpentinas', unlockLevel: 13, priceCents: null },
  { id: 'frame_kraft', kind: 'frame', name: 'Marco kraft cosido', unlockLevel: 17, priceCents: null },
  { id: 'placard_collage', kind: 'placardStyle', name: 'Collage de recortes', unlockLevel: 19, priceCents: null },
  { id: 'palette_atardecer', kind: 'palette', name: 'Paleta Atardecer', unlockLevel: 21, priceCents: null },
  { id: 'effect_estrellas', kind: 'effect', name: 'Estrellas de papel', unlockLevel: 23, priceCents: null },
  { id: 'placard_linograbado', kind: 'placardStyle', name: 'Linograbado', unlockLevel: 24, priceCents: null },
  { id: 'palette_oro', kind: 'palette', name: 'Pan de oro', unlockLevel: 26, priceCents: null },
  { id: 'frame_serigrafia', kind: 'frame', name: 'Marco de serigrafía', unlockLevel: 27, priceCents: null },
  { id: 'effect_tinta', kind: 'effect', name: 'Salpicadura de tinta', unlockLevel: 28, priceCents: null },
  { id: 'theme_verbena', kind: 'avenueTheme', name: 'Verbena de barrio', unlockLevel: 29, priceCents: null }
]

export const EFFECT_COLORS = {
  effect_confetti: ['#FF48B0', '#FFE800', '#0078BF', '#00A95C'],
  effect_petals: ['#FF9FD2', '#FFD1E8', '#FFFFFF'],
  effect_lanterns: ['#FFB511', '#FF6C2F'],
  effect_aurora: ['#82D8D5', '#765BA7', '#00A95C'],
  effect_serpentinas: ['#FF48B0', '#FFE800', '#82D8D5'],
  effect_estrellas: ['#FFE800', '#FFB511'],
  effect_tinta: ['#1D1B2F', '#3D5588']
}

export const PALETTE_OVERRIDES = {
  palette_bosque: ['#00A95C', '#3B2A20'],
  palette_marea: ['#0078BF', '#82D8D5'],
  palette_noche: ['#1D1B2F', '#FF48B0'],
  palette_atardecer: ['#FF6C2F', '#765BA7'],
  palette_oro: ['#FFB511', '#1D1B2F']
}

export function findCosmetic(id) {
  return COSMETICS.find(c => c.id === id) ?? null
}

export function ownsCosmetic(item, level, entitlements) {
  if (!item) return false
  if (item.unlockLevel !== null && level >= item.unlockLevel) return true
  return entitlements.includes(item.id)
}
