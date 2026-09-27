import { UNIT_ROLES, generateGenome, PALETTE_OVERRIDES, createRng, RARITIES } from '@manifiest/shared'

export const LANES = 7
export const LANE_GAP = 1.2
export const ROW_GAP = 1.35
export const BLOCK_GAP = 2.6
export const SIGN_DEPTH = 1.9
export const HEAD_DEPTH = 5

const FORMATION_ORDER = { banner: 0, dragon: 1, mosaic: 2, carriers: 3, center: 4, row: 5, free: 6 }

function colorsFor(genome, loadout) {
  const o = loadout?.palette ? PALETTE_OVERRIDES[loadout.palette] : null
  return { primary: o?.[0] ?? genome.primary, secondary: o?.[1] ?? genome.secondary }
}

export function expandUnit(unit) {
  const role = UNIT_ROLES[unit.r] ?? UNIT_ROLES.marcher
  const genome = generateGenome(unit.s, { rarity: unit.q, role: unit.r })
  const colors = colorsFor(genome, unit.l)
  const main = {
    key: unit.id, unitId: unit.id, main: true, genome, loadout: unit.l ?? {}, rank: unit.k, name: unit.n, role: unit.r,
    rarity: unit.q, colors, scale: role.scale ?? 1
  }
  const figures = [main]
  for (let i = 1; i < role.figures; i++) {
    const g = generateGenome(`${unit.s}:${i}`, { rarity: 'common', role: unit.r })
    figures.push({
      key: `${unit.id}:${i}`, unitId: unit.id, main: false, genome: { ...g, primary: colors.primary, secondary: colors.secondary, aura: 'none' },
      loadout: {}, rank: null, name: unit.n, role: unit.r, rarity: 'common', colors, scale: 1
    })
  }
  return { unit, role, figures, colors }
}

function placeFlow(state, figures) {
  const out = []
  for (const f of figures) {
    if (state.lane >= LANES) { state.lane = 0; state.row++ }
    out.push({ ...f, x: (state.lane - (LANES - 1) / 2) * LANE_GAP, z: state.row * ROW_GAP })
    state.lane++
  }
  return out
}

function newRow(state) {
  if (state.lane > 0) { state.row++; state.lane = 0 }
}

export function buildMarch(scene) {
  const blocks = []
  let cursor = HEAD_DEPTH
  let people = 0
  const markers = []
  const MARKERS = [25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

  scene.blocks.forEach((raw, index) => {
    const rng = createRng(`jitter:${raw.key}`)
    const state = { row: 0, lane: 0 }
    const figures = []
    const specials = []
    const counts = {}
    let rarest = null

    if (raw.type === 'citizens') {
      const cits = raw.citizens.map((c, i) => ({
        key: `${raw.key}:${i}`, genome: generateGenome(c.s, { rarity: 'common', role: 'marcher' }), loadout: {}, rank: null,
        role: 'marcher', rarity: 'common', scale: 1, main: true, citizen: true
      }))
      cits.forEach(c => { c.colors = { primary: c.genome.primary, secondary: c.genome.secondary } })
      figures.push(...placeFlow(state, cits))
      counts.citizen = cits.length
    } else {
      const expanded = raw.units.map(expandUnit)
      expanded.sort((a, b) => (FORMATION_ORDER[a.role.formation] ?? 9) - (FORMATION_ORDER[b.role.formation] ?? 9))
      for (const e of expanded) {
        counts[e.unit.r] = (counts[e.unit.r] ?? 0) + 1
        if (!rarest || RARITIES.indexOf(e.unit.q) > RARITIES.indexOf(rarest.rarity)) rarest = e.figures[0]
        const f = e.role.formation
        if (f === 'banner') {
          newRow(state)
          const z = state.row * ROW_GAP
          e.figures.forEach((fig, i) => figures.push({ ...fig, x: (i - (e.figures.length - 1) / 2) * 1.25, z }))
          specials.push({ type: 'banner', x: 0, z: z - 0.25, width: e.figures.length * 1.25 + 0.4, colors: e.colors, text: raw.placard?.text ?? null, unitId: e.unit.id })
          state.row++
        } else if (f === 'dragon') {
          newRow(state)
          const z0 = state.row * ROW_GAP
          e.figures.forEach((fig, i) => figures.push({ ...fig, x: i % 2 ? 1.5 : -1.5, z: z0 + Math.floor(i / 2) * ROW_GAP }))
          specials.push({ type: 'dragon', x: 0, z: z0, length: 4 * ROW_GAP, colors: e.colors, unitId: e.unit.id })
          state.row += 4
        } else if (f === 'mosaic') {
          newRow(state)
          const z0 = state.row * ROW_GAP
          e.figures.forEach((fig, i) => figures.push({ ...fig, x: ((i % 4) - 1.5) * 1.3, z: z0 + Math.floor(i / 4) * ROW_GAP }))
          specials.push({ type: 'mosaic', x: 0, z: z0 + ROW_GAP, colors: e.colors, unitId: e.unit.id })
          state.row += 3
        } else if (f === 'carriers') {
          newRow(state)
          const z0 = state.row * ROW_GAP
          const perRow = e.unit.r === 'rainbow_flag' ? 5 : 2
          e.figures.forEach((fig, i) => figures.push({ ...fig, x: perRow === 2 ? (i % 2 ? 1.5 : -1.5) : ((i % perRow) - (perRow - 1) / 2) * 1.35, z: z0 + Math.floor(i / perRow) * ROW_GAP }))
          const rows = Math.ceil(e.figures.length / perRow)
          specials.push({ type: e.role.special, x: 0, z: z0 + ((rows - 1) * ROW_GAP) / 2, width: perRow * 1.4, colors: e.colors, unitId: e.unit.id })
          state.row += rows
        } else if (f === 'center') {
          newRow(state)
          const depth = e.unit.r === 'float' ? 3 : 2
          figures.push({ ...e.figures[0], x: 0, z: (state.row + depth / 2 - 0.5) * ROW_GAP })
          state.row += depth
        } else if (f === 'row') {
          if (state.lane + e.figures.length > LANES) newRow(state)
          figures.push(...placeFlow(state, e.figures))
          if (e.role.special) specials.push({ type: e.role.special, x: figures.at(-1).x, z: figures.at(-1).z, colors: e.colors, unitId: e.unit.id })
        } else {
          const placed = placeFlow(state, e.figures)
          figures.push(...placed)
          if (e.role.special) specials.push({ type: e.role.special, x: placed[0].x, z: placed[0].z, colors: e.colors, unitId: e.unit.id })
        }
      }
    }

    const rows = state.row + (state.lane > 0 ? 1 : 0)
    const z0 = cursor
    const bodyZ = z0 + SIGN_DEPTH
    for (const f of figures) {
      f.x += (rng() - 0.5) * 0.35
      f.z = bodyZ + f.z + (rng() - 0.5) * 0.3
      f.phase = rng() * Math.PI * 2
      f.speed = 5.2 + rng() * 1.6
    }
    for (const s of specials) s.z += bodyZ
    const z1 = bodyZ + Math.max(1, rows) * ROW_GAP
    const colorCount = {}
    for (const f of figures) colorCount[f.colors.primary] = (colorCount[f.colors.primary] ?? 0) + 1
    const dominant = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c)
    const peopleHere = raw.type === 'citizens' ? raw.citizens.length : 1
    const before = people
    people += peopleHere
    for (const m of MARKERS) if (before < m && people >= m) markers.push({ z: z1, people: m })

    blocks.push({
      index, key: raw.key, type: raw.type, owner: raw.owner, placard: raw.placard, steps: raw.steps,
      title: raw.owner ? `Bloque de ${raw.owner.displayName}` : 'Bloque ciudadano',
      z0, z1, center: (z0 + z1) / 2, figures, specials, counts, dominant, rarest,
      people: peopleHere, peopleUntil: people,
      epic: specials.some(s => ['dragon', 'mosaic', 'whale', 'rainbow', 'banner'].includes(s.type)) || (rarest && ['epic', 'legendary'].includes(rarest.rarity)) || counts.float || counts.puppet_giant
    })
    cursor = z1 + BLOCK_GAP
  })

  return { blocks, length: cursor, markers }
}

export function blockAt(march, z) {
  const { blocks } = march
  let lo = 0
  let hi = blocks.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (blocks[mid].z1 + BLOCK_GAP < z) lo = mid + 1
    else if (blocks[mid].z0 > z) hi = mid - 1
    else return blocks[mid]
  }
  return blocks[Math.min(lo, blocks.length - 1)] ?? null
}

export function faithfulScene(scene) {
  return {
    ...scene,
    blocks: scene.blocks.map(b => {
      if (b.type !== 'unit') return b
      const main = b.units.find(u => u.r === 'marcher') ?? b.units[0]
      return { ...b, units: [{ ...main, r: 'marcher', id: `${main.id}:fiel` }] }
    })
  }
}
