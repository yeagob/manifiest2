import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  UNIT_ROLES, UPGRADES, upgradeCost, upgradeProblem, storageHours, stepsEco, mintCost, rankFor,
  needMultiplier, effectiveNeed, ecoRatePerHour, pendingEco, crossedMilestones,
  roleUnlocked, lockReason, categoryProgress, unlockTrack, featureUnlocked, unitCapacity, generateGenome
} from '../src/index.js'

test('las mejoras crecen de forma exponencial y respetan nivel, máximo y saldo', () => {
  assert.equal(upgradeCost('imprenta', 0), 50)
  assert.equal(upgradeCost('imprenta', 1), 80)
  assert.ok(upgradeCost('imprenta', 10) > 5000)
  assert.match(upgradeProblem('furgoneta', {}, 1, 1e9), /nivel 4/)
  assert.match(upgradeProblem('imprenta', {}, 5, 10), /Eco/)
  assert.match(upgradeProblem('caja', { caja: 10 }, 30, 1e9), /máximo/)
  assert.equal(upgradeProblem('imprenta', {}, 2, 50), null)
  assert.equal(storageHours({ caja: 3 }), 20)
  assert.equal(stepsEco(1000, { zapatillas: 5 }), 15)
})

test('los tres primeros manifestantes son gratis y la cartonería abarata especiales', () => {
  assert.equal(mintCost('marcher', {}, 0), 0)
  assert.equal(mintCost('marcher', {}, 3), UNIT_ROLES.marcher.mintCost)
  assert.equal(mintCost('drummer', { carton: 2 }), Math.round(120 * 0.9))
})

test('rangos de veteranía por horas de servicio, más rápidos con la escuela', () => {
  assert.equal(rankFor(0).id, 'novata')
  assert.equal(rankFor(25 * 3600).id, 'curtida')
  assert.equal(rankFor(170 * 3600).id, 'veterana')
  assert.equal(rankFor(160 * 3600, { escuela: 5 }).id, 'veterana')
  assert.equal(rankFor(800 * 3600).id, 'historica')
})

test('necesidad: una mani vacía o infradotada rinde más, una saturada menos', () => {
  assert.equal(needMultiplier({ people: 10, deployed: 0, globalRatio: 2 }), 3)
  assert.equal(needMultiplier({ people: 10, deployed: 10, globalRatio: 2 }), 2)
  assert.equal(needMultiplier({ people: 10, deployed: 80, globalRatio: 2 }), 0.5)
  assert.equal(needMultiplier({ people: 10, deployed: 20, globalRatio: 2, ageDays: 2 }), 1.3)
  assert.equal(effectiveNeed(2, { asamblea: 4 }), 3)
  assert.equal(effectiveNeed(0.5, { asamblea: 4 }), 0.5)
})

test('generación de Eco: rango, necesidad, imprenta y red de apoyo', () => {
  const units = [
    { role: 'marcher', causeId: 'a', rankMult: 1 },
    { role: 'marcher', causeId: 'b', rankMult: 1.25 },
    { role: 'drummer', causeId: null }
  ]
  assert.equal(ecoRatePerHour(units, { a: 1, b: 2 }, {}), 1 + 2.5)
  const boosted = ecoRatePerHour(units, { a: 1, b: 2 }, { imprenta: 2, red: 1 })
  assert.ok(Math.abs(boosted - 3.5 * 1.3 * 1.06) < 1e-9)
  assert.equal(pendingEco(10, 3600 * 2, {}), 20)
  assert.equal(pendingEco(10, 3600 * 100, {}), 80)
})

test('hitos cruzados', () => {
  assert.deepEqual(crossedMilestones('people', 9, 10), [10])
  assert.deepEqual(crossedMilestones('steps', 90000, 1200000), [100000, 500000, 1000000])
  assert.deepEqual(crossedMilestones('people', 10, 11), [])
})

test('unidades de causa: se desbloquean aportando pasos a una categoría', () => {
  assert.equal(roleUnlocked('dove_flock', 10, { paz: 10000 }), false)
  assert.match(lockReason('dove_flock', 10, { paz: 10000 }), /50\.000 pasos a causas de Paz/)
  assert.equal(roleUnlocked('dove_flock', 10, { paz: 50000 }), true)
  assert.equal(roleUnlocked('dove_flock', 3, { paz: 50000 }), false)
  assert.equal(categoryProgress('rainbow_flag', { igualdad: 30000, 'derechos-humanos': 30000 }).ratio, 1)
})

test('la pista de progresión desbloquea algo en cada nivel del 1 al 30', () => {
  const track = unlockTrack()
  assert.equal(track.length, 30)
  assert.ok(track.every(t => t.unlocks.length > 0))
  assert.ok(track[4].unlocks.some(u => u.id === 'drummer'))
  assert.equal(featureUnlocked('workshop', 1), false)
  assert.equal(featureUnlocked('workshop', 2), true)
  assert.equal(unitCapacity(5, 0, 3), unitCapacity(5) + 3)
})

test('todos los roles tienen objeto, sonido y genoma válido', () => {
  for (const role of Object.keys(UNIT_ROLES)) {
    const g = generateGenome(`s-${role}`, { role })
    assert.ok(UNIT_ROLES[role].heldItems.includes(g.heldItem))
    assert.ok(UNIT_ROLES[role].sound)
  }
  assert.ok(Object.values(UPGRADES).every(u => u.effect(1)))
})
