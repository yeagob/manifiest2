import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import request from 'supertest'
import { isoDate } from '../src/lib/time.js'
import { isTrustedGarminCallback } from '../src/providers/garmin.js'
import { setup, createUser } from './helpers.js'

const FITBIT_ENV = { FITBIT_CLIENT_ID: 'cid', FITBIT_CLIENT_SECRET: 'secret', FITBIT_SUBSCRIBER_VERIFY: 'verify-me' }

function fakeFetch(routes) {
  const calls = []
  const impl = async (url, init) => {
    calls.push({ url, init })
    const handler = routes.find(([match]) => url.includes(match))
    if (!handler) return new Response('{}', { status: 404 })
    const [, status, body] = handler
    return new Response(JSON.stringify(typeof body === 'function' ? body(url, init) : body), { status })
  }
  impl.calls = calls
  return impl
}

test('flujo OAuth de Fitbit con PKCE, tokens cifrados y sincronización', async () => {
  const today = isoDate()
  const fetch = fakeFetch([
    ['oauth2/token', 200, { access_token: 'AT', refresh_token: 'RT', expires_in: 28800, user_id: 'FB123', scope: 'activity' }],
    ['apiSubscriptions', 201, {}],
    ['activities/steps/date', 200, { 'activities-steps': [{ dateTime: today, value: '7321' }] }]
  ])
  const { app, ctx } = setup(FITBIT_ENV, { fetch })
  const u = await createUser(app, ctx)
  const auth = { Authorization: `Bearer ${u.token}` }
  const { body } = await request(app).post('/api/connections/fitbit/start').set(auth).expect(200)
  const url = new URL(body.authorizeUrl)
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  const state = url.searchParams.get('state')

  const bad = await request(app).get('/api/connections/fitbit/callback?code=abc&state=forged')
  assert.match(bad.headers.location, /error=link_failed/)

  const cb = await request(app).get(`/api/connections/fitbit/callback?code=abc&state=${state}`).expect(303)
  assert.match(cb.headers.location, /connected=fitbit/)
  const tokenCall = fetch.calls.find(c => c.url.includes('oauth2/token'))
  assert.match(tokenCall.init.body, /code_verifier=/)

  const row = ctx.db.prepare('SELECT * FROM connections WHERE user_id = ?').get(u.id)
  assert.ok(!row.access_token_enc.includes('AT'))
  assert.equal(ctx.cipher.decrypt(row.access_token_enc), 'AT')

  const sync = await request(app).post('/api/connections/fitbit/sync').set(auth).expect(200)
  assert.equal(sync.body.days, 1)
  assert.equal(ctx.db.prepare('SELECT total_steps FROM users WHERE id = ?').get(u.id).total_steps, 7321)

  const replay = await request(app).get(`/api/connections/fitbit/callback?code=abc&state=${state}`)
  assert.match(replay.headers.location, /error=link_failed/)
})

test('webhook de Fitbit: verificación y firma HMAC', async () => {
  const { app } = setup(FITBIT_ENV)
  await request(app).get('/api/webhooks/fitbit?verify=verify-me').expect(204)
  await request(app).get('/api/webhooks/fitbit?verify=wrong').expect(404)
  const body = JSON.stringify([{ collectionType: 'activities', date: isoDate(), ownerId: 'nobody', subscriptionId: 'x' }])
  const sig = crypto.createHmac('sha1', 'secret&').update(body).digest('base64')
  await request(app).post('/api/webhooks/fitbit').set('Content-Type', 'application/json').set('X-Fitbit-Signature', sig).send(body).expect(204)
  await request(app).post('/api/webhooks/fitbit').set('Content-Type', 'application/json').set('X-Fitbit-Signature', 'forged').send(body).expect(404)
})

test('Garmin: solo se siguen callbacks a apis.garmin.com (anti-SSRF)', () => {
  assert.equal(isTrustedGarminCallback('https://apis.garmin.com/wellness-api/rest/dailies?token=1'), true)
  assert.equal(isTrustedGarminCallback('http://apis.garmin.com/x'), false)
  assert.equal(isTrustedGarminCallback('https://apis.garmin.com.evil.io/x'), false)
  assert.equal(isTrustedGarminCallback('https://user@apis.garmin.com/x'), false)
  assert.equal(isTrustedGarminCallback('https://169.254.169.254/latest'), false)
})

test('proveedor no configurado no permite iniciar', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const res = await request(app).post('/api/connections/garmin/start').set('Authorization', `Bearer ${u.token}`)
  assert.equal(res.body.code, 'provider_unavailable')
})
