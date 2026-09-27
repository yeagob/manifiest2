import { UNIT_ROLES } from './units.js'

export const GENOME_VERSION = 1

export const RISO_INKS = {
  paper: '#F4EFE6',
  ink: '#1D1B2F',
  fluoPink: '#FF48B0',
  blue: '#0078BF',
  yellow: '#FFE800',
  green: '#00A95C',
  orange: '#FF6C2F',
  teal: '#00838A',
  purple: '#765BA7',
  red: '#FF4C65',
  mint: '#82D8D5',
  sunflower: '#FFB511',
  navy: '#3D5588'
}

export const OUTFIT_PALETTES = [
  ['fluoPink', 'navy'],
  ['blue', 'yellow'],
  ['green', 'fluoPink'],
  ['orange', 'teal'],
  ['purple', 'sunflower'],
  ['red', 'mint'],
  ['teal', 'orange'],
  ['yellow', 'purple'],
  ['mint', 'red'],
  ['sunflower', 'blue'],
  ['navy', 'fluoPink'],
  ['fluoPink', 'yellow']
]

export const SKIN_TONES = ['#FDE3CE', '#F6CBA6', '#E8B08A', '#D19A6C', '#B07A4F', '#8D5A3B', '#6B4128', '#4A2C1D']
export const HAIR_COLORS = ['#1D1B2F', '#3B2A20', '#6A4028', '#B5652D', '#E8C872', '#D9D4CC']
export const FANTASY_HAIR = ['fluoPink', 'blue', 'green', 'mint', 'purple', 'orange']

export const TRAITS = {
  body: ['round', 'tall', 'square', 'pear'],
  hair: ['short', 'curly', 'bun', 'long', 'mohawk', 'braids', 'afro', 'bob', 'buzz', 'ponytail', 'bald', 'waves'],
  top: ['hoodie', 'raincoat', 'overalls', 'jacket', 'tee', 'poncho', 'sweater', 'vest'],
  pattern: ['plain', 'plain', 'dots', 'stripes', 'halftone', 'checks'],
  rarePattern: ['holo', 'stars', 'flames', 'waves'],
  headwear: ['none', 'none', 'none', 'cap', 'beanie', 'headband', 'flowerCrown', 'helmet', 'bucket'],
  face: ['none', 'none', 'none', 'glasses', 'roundGlasses', 'bandana', 'paint', 'heart'],
  expression: ['determined', 'singing', 'smile', 'shout', 'calm', 'wink']
}

export const RARITIES = ['common', 'rare', 'epic', 'legendary']
export const RARITY_LABELS = { common: 'Común', rare: 'Rara', epic: 'Épica', legendary: 'Legendaria' }

const NAME_NOUNS = ['Brisa', 'Raíz', 'Faro', 'Chispa', 'Marea', 'Semilla', 'Trueno', 'Lumbre', 'Río', 'Aurora', 'Cometa', 'Eco', 'Alba', 'Roble', 'Nube', 'Volcán', 'Colibrí', 'Estrella', 'Ola', 'Tambor', 'Luciérnaga', 'Cierzo', 'Magma', 'Girasol']
const NAME_ADJECTIVES = ['Tenaz', 'Valiente', 'Audaz', 'Libre', 'Rebelde', 'Firme', 'Alegre', 'Veloz', 'Constante', 'Feroz', 'Fugaz', 'Imparable', 'Incansable', 'Radiante', 'Vibrante', 'Paciente', 'Humilde', 'Indomable', 'Brillante', 'Insurgente']
const LEGENDARY_TITLES = ['de la Primera Fila', 'del Alba', 'de las Mil Calles', 'que No Se Rinde', 'de la Marea Verde', 'del Último Kilómetro']

export function hashString(input) {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function createRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed))
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)]
}

export function rarityOdds(level) {
  return {
    legendary: Math.min(0.005 + 0.001 * level, 0.03),
    epic: Math.min(0.03 + 0.004 * level, 0.12),
    rare: Math.min(0.15 + 0.01 * level, 0.35)
  }
}

export function rollRarity(seed, level, role = 'marcher') {
  const rng = createRng(`rarity:${seed}`)
  const odds = rarityOdds(level)
  const r = rng()
  let index = 0
  if (r < odds.legendary) index = 3
  else if (r < odds.legendary + odds.epic) index = 2
  else if (r < odds.legendary + odds.epic + odds.rare) index = 1
  if ((UNIT_ROLES[role]?.cost ?? 1) >= 6) index = Math.max(index, 1)
  return RARITIES[index]
}

export function generateGenome(seed, { rarity = 'common', role = 'marcher' } = {}) {
  const rng = createRng(`genome:${GENOME_VERSION}:${seed}`)
  const tier = RARITIES.indexOf(rarity)
  const palette = pick(rng, OUTFIT_PALETTES)
  const fantasyHair = tier >= 1 && rng() < 0.5
  const heldItems = UNIT_ROLES[role]?.heldItems ?? ['none']
  const genome = {
    version: GENOME_VERSION,
    seed,
    rarity,
    role,
    body: pick(rng, TRAITS.body),
    skin: pick(rng, SKIN_TONES),
    hair: pick(rng, TRAITS.hair),
    hairColor: fantasyHair ? RISO_INKS[pick(rng, FANTASY_HAIR)] : pick(rng, HAIR_COLORS),
    top: pick(rng, TRAITS.top),
    primary: RISO_INKS[palette[0]],
    secondary: RISO_INKS[palette[1]],
    pattern: tier >= 2 && rng() < 0.7 ? pick(rng, TRAITS.rarePattern) : pick(rng, TRAITS.pattern),
    headwear: pick(rng, TRAITS.headwear),
    face: pick(rng, TRAITS.face),
    expression: pick(rng, TRAITS.expression),
    heldItem: pick(rng, heldItems),
    aura: ['none', 'glow', 'sparkles', 'halo'][tier],
    height: 0.9 + rng() * 0.25,
    tilt: (rng() - 0.5) * 8
  }
  genome.name = generateName(seed, rarity)
  return genome
}

export function generateName(seed, rarity = 'common') {
  const rng = createRng(`name:${seed}`)
  const base = `${pick(rng, NAME_NOUNS)} ${pick(rng, NAME_ADJECTIVES)}`
  return rarity === 'legendary' ? `${base} ${pick(rng, LEGENDARY_TITLES)}` : base
}
