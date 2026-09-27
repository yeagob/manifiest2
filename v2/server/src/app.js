import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { openDatabase } from './db/index.js'
import { createCipher } from './security/encryption.js'
import { createRateLimits } from './security/rateLimits.js'
import { createMailer } from './lib/mailer.js'
import { createLedger } from './steps/ledger.js'
import { createProviders } from './providers/index.js'
import { authRoutes } from './auth/routes.js'
import { userRoutes } from './users/routes.js'
import { stepRoutes } from './steps/routes.js'
import { connectionRoutes, webhookRoutes } from './providers/routes.js'
import { deviceRoutes } from './devices/routes.js'
import { causeRoutes } from './causes/routes.js'
import { unitRoutes } from './units/routes.js'
import { placardRoutes } from './placards/routes.js'
import { protestRoutes } from './protests/routes.js'
import { shopRoutes, stripeWebhook } from './shop/routes.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'

export function createContext(config, overrides = {}) {
  const events = new EventEmitter()
  events.setMaxListeners(0)
  const ctx = {
    config,
    db: overrides.db ?? openDatabase(config.databasePath),
    cipher: createCipher(config.encryptionKey),
    mailer: overrides.mailer ?? createMailer(config),
    limits: createRateLimits(config),
    events,
    fetch: overrides.fetch ?? globalThis.fetch,
    stripe: overrides.stripe
  }
  ctx.ledger = createLedger(ctx)
  ctx.providers = createProviders(ctx)
  return ctx
}

export function createApp(ctx) {
  const { config } = ctx
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.isProd ? 1 : false)

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://accounts.google.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://accounts.google.com'],
        frameSrc: ['https://accounts.google.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: config.isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false
  }))
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Signature'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }))

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api', ctx.limits.global)
  app.use('/api/webhooks/stripe', stripeWebhook(ctx))
  app.use('/api/webhooks', webhookRoutes(ctx))
  app.use('/api/devices', deviceRoutes(ctx))

  app.use(express.json({ limit: '64kb' }))
  app.use(cookieParser())

  app.use('/api/auth', authRoutes(ctx))
  app.use('/api/users', userRoutes(ctx))
  app.use('/api/steps', stepRoutes(ctx))
  app.use('/api/connections', connectionRoutes(ctx))
  app.use('/api/causes', causeRoutes(ctx))
  app.use('/api/units', unitRoutes(ctx))
  app.use('/api/placards', placardRoutes(ctx))
  app.use('/api/protests', protestRoutes(ctx))
  app.use('/api/shop', shopRoutes(ctx))
  app.use('/api', notFoundHandler)

  const webDist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../web/dist')
  if (config.isProd && fs.existsSync(webDist)) {
    app.use(express.static(webDist, { index: false, maxAge: '1h' }))
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')))
  }

  app.use(errorHandler(ctx))
  return app
}
