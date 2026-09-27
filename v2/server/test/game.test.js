import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { isoDate, addDays } from '../src/lib/time.js'
import { setup, createUser, createCause } from './helpers.js'

test('acuñar unidades únicas, desplegarlas y ver la escena con números fieles', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${u.token}` }
  const cause = await createCause(app, u.token)
  await request(app).post(`/api/causes/${cause.id}/join`).set(auth).expect(200)
  ctx.ledger.recordDailyTotal(u.id, 'fitbit', isoDate(), 3000)

  const minted = []
  for (let i = 0; i < 3; i++) minted.push((await request(app).post('/api/units/mint').set(auth).send({ role: 'marcher' }).expect(201)).body)
  assert.equal(new Set(minted.map(m => m.genome.seed)).size, 3)
  assert.ok(minted[0].name)
  const full = await request(app).post('/api/units/mint').set(auth).send({ role: 'marcher' })
  assert.equal(full.body.code, 'cannot_mint')
  const locked = await request(app).post('/api/units/mint').set(auth).send({ role: 'float' })
  assert.match(locked.body.error, /nivel 20/)

  await request(app).post('/api/units/deploy').set(auth).send({ unitIds: minted.map(m => m.id), causeId: cause.id }).expect(200)
  const scene = (await request(app).get(`/api/protests/${cause.id}/scene`)).body
  assert.equal(scene.stats.uniquePeople, 1)
  assert.equal(scene.stats.totalSteps, 3000)
  assert.equal(scene.stats.deployedUnits, 3)
  assert.equal(scene.units.length, 3)
  assert.equal(scene.units[0].owner.email, undefined)
})

test('no se pueden desplegar unidades ajenas ni equipar cosméticos no poseídos', async () => {
  const { app, ctx } = setup()
  const a = await createUser(app, ctx)
  const b = await createUser(app, ctx)
  const cause = await createCause(app, a.token)
  const unit = (await request(app).post('/api/units/mint').set({ Authorization: `Bearer ${a.token}` }).send({ role: 'marcher' })).body
  await request(app).post('/api/units/deploy').set({ Authorization: `Bearer ${b.token}` }).send({ unitIds: [unit.id], causeId: cause.id }).expect(400)
  const neon = await request(app).put(`/api/units/${unit.id}/loadout`).set({ Authorization: `Bearer ${a.token}` }).send({ placardStyle: 'placard_neon' })
  assert.equal(neon.body.code, 'not_owned')
  ctx.db.prepare(`INSERT INTO entitlements (user_id, item_id, source) VALUES (?, 'placard_neon', 'purchase')`).run(a.id)
  await request(app).put(`/api/units/${unit.id}/loadout`).set({ Authorization: `Bearer ${a.token}` }).send({ placardStyle: 'placard_neon' }).expect(200)
})

test('los usuarios de más nivel pueden llenar la avenida sin alterar las cifras', async () => {
  const { app, ctx } = setup()
  const veteran = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${veteran.token}` }
  const cause = await createCause(app, veteran.token)
  await request(app).post(`/api/causes/${cause.id}/join`).set(auth)
  for (let i = 60; i >= 0; i--) ctx.ledger.recordDailyTotal(veteran.id, 'garmin', addDays(isoDate(), -Math.min(i, 29)), 15000 + i)
  const me = (await request(app).get('/api/auth/me').set(auth)).body
  const ids = []
  for (let i = 0; i < me.capacity; i++) ids.push((await request(app).post('/api/units/mint').set(auth).send({ role: 'marcher' })).body.id)
  await request(app).post('/api/units/deploy').set(auth).send({ unitIds: ids, causeId: cause.id }).expect(200)
  const scene = (await request(app).get(`/api/protests/${cause.id}/scene`)).body
  assert.equal(scene.stats.uniquePeople, 1)
  assert.ok(scene.stats.deployedUnits > 3)
  assert.ok(scene.stats.figures >= scene.stats.deployedUnits)
})

test('pancartas: moderación, votos y ocultación por denuncias', async () => {
  const { app, ctx } = setup()
  const a = await createUser(app, ctx)
  const cause = await createCause(app, a.token)
  const auth = { Authorization: `Bearer ${a.token}` }
  assert.equal((await request(app).post('/api/placards').set(auth).send({ causeId: cause.id, text: 'mira www.spam.com' })).body.code, 'invalid_placard')
  assert.equal((await request(app).post('/api/placards').set(auth).send({ causeId: cause.id, text: 'Hola', style: 'placard_neon' })).body.code, 'not_owned')
  const { id } = (await request(app).post('/api/placards').set(auth).send({ causeId: cause.id, text: 'Ni un paso atrás' }).expect(201)).body
  assert.equal((await request(app).post(`/api/placards/${id}/vote`).set(auth)).body.voted, true)
  for (let i = 0; i < 5; i++) {
    const r = await createUser(app, ctx)
    await request(app).post(`/api/placards/${id}/report`).set({ Authorization: `Bearer ${r.token}` }).expect(202)
  }
  assert.equal((await request(app).get(`/api/placards/cause/${cause.id}`)).body.length, 0)
})

test('tienda: catálogo sin pagos configurados y borrado de cuenta', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${u.token}` }
  const shop = (await request(app).get('/api/shop').set(auth)).body
  assert.equal(shop.paymentsEnabled, false)
  assert.ok(shop.items.find(i => i.id === 'placard_carton').owned)
  assert.equal((await request(app).post('/api/shop/checkout').set(auth).send({ itemId: 'placard_neon' })).status, 503)
  await request(app).delete('/api/users/me').set(auth).send({ password: 'mala', confirm: 'BORRAR' }).expect(401)
  await request(app).delete('/api/users/me').set(auth).send({ password: u.password, confirm: 'BORRAR' }).expect(204)
  await request(app).get('/api/auth/me').set(auth).expect(401)
})
