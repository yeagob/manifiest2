import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import request from 'supertest'
import { isoDate } from '../src/lib/time.js'
import { setup, createUser } from './helpers.js'

function keyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('base64')
  return { raw, sign: body => crypto.sign(null, Buffer.from(body), privateKey).toString('base64') }
}

async function pair(app, token) {
  const { body } = await request(app).post('/api/devices/pairing-code').set('Authorization', `Bearer ${token}`).expect(201)
  const keys = keyPair()
  const res = await request(app).post('/api/devices/pair').send({ code: body.code, publicKey: keys.raw, name: 'iPhone', platform: 'ios' }).expect(201)
  return { deviceId: res.body.deviceId, keys, code: body.code }
}

function payload(deviceId, days, extra = {}) {
  return JSON.stringify({ deviceId, timestamp: Date.now(), nonce: crypto.randomBytes(16).toString('base64url'), days, ...extra })
}

test('emparejamiento y envío firmado desde el móvil (Apple Watch / Wear OS)', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const { deviceId, keys, code } = await pair(app, u.token)
  await request(app).post('/api/devices/pair').send({ code, publicKey: keyPair().raw, name: 'Otro', platform: 'ios' }).expect(400)

  const body = payload(deviceId, [{ date: isoDate(), steps: 6400 }])
  const ok = await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', keys.sign(body)).send(body).expect(200)
  assert.equal(ok.body.credited, 6400)
  const replay = await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', keys.sign(body)).send(body)
  assert.equal(replay.body.code, 'replay')
})

test('firma inválida, cuerpo alterado o marca temporal vieja se rechazan', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const { deviceId, keys } = await pair(app, u.token)
  const body = payload(deviceId, [{ date: isoDate(), steps: 100 }])
  const tampered = body.replace('"steps":100', '"steps":99999')
  const r1 = await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', keys.sign(body)).send(tampered)
  assert.equal(r1.body.code, 'invalid_signature')
  const other = keyPair()
  const r2 = await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', other.sign(body)).send(body)
  assert.equal(r2.body.code, 'invalid_signature')
  const old = payload(deviceId, [{ date: isoDate(), steps: 100 }], { timestamp: Date.now() - 3600_000 })
  const r3 = await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', keys.sign(old)).send(old)
  assert.equal(r3.body.code, 'stale_request')
  assert.equal(ctx.db.prepare('SELECT total_steps FROM users WHERE id = ?').get(u.id).total_steps, 0)
})

test('dispositivo revocado deja de poder enviar', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const { deviceId, keys } = await pair(app, u.token)
  await request(app).delete(`/api/devices/${deviceId}`).set('Authorization', `Bearer ${u.token}`).expect(204)
  const body = payload(deviceId, [{ date: isoDate(), steps: 100 }])
  await request(app).post('/api/devices/ingest').set('Content-Type', 'application/json').set('X-Device-Signature', keys.sign(body)).send(body).expect(401)
})
