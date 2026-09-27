import { verifyAccessToken } from '../security/tokens.js'
import { unauthorized, forbidden } from '../lib/errors.js'

export function requireAuth(ctx) {
  return (req, _res, next) => {
    const header = req.get('authorization') || ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) return next(unauthorized())
    try {
      const claims = verifyAccessToken(ctx.config.jwtSecret, token)
      const user = ctx.db.prepare('SELECT id, role, disabled_at, email_verified_at FROM users WHERE id = ?').get(claims.sub)
      if (!user || user.disabled_at) return next(unauthorized('Cuenta no disponible'))
      if (!user.email_verified_at) return next(forbidden('Verifica tu email', 'email_unverified'))
      req.userId = user.id
      req.userRole = user.role
      next()
    } catch {
      next(unauthorized('Sesión caducada', 'token_expired'))
    }
  }
}

export function requireRole(role) {
  return (req, _res, next) => (req.userRole === role ? next() : next(forbidden()))
}
