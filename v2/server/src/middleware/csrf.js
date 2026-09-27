import { forbidden } from '../lib/errors.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function requireCsrfHeader(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next()
  if (req.get('x-requested-with') !== 'manifiest') return next(forbidden('Petición no permitida', 'csrf'))
  next()
}
