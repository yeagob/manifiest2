import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { isoDate, addDays } from '../src/lib/time.js'
import { openDatabase } from '../src/db/index.js'
import { setup, createUser, createCause } from './helpers.js'

const bearer = u => ({ Authorization: `Bearer ${u.token}` })

async function mintAndSend(app, u, causeId, n = 3) {
  for (let i = 0; i < n; i++) await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'marcher' }).expect(201)
  return request(app).post(`/api/game/fronts/${causeId}/send`).set(bearer(u)).send({ role: 'marcher', count: n }).expect(200)
}

test('el Eco se acumula con el tiempo, se recoge y respeta el almacenamiento', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const cause = await createCause(app, u.token)
  const state = (await mintAndSend(app, u, cause.id)).body
  assert.equal(state.reserve.marcher, undefined)
  assert.equal(state.fronts[0].myUnits, 3)
  assert.equal(state.fronts[0].need, 1.3)
  assert.ok(state.eco.ratePerHour > 0)
  ctx.db.prepare('UPDATE users SET eco_collected_at = ? WHERE id = ?').run(new Date(Date.now() - 2 * 3600e3).toISOString(), u.id)
  const pending = (await request(app).get('/api/game/state').set(bearer(u))).body.eco.pending
  assert.ok(Math.abs(pending - state.eco.ratePerHour * 2) < 0.01)
  const collected = (await request(app).post('/api/game/collect').set(bearer(u)).expect(200)).body
  assert.ok(Math.abs(collected.collected - pending) < 0.05)
  ctx.db.prepare('UPDATE users SET eco_collected_at = ? WHERE id = ?').run(new Date(Date.now() - 100 * 3600e3).toISOString(), u.id)
  const capped = (await request(app).get('/api/game/state').set(bearer(u))).body.eco
  assert.ok(Math.abs(capped.pending - capped.ratePerHour * capped.storageHours) < 0.01)
})

test('los pasos reales dan Eco y el taller consume Eco con coste creciente', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', isoDate(), 20000)
  let state = (await request(app).get('/api/game/state').set(bearer(u))).body
  assert.equal(state.eco.balance, 200)
  assert.ok(state.progress.level >= 2)
  const imprenta = state.upgrades.find(x => x.id === 'imprenta')
  assert.equal(imprenta.cost, 50)
  state = (await request(app).post('/api/game/upgrades/imprenta').set(bearer(u)).expect(200)).body
  assert.equal(state.upgrades.find(x => x.id === 'imprenta').level, 1)
  assert.equal(state.upgrades.find(x => x.id === 'imprenta').cost, 80)
  assert.equal(state.eco.balance, 150)
  const locked = await request(app).post('/api/game/upgrades/carton').set(bearer(u))
  assert.match(locked.body.error, /nivel 10/)
})

test('acuñar cuesta Eco tras los tres primeros y las unidades de causa exigen pasos en su categoría', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  for (let i = 0; i < 3; i++) await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'marcher' }).expect(201)
  ctx.db.prepare('UPDATE users SET level = 8, xp = 5000 WHERE id = ?').run(u.id)
  const noEco = await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'marcher' })
  assert.equal(noEco.body.code, 'cannot_mint')
  assert.match(noEco.body.error, /Eco/)
  ctx.db.prepare('UPDATE users SET eco_balance = 5000 WHERE id = ?').run(u.id)
  await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'marcher' }).expect(201)
  const dove = await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'dove_flock' })
  assert.match(dove.body.error, /Paz/)
  const peace = await createCause(app, u.token, { category: 'paz' })
  await request(app).put('/api/steps/pattern').set(bearer(u)).send({ pattern: [peace.id] }).expect(200)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', addDays(isoDate(), -1), 30000)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', isoDate(), 30000)
  const ok = await request(app).post('/api/units/mint').set(bearer(u)).send({ role: 'dove_flock' })
  assert.equal(ok.status, 201)
  assert.equal(ok.body.genome.heldItem, 'dove')
})

test('retirada, veteranía por tiempo de servicio y despliegue estratégico', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const a = await createCause(app, u.token, { title: 'Frente saturado de gente' })
  const b = await createCause(app, u.token, { title: 'Frente que necesita apoyo' })
  await mintAndSend(app, u, a.id)
  ctx.db.prepare('UPDATE units SET deployed_at = ? WHERE user_id = ?').run(new Date(Date.now() - 30 * 3600e3).toISOString(), u.id)
  const units = (await request(app).get('/api/units').set(bearer(u))).body.units
  assert.ok(units.every(x => x.rank.id === 'curtida'))
  let state = (await request(app).post(`/api/game/fronts/${a.id}/recall`).set(bearer(u)).send({ role: 'marcher', count: 2 }).expect(200)).body
  assert.equal(state.reserve.marcher, 2)
  const kept = ctx.db.prepare('SELECT service_seconds FROM units WHERE user_id = ? AND cause_id IS NULL').all(u.id)
  assert.ok(kept.every(k => k.service_seconds >= 30 * 3600 - 5))
  const locked = await request(app).post('/api/game/auto-deploy').set(bearer(u))
  assert.equal(locked.status, 403)
  ctx.db.prepare('UPDATE users SET level = 10 WHERE id = ?').run(u.id)
  state = (await request(app).post('/api/game/auto-deploy').set(bearer(u)).expect(200)).body
  assert.equal(state.fronts.find(f => f.id === b.id).myUnits, 2)
})

test('los hitos de la causa recompensan a quien tenía unidades allí y se anuncian', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const cause = await createCause(app, u.token)
  await request(app).post(`/api/causes/${cause.id}/join`).set(bearer(u))
  await mintAndSend(app, u, cause.id)
  const seen = []
  ctx.events.on('milestone', m => seen.push(m))
  const before = ctx.db.prepare('SELECT eco_balance FROM users WHERE id = ?').get(u.id).eco_balance
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', isoDate(), 60000)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', addDays(isoDate(), -1), 50000)
  assert.deepEqual(seen.map(m => m.threshold), [100000])
  const after = ctx.db.prepare('SELECT eco_balance FROM users WHERE id = ?').get(u.id).eco_balance
  assert.equal(Math.round(after - before), 1100 + 75)
  const scene = (await request(app).get(`/api/protests/${cause.id}/scene`)).body
  assert.equal(scene.milestones[0].threshold, 100000)
})

test('la migración añade columnas nuevas a una base de datos antigua', () => {
  const file = `/tmp/manifiest-migration-${process.pid}.db`
  const Database = openDatabase(':memory:').constructor
  const old = new Database(file)
  old.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT, google_sub TEXT UNIQUE, display_name TEXT NOT NULL,
    email_verified_at TEXT, role TEXT NOT NULL DEFAULT 'user', xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, active_days INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 0, unallocated_steps INTEGER NOT NULL DEFAULT 0, pattern_json TEXT NOT NULL DEFAULT '[]', pattern_cursor INTEGER NOT NULL DEFAULT 0,
    unit_serial INTEGER NOT NULL DEFAULT 0, failed_logins INTEGER NOT NULL DEFAULT 0, locked_until TEXT, disabled_at TEXT, created_at TEXT)`)
  old.exec(`CREATE TABLE units (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, serial INTEGER NOT NULL, seed TEXT NOT NULL UNIQUE, genome_version INTEGER NOT NULL,
    role TEXT NOT NULL, rarity TEXT NOT NULL, name TEXT NOT NULL, cause_id TEXT, loadout_json TEXT NOT NULL DEFAULT '{}', created_at TEXT)`)
  old.close()
  const db = openDatabase(file)
  const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name)
  const unitCols = db.prepare('PRAGMA table_info(units)').all().map(c => c.name)
  assert.ok(['eco_balance', 'eco_collected_at', 'upgrades_json'].every(c => userCols.includes(c)))
  assert.ok(['deployed_at', 'service_seconds'].every(c => unitCols.includes(c)))
  db.close()
})
