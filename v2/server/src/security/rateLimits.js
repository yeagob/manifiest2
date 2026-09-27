import rateLimit from 'express-rate-limit'

const make = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: message, code: 'rate_limited' }
})

export function createRateLimits(config) {
  const factor = config.env === 'test' ? 1000 : 1
  return {
    global: make(60_000, 300 * factor, 'Demasiadas peticiones'),
    auth: make(15 * 60_000, 20 * factor, 'Demasiados intentos, espera unos minutos'),
    refresh: make(15 * 60_000, 120 * factor, 'Demasiadas renovaciones de sesión'),
    email: make(60 * 60_000, 6 * factor, 'Demasiados emails solicitados, espera una hora'),
    ingest: make(60_000, 30 * factor, 'Demasiadas sincronizaciones'),
    write: make(60_000, 40 * factor, 'Vas demasiado rápido')
  }
}
