import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { setup, H, lastCode, createUser } from './helpers.js'

test('registro, verificación, login y /me', async () => {
  const { app, ctx } = setup()
  const email = 'ana@test.dev'
  await request(app).post('/api/auth/register').set(H).send({ email, password: 'corta', displayName: 'Ana' }).expect(400)
  await request(app).post('/api/auth/register').set(H).send({ email, password: 'marcha-larga-2026', displayName: 'Ana' }).expect(202)
  const login = await request(app).post('/api/auth/login').set(H).send({ email, password: 'marcha-larga-2026' })
  assert.equal(login.status, 403)
  assert.equal(login.body.code, 'email_unverified')
  await request(app).post('/api/auth/verify-email').set(H).send({ email, code: '000000' }).expect(400)
  const verified = await request(app).post('/api/auth/verify-email').set(H).send({ email, code: lastCode(ctx, email) }).expect(201)
  assert.ok(verified.body.accessToken)
  const cookie = verified.headers['set-cookie'][0]
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Strict/)
  assert.match(cookie, /Path=\/api\/auth/)
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${verified.body.accessToken}`).expect(200)
  assert.equal(me.body.email, email)
  assert.equal(me.body.capacity, 3)
  assert.equal(me.body.password_hash, undefined)
})

test('sin cabecera anti-CSRF se rechaza', async () => {
  const { app } = setup()
  await request(app).post('/api/auth/login').send({ email: 'a@b.dev', password: 'x' }).expect(403)
})

test('registro con email existente no revela la cuenta', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx, 'dup@test.dev')
  const res = await request(app).post('/api/auth/register').set(H).send({ email: u.email, password: 'otra-clave-segura-1', displayName: 'Xavi' })
  assert.equal(res.status, 202)
  assert.match(ctx.mailer.outbox.at(-1).subject, /Ya tienes una cuenta/)
})

test('rotación de refresh token y detección de reutilización', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  const first = u.cookie[0].split(';')[0]
  const r1 = await request(app).post('/api/auth/refresh').set(H).set('Cookie', first).expect(200)
  const second = r1.headers['set-cookie'][0].split(';')[0]
  assert.notEqual(first, second)
  await request(app).post('/api/auth/refresh').set(H).set('Cookie', first).expect(401)
  const reused = await request(app).post('/api/auth/refresh').set(H).set('Cookie', second)
  assert.equal(reused.status, 401)
  assert.equal(reused.body.code, 'session_reuse')
})

test('contraseña incorrecta bloquea tras varios intentos', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  for (let i = 0; i < 8; i++) await request(app).post('/api/auth/login').set(H).send({ email: u.email, password: 'mala-clave-xx' }).expect(401)
  const locked = await request(app).post('/api/auth/login').set(H).send({ email: u.email, password: u.password })
  assert.equal(locked.body.code, 'locked')
})

test('recuperación de contraseña revoca sesiones', async () => {
  const { app, ctx } = setup()
  const u = await createUser(app, ctx)
  await request(app).post('/api/auth/password/forgot').set(H).send({ email: u.email }).expect(202)
  const code = lastCode(ctx, u.email)
  await request(app).post('/api/auth/password/reset').set(H).send({ email: u.email, code, password: 'nueva-clave-segura-9' }).expect(204)
  await request(app).post('/api/auth/refresh').set(H).set('Cookie', u.cookie[0].split(';')[0]).expect(401)
  await request(app).post('/api/auth/login').set(H).send({ email: u.email, password: 'nueva-clave-segura-9' }).expect(200)
  await request(app).post('/api/auth/password/reset').set(H).send({ email: u.email, code, password: 'otra-mas-segura-77' }).expect(400)
})

test('token manipulado o ausente no autentica', async () => {
  const { app } = setup()
  await request(app).get('/api/auth/me').expect(401)
  await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi').expect(401)
})
