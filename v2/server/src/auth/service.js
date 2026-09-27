import crypto from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { hashPassword, verifyPassword, burnPasswordTime, passwordProblem } from '../security/passwords.js'
import { randomToken, sha256, randomCode, safeEqual, signAccessToken, REFRESH_TOKEN_TTL_MS, ACCESS_TOKEN_TTL_SECONDS } from '../security/tokens.js'
import { badRequest, unauthorized, forbidden } from '../lib/errors.js'
import { templates } from '../lib/mailer.js'
import { audit } from '../lib/audit.js'
import { nowIso, inMs, isPast } from '../lib/time.js'

const CODE_TTL_MS = 15 * 60 * 1000
const MAX_CODE_ATTEMPTS = 5
const MAX_FAILED_LOGINS = 8
const LOCK_MS = 15 * 60 * 1000

export function createAuthService(ctx) {
  const { db, config, mailer } = ctx
  const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null
  const codeHash = (userId, code) => crypto.createHmac('sha256', config.jwtSecret).update(`${userId}:${code}`).digest('hex')
  const findByEmail = email => db.prepare('SELECT * FROM users WHERE email = ?').get(email)

  async function issueCode(user, purpose) {
    const code = randomCode(6)
    db.transaction(() => {
      db.prepare('UPDATE email_codes SET consumed_at = ? WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL').run(nowIso(), user.id, purpose)
      db.prepare('INSERT INTO email_codes (id, user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), user.id, purpose, codeHash(user.id, code), inMs(CODE_TTL_MS))
    })()
    const template = purpose === 'verify' ? templates.verify(code) : templates.reset(code)
    await mailer.send({ to: user.email, ...template })
  }

  function consumeCode(user, purpose, code) {
    const row = db.prepare('SELECT * FROM email_codes WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1').get(user.id, purpose)
    if (!row || isPast(row.expires_at) || row.attempts >= MAX_CODE_ATTEMPTS) throw badRequest('Código inválido o caducado', 'invalid_code')
    if (!safeEqual(row.code_hash, codeHash(user.id, code))) {
      db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id)
      throw badRequest('Código inválido o caducado', 'invalid_code')
    }
    db.prepare('UPDATE email_codes SET consumed_at = ? WHERE id = ?').run(nowIso(), row.id)
  }

  function createSession(user, userAgent, familyId = crypto.randomUUID()) {
    const refreshToken = randomToken(48)
    const id = crypto.randomUUID()
    db.prepare('INSERT INTO refresh_tokens (id, user_id, family_id, token_hash, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, user.id, familyId, sha256(refreshToken), inMs(REFRESH_TOKEN_TTL_MS), (userAgent || '').slice(0, 200))
    return { id, refreshToken, accessToken: signAccessToken(config.jwtSecret, user), expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  }

  function revokeFamily(familyId) {
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL').run(nowIso(), familyId)
  }

  function revokeAllForUser(userId) {
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(nowIso(), userId)
  }

  return {
    async register({ email, password, displayName }, ip) {
      const problem = passwordProblem(password, email)
      if (problem) throw badRequest(problem, 'weak_password')
      const existing = findByEmail(email)
      if (existing) {
        if (!existing.email_verified_at && existing.password_hash) {
          await issueCode(existing, 'verify')
        } else {
          await mailer.send({ to: existing.email, ...templates.alreadyRegistered(config.webUrl) })
        }
        await burnPasswordTime(password)
        return
      }
      const user = { id: crypto.randomUUID(), email, display_name: displayName }
      const passwordHash = await hashPassword(password)
      db.prepare('INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)').run(user.id, email, passwordHash, displayName)
      audit(db, { userId: user.id, action: 'auth.register', ip })
      await issueCode(user, 'verify')
    },

    async resendVerification(email) {
      const user = findByEmail(email)
      if (user && !user.email_verified_at) await issueCode(user, 'verify')
    },

    verifyEmail({ email, code }, userAgent, ip) {
      const user = findByEmail(email)
      if (!user || user.email_verified_at) throw badRequest('Código inválido o caducado', 'invalid_code')
      consumeCode(user, 'verify', code)
      db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(nowIso(), user.id)
      audit(db, { userId: user.id, action: 'auth.verify_email', ip })
      return createSession(user, userAgent)
    },

    async login({ email, password }, userAgent, ip) {
      const user = findByEmail(email)
      if (!user || !user.password_hash) {
        await burnPasswordTime(password)
        throw unauthorized('Email o contraseña incorrectos', 'invalid_credentials')
      }
      if (user.locked_until && !isPast(user.locked_until)) {
        throw forbidden('Cuenta bloqueada temporalmente por intentos fallidos', 'locked')
      }
      if (!(await verifyPassword(password, user.password_hash))) {
        const failed = user.failed_logins + 1
        const lock = failed >= MAX_FAILED_LOGINS ? inMs(LOCK_MS) : null
        db.prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?').run(lock ? 0 : failed, lock, user.id)
        audit(db, { userId: user.id, action: lock ? 'auth.locked' : 'auth.login_failed', ip })
        throw unauthorized('Email o contraseña incorrectos', 'invalid_credentials')
      }
      if (user.disabled_at) throw forbidden('Cuenta desactivada', 'disabled')
      if (!user.email_verified_at) {
        await issueCode(user, 'verify')
        throw forbidden('Verifica tu email: te hemos enviado un código nuevo', 'email_unverified')
      }
      db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').run(user.id)
      audit(db, { userId: user.id, action: 'auth.login', ip })
      return createSession(user, userAgent)
    },

    async loginWithGoogle(idToken, userAgent, ip) {
      if (!googleClient) throw badRequest('Acceso con Google no configurado', 'google_disabled')
      let payload
      try {
        const ticket = await googleClient.verifyIdToken({ idToken, audience: config.googleClientId })
        payload = ticket.getPayload()
      } catch {
        throw unauthorized('Token de Google inválido', 'invalid_google_token')
      }
      if (!payload?.email || !payload.email_verified) throw unauthorized('Google no ha verificado este email', 'invalid_google_token')
      let user = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(payload.sub) || findByEmail(payload.email)
      if (!user) {
        user = { id: crypto.randomUUID(), role: 'user' }
        db.prepare('INSERT INTO users (id, email, google_sub, display_name, email_verified_at) VALUES (?, ?, ?, ?, ?)')
          .run(user.id, payload.email.toLowerCase(), payload.sub, (payload.name || payload.email.split('@')[0]).slice(0, 40), nowIso())
        audit(db, { userId: user.id, action: 'auth.register_google', ip })
      } else {
        if (user.disabled_at) throw forbidden('Cuenta desactivada', 'disabled')
        db.prepare('UPDATE users SET google_sub = COALESCE(google_sub, ?), email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?')
          .run(payload.sub, nowIso(), user.id)
      }
      audit(db, { userId: user.id, action: 'auth.login_google', ip })
      return createSession(db.prepare('SELECT * FROM users WHERE id = ?').get(user.id), userAgent)
    },

    rotate(refreshToken, userAgent, ip) {
      if (!refreshToken) throw unauthorized('Sin sesión', 'no_session')
      const row = db.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(sha256(refreshToken))
      if (!row) throw unauthorized('Sesión inválida', 'invalid_session')
      if (row.revoked_at) {
        revokeFamily(row.family_id)
        audit(db, { userId: row.user_id, action: 'auth.refresh_reuse_detected', meta: { family: row.family_id }, ip })
        throw unauthorized('Sesión revocada', 'session_reuse')
      }
      if (isPast(row.expires_at)) throw unauthorized('Sesión caducada', 'session_expired')
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id)
      if (!user || user.disabled_at) throw unauthorized('Cuenta no disponible', 'disabled')
      return db.transaction(() => {
        const session = createSession(user, userAgent, row.family_id)
        db.prepare('UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ? WHERE id = ?').run(nowIso(), session.id, row.id)
        return session
      })()
    },

    logout(refreshToken) {
      if (!refreshToken) return
      const row = db.prepare('SELECT family_id FROM refresh_tokens WHERE token_hash = ?').get(sha256(refreshToken))
      if (row) revokeFamily(row.family_id)
    },

    logoutEverywhere(userId) {
      revokeAllForUser(userId)
    },

    async forgotPassword(email) {
      const user = findByEmail(email)
      if (user && user.email_verified_at && !user.disabled_at) await issueCode(user, 'reset')
    },

    async resetPassword({ email, code, password }, ip) {
      const user = findByEmail(email)
      if (!user) throw badRequest('Código inválido o caducado', 'invalid_code')
      const problem = passwordProblem(password, email)
      if (problem) throw badRequest(problem, 'weak_password')
      consumeCode(user, 'reset', code)
      const hash = await hashPassword(password)
      db.transaction(() => {
        db.prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?').run(hash, user.id)
        revokeAllForUser(user.id)
      })()
      audit(db, { userId: user.id, action: 'auth.password_reset', ip })
      await mailer.send({ to: user.email, ...templates.passwordChanged() })
    },

    async changePassword(userId, { currentPassword, newPassword }, ip) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      if (!user.password_hash || !(await verifyPassword(currentPassword, user.password_hash))) {
        throw unauthorized('Contraseña actual incorrecta', 'invalid_credentials')
      }
      const problem = passwordProblem(newPassword, user.email)
      if (problem) throw badRequest(problem, 'weak_password')
      const hash = await hashPassword(newPassword)
      db.transaction(() => {
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId)
        revokeAllForUser(userId)
      })()
      audit(db, { userId, action: 'auth.password_changed', ip })
      await mailer.send({ to: user.email, ...templates.passwordChanged() })
    }
  }
}
