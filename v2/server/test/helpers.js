import request from 'supertest'
import { loadConfig } from '../src/config.js'
import { createApp, createContext } from '../src/app.js'
import { openDatabase } from '../src/db/index.js'

export function setup(env = {}, overrides = {}) {
  const config = loadConfig({ NODE_ENV: 'test', DATABASE_PATH: ':memory:', ...env })
  const ctx = createContext(config, { db: openDatabase(':memory:'), ...overrides })
  const app = createApp(ctx)
  return { ctx, app, config }
}

export const H = { 'X-Requested-With': 'manifiest' }

export function lastCode(ctx, to) {
  const mail = [...ctx.mailer.outbox].reverse().find(m => m.to === to)
  return mail?.text.match(/\b(\d{6})\b/)?.[1]
}

export async function createUser(app, ctx, email = `u${Math.random().toString(36).slice(2, 8)}@test.dev`, password = 'marcha-larga-2026') {
  await request(app).post('/api/auth/register').set(H).send({ email, password, displayName: 'Tester' }).expect(202)
  const res = await request(app).post('/api/auth/verify-email').set(H).send({ email, code: lastCode(ctx, email) }).expect(201)
  const user = ctx.db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  return { email, password, token: res.body.accessToken, id: user.id, cookie: res.headers['set-cookie'] }
}

export async function createCause(app, token, overrides = {}) {
  const res = await request(app).post('/api/causes').set('Authorization', `Bearer ${token}`).send({
    title: `Causa ${Math.random().toString(36).slice(2, 8)}`,
    description: 'Una descripción suficientemente larga para la causa.',
    demand: 'Pedimos algo muy concreto y medible',
    target: 'Ayuntamiento',
    category: 'medio-ambiente',
    icon: '🌱',
    color: '#00A95C',
    ...overrides
  }).expect(201)
  return res.body
}
