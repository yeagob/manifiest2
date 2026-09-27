import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  allocateSteps, buildPattern, validatePattern, patternShares,
  xpForDay, levelFromXp, xpForLevel, unitCapacity,
  canMint, usedCapacity, figuresFor,
  generateGenome, rollRarity, createRng,
  findCosmetic, ownsCosmetic
} from '../src/index.js'

test('el patrón 1 animales, 1 medio ambiente, 3 guerra reparte exactamente', () => {
  const pattern = buildPattern([
    { causeId: 'animales', slots: 1 },
    { causeId: 'ambiente', slots: 1 },
    { causeId: 'guerra', slots: 3 }
  ])
  const { allocation, cursor } = allocateSteps(pattern, 0, 10)
  assert.deepEqual(allocation, { animales: 2, ambiente: 2, guerra: 6 })
  assert.equal(cursor, 0)
  assert.deepEqual(patternShares(pattern), { animales: 0.2, ambiente: 0.2, guerra: 0.6 })
})

test('el cursor conserva el resto entre lotes y la suma siempre es fiel', () => {
  const pattern = ['a', 'b', 'c', 'c', 'c']
  let cursor = 0
  const totals = {}
  let sent = 0
  for (const batch of [1, 2, 3, 7, 11, 13, 1]) {
    const r = allocateSteps(pattern, cursor, batch)
    cursor = r.cursor
    sent += batch
    for (const [k, v] of Object.entries(r.allocation)) totals[k] = (totals[k] || 0) + v
  }
  const whole = allocateSteps(pattern, 0, sent).allocation
  assert.deepEqual(totals, whole)
  assert.equal(Object.values(totals).reduce((s, v) => s + v, 0), sent)
})

test('patrón vacío no asigna nada', () => {
  assert.deepEqual(allocateSteps([], 0, 100), { allocation: {}, cursor: 0 })
  assert.equal(validatePattern('x'), 'El patrón debe ser una lista')
  assert.equal(validatePattern(['a']), null)
})

test('progresión: XP, nivel y capacidad', () => {
  assert.equal(xpForDay(1500), 15)
  assert.equal(xpForDay(8000, 1), 100)
  assert.equal(xpForDay(8000, 3), 110)
  assert.equal(xpForDay(1_000_000), 700 + 20)
  assert.equal(levelFromXp(0), 1)
  assert.equal(levelFromXp(xpForLevel(10)), 10)
  assert.equal(levelFromXp(xpForLevel(10) - 1), 9)
  assert.equal(unitCapacity(1), 3)
  assert.ok(unitCapacity(20) > unitCapacity(10))
  assert.equal(unitCapacity(1, 60), 5)
})

test('acuñar unidades respeta nivel y capacidad', () => {
  assert.equal(canMint('marcher', [], 1, 3), null)
  assert.match(canMint('drummer', [], 1, 3), /nivel 5/)
  const units = [{ role: 'marcher' }, { role: 'marcher' }, { role: 'marcher' }]
  assert.equal(usedCapacity(units), 3)
  assert.match(canMint('marcher', units, 1, 3), /capacidad/)
  assert.equal(figuresFor([{ role: 'drummer' }, { role: 'marcher' }]), 4)
})

test('los genomas son deterministas y únicos por semilla', () => {
  const a = generateGenome('seed-1', { rarity: 'epic', role: 'marcher' })
  const b = generateGenome('seed-1', { rarity: 'epic', role: 'marcher' })
  const c = generateGenome('seed-2', { rarity: 'epic', role: 'marcher' })
  assert.deepEqual(a, b)
  assert.notDeepEqual(a, c)
  assert.equal(a.aura, 'sparkles')
  assert.equal(generateGenome('x', { role: 'drummer' }).heldItem, 'drum')
  const rng = createRng('r')
  assert.ok(rng() >= 0 && rng() < 1)
})

test('la rareza mejora con el nivel y los roles grandes son al menos raros', () => {
  const count = (level) => {
    let n = 0
    for (let i = 0; i < 4000; i++) if (rollRarity(`s${i}`, level) !== 'common') n++
    return n
  }
  assert.ok(count(20) > count(1))
  assert.notEqual(rollRarity('abc', 1, 'float'), 'common')
})

test('cosméticos: por nivel o por compra', () => {
  const neon = findCosmetic('placard_neon')
  assert.equal(ownsCosmetic(neon, 50, []), false)
  assert.equal(ownsCosmetic(neon, 1, ['placard_neon']), true)
  assert.equal(ownsCosmetic(findCosmetic('placard_riso'), 4, []), true)
})
