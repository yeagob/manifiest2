import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { isoDate, addDays } from '../src/lib/time.js'
import { setup, createUser, createCause } from './helpers.js'

test('patrón 1-1-3, varias fuentes sin doble conteo y totales fieles', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${u.token}` }
  const animals = await createCause(app, u.token, { title: 'Animales libres ya' })
  const env = await createCause(app, u.token, { title: 'Medio ambiente vivo' })
  const war = await createCause(app, u.token, { title: 'No a la guerra hoy' })
  await request(app).put('/api/steps/pattern').set(auth).send({ pattern: [animals.id, env.id, war.id, war.id, war.id] }).expect(200)

  const today = isoDate()
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', today, 4000)
  ctx.ledger.recordDailyTotal(u.id, 'device:ios', today, 3000)
  ctx.ledger.recordDailyTotal(u.id, 'device:ios', today, 5001)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', today, 4500)

  const me = await request(app).get('/api/auth/me').set(auth).expect(200)
  assert.equal(me.body.totalSteps, 5001)
  const causes = Object.fromEntries((await request(app).get('/api/causes')).body.map(c => [c.id, c.totalSteps]))
  assert.equal(causes[animals.id] + causes[env.id] + causes[war.id], 5001)
  assert.equal(causes[war.id], 3000)
  assert.equal(causes[animals.id], 1001)
})

test('sin patrón los pasos van a la reserva y se reparten después', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${u.token}` }
  ctx.ledger.recordDailyTotal(u.id, 'garmin', isoDate(), 1234)
  let me = (await request(app).get('/api/auth/me').set(auth)).body
  assert.equal(me.unallocatedSteps, 1234)
  const cause = await createCause(app, u.token)
  await request(app).post(`/api/causes/${cause.id}/join`).set(auth).expect(200)
  await request(app).post('/api/steps/reserve/allocate').set(auth).expect(200)
  me = (await request(app).get('/api/auth/me').set(auth)).body
  assert.equal(me.unallocatedSteps, 0)
  assert.equal((await request(app).get(`/api/causes/${cause.id}`)).body.totalSteps, 1234)
})

test('integridad: tope diario, fechas futuras y antiguas', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const r = ctx.ledger.recordDailyTotal(u.id, 'fitbit', isoDate(), 500000)
  assert.equal(r.delta, 70000)
  assert.equal(ctx.db.prepare('SELECT COUNT(*) AS n FROM integrity_flags').get().n, 1)
  assert.throws(() => ctx.ledger.recordDailyTotal(u.id, 'fitbit', addDays(isoDate(), 3), 10), /futuro/)
  assert.equal(ctx.ledger.recordDailyTotal(u.id, 'fitbit', addDays(isoDate(), -90), 10).ignored, 'too_old')
  assert.throws(() => ctx.ledger.recordDailyTotal(u.id, 'inventada', isoDate(), 10), /Fuente/)
})

test('XP, días activos y subida de nivel', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  for (let i = 5; i >= 0; i--) ctx.ledger.recordDailyTotal(u.id, 'fitbit', addDays(isoDate(), -i), 12000)
  const me = (await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${u.token}` })).body
  assert.equal(me.activeDays, 6)
  assert.ok(me.progress.xp > 800)
  assert.ok(me.progress.level >= 3)
  assert.ok(me.capacity > 3)
})
