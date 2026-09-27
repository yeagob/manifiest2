import crypto from 'node:crypto'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_PATH: z.string().default('./data/manifiest.db'),
  API_URL: z.string().url().default('http://localhost:4000'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Manifiest <no-reply@manifiest.app>'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  FITBIT_CLIENT_ID: z.string().optional(),
  FITBIT_CLIENT_SECRET: z.string().optional(),
  FITBIT_SUBSCRIBER_VERIFY: z.string().optional(),
  WITHINGS_CLIENT_ID: z.string().optional(),
  WITHINGS_CLIENT_SECRET: z.string().optional(),
  GARMIN_CLIENT_ID: z.string().optional(),
  GARMIN_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional()
})

function emptyToUndefined(env) {
  return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v === '' ? undefined : v]))
}

export function loadConfig(env = process.env) {
  const parsed = schema.parse(emptyToUndefined(env))
  const isProd = parsed.NODE_ENV === 'production'

  if (isProd) {
    const missing = ['JWT_SECRET', 'TOKEN_ENCRYPTION_KEY', 'SMTP_URL'].filter(k => !parsed[k])
    if (missing.length) throw new Error(`Faltan variables obligatorias en producción: ${missing.join(', ')}`)
  }

  const jwtSecret = parsed.JWT_SECRET ?? crypto.randomBytes(48).toString('base64')
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres')

  const encryptionKey = parsed.TOKEN_ENCRYPTION_KEY
    ? Buffer.from(parsed.TOKEN_ENCRYPTION_KEY, 'base64')
    : crypto.randomBytes(32)
  if (encryptionKey.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY debe ser 32 bytes en base64')

  if (!isProd && (!parsed.JWT_SECRET || !parsed.TOKEN_ENCRYPTION_KEY) && parsed.NODE_ENV !== 'test') {
    console.warn('[config] Usando secretos efímeros: las sesiones y tokens OAuth no sobrevivirán a un reinicio.')
  }

  return {
    env: parsed.NODE_ENV,
    isProd,
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
    apiUrl: parsed.API_URL.replace(/\/$/, ''),
    webUrl: parsed.WEB_URL.replace(/\/$/, ''),
    corsOrigins: parsed.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
    jwtSecret,
    encryptionKey,
    smtpUrl: parsed.SMTP_URL,
    mailFrom: parsed.MAIL_FROM,
    googleClientId: parsed.GOOGLE_CLIENT_ID,
    providers: {
      fitbit: { clientId: parsed.FITBIT_CLIENT_ID, clientSecret: parsed.FITBIT_CLIENT_SECRET, subscriberVerify: parsed.FITBIT_SUBSCRIBER_VERIFY },
      withings: { clientId: parsed.WITHINGS_CLIENT_ID, clientSecret: parsed.WITHINGS_CLIENT_SECRET },
      garmin: { clientId: parsed.GARMIN_CLIENT_ID, clientSecret: parsed.GARMIN_CLIENT_SECRET }
    },
    stripe: { secretKey: parsed.STRIPE_SECRET_KEY, webhookSecret: parsed.STRIPE_WEBHOOK_SECRET }
  }
}
