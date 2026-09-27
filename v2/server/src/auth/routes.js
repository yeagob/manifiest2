import express from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrfHeader } from '../middleware/csrf.js'
import { createAuthService } from './service.js'
import { getProfile } from '../users/profile.js'
import { REFRESH_TOKEN_TTL_MS } from '../security/tokens.js'
import { PASSWORD_MAX } from '../security/passwords.js'

const REFRESH_COOKIE = 'mf_rt'
const email = z.string().trim().toLowerCase().email().max(254)
const password = z.string().min(1).max(PASSWORD_MAX)
const code = z.string().regex(/^\d{6}$/, 'debe tener 6 dígitos')
const displayName = z.string().trim().min(2).max(40).regex(/^[\p{L}\p{N} ._'-]+$/u, 'contiene caracteres no permitidos')

export function authRoutes(ctx) {
  const router = express.Router()
  const service = createAuthService(ctx)
  const auth = requireAuth(ctx)
  const { limits } = ctx

  const cookieOptions = {
    httpOnly: true,
    secure: ctx.config.isProd,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS
  }

  function sendSession(res, session, status = 200) {
    res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions)
    res.status(status).json({ accessToken: session.accessToken, expiresIn: session.expiresIn })
  }

  router.use(requireCsrfHeader)

  router.post('/register', limits.auth, limits.email,
    validate(z.object({ email, password, displayName })),
    async (req, res) => {
      await service.register(req.valid.body, req.ip)
      res.status(202).json({ message: 'Si el email es válido recibirás un código de verificación.' })
    })

  router.post('/verify-email', limits.auth, validate(z.object({ email, code })), (req, res) => {
    sendSession(res, service.verifyEmail(req.valid.body, req.get('user-agent'), req.ip), 201)
  })

  router.post('/resend-code', limits.email, validate(z.object({ email })), async (req, res) => {
    await service.resendVerification(req.valid.body.email)
    res.status(202).json({ message: 'Si hay una verificación pendiente, recibirás un código nuevo.' })
  })

  router.post('/login', limits.auth, validate(z.object({ email, password })), async (req, res) => {
    sendSession(res, await service.login(req.valid.body, req.get('user-agent'), req.ip))
  })

  router.post('/google', limits.auth, validate(z.object({ idToken: z.string().min(10).max(4096) })), async (req, res) => {
    sendSession(res, await service.loginWithGoogle(req.valid.body.idToken, req.get('user-agent'), req.ip))
  })

  router.post('/refresh', limits.refresh, (req, res) => {
    try {
      sendSession(res, service.rotate(req.cookies[REFRESH_COOKIE], req.get('user-agent'), req.ip))
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined })
      throw err
    }
  })

  router.post('/logout', (req, res) => {
    service.logout(req.cookies[REFRESH_COOKIE])
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined })
    res.status(204).end()
  })

  router.post('/logout-all', auth, (req, res) => {
    service.logoutEverywhere(req.userId)
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined })
    res.status(204).end()
  })

  router.post('/password/forgot', limits.email, validate(z.object({ email })), async (req, res) => {
    await service.forgotPassword(req.valid.body.email)
    res.status(202).json({ message: 'Si la cuenta existe, recibirás un código para cambiar la contraseña.' })
  })

  router.post('/password/reset', limits.auth, validate(z.object({ email, code, password })), async (req, res) => {
    await service.resetPassword(req.valid.body, req.ip)
    res.status(204).end()
  })

  router.post('/password/change', auth, limits.auth,
    validate(z.object({ currentPassword: password, newPassword: password })),
    async (req, res) => {
      await service.changePassword(req.userId, req.valid.body, req.ip)
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined })
      res.status(204).end()
    })

  router.get('/me', auth, (req, res) => {
    res.json(getProfile(ctx.db, req.userId))
  })

  return router
}
