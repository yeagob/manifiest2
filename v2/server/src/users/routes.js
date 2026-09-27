import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { verifyPassword } from '../security/passwords.js'
import { unauthorized } from '../lib/errors.js'
import { audit } from '../lib/audit.js'
import { getProfile } from './profile.js'

export function userRoutes(ctx) {
  const router = express.Router()
  const { db } = ctx
  router.use(requireAuth(ctx))

  router.patch('/me', ctx.limits.write,
    validate(z.object({ displayName: z.string().trim().min(2).max(40).regex(/^[\p{L}\p{N} ._'-]+$/u) }).strict()),
    (req, res) => {
      db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(req.valid.body.displayName, req.userId)
      res.json(getProfile(db, req.userId))
    })

  router.get('/me/export', ctx.limits.write, (req, res) => {
    const user = db.prepare('SELECT id, email, display_name, created_at, xp, level, active_days, total_steps, pattern_json FROM users WHERE id = ?').get(req.userId)
    res.set('Content-Disposition', 'attachment; filename="manifiest-datos.json"')
    res.json({
      user,
      daily: db.prepare('SELECT date, credited_steps, xp FROM daily_credit WHERE user_id = ?').all(req.userId),
      sources: db.prepare('SELECT source, date, steps FROM source_daily WHERE user_id = ?').all(req.userId),
      ledger: db.prepare('SELECT date, source, delta, allocation_json, created_at FROM step_ledger WHERE user_id = ?').all(req.userId),
      allocations: db.prepare('SELECT cause_id, steps FROM allocations WHERE user_id = ?').all(req.userId),
      units: db.prepare('SELECT serial, role, rarity, name, cause_id, created_at FROM units WHERE user_id = ?').all(req.userId),
      placards: db.prepare('SELECT cause_id, text, created_at FROM placards WHERE user_id = ?').all(req.userId),
      connections: db.prepare('SELECT provider, status, created_at FROM connections WHERE user_id = ?').all(req.userId),
      devices: db.prepare('SELECT name, platform, created_at FROM devices WHERE user_id = ?').all(req.userId)
    })
  })

  router.delete('/me', ctx.limits.auth, validate(z.object({ password: z.string().max(128).optional(), confirm: z.literal('BORRAR') }).strict()), async (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId)
    if (user.password_hash && !(await verifyPassword(req.valid.body.password || '', user.password_hash))) throw unauthorized('Contraseña incorrecta', 'invalid_credentials')
    db.transaction(() => {
      const allocations = db.prepare('SELECT cause_id, steps FROM allocations WHERE user_id = ?').all(req.userId)
      for (const a of allocations) db.prepare('UPDATE causes SET total_steps = total_steps - ? WHERE id = ?').run(a.steps, a.cause_id)
      const ghost = `deleted-${req.userId}`
      db.prepare(`UPDATE users SET email = ?, password_hash = NULL, google_sub = NULL, display_name = 'Cuenta eliminada', disabled_at = datetime('now') WHERE id = ?`).run(`${ghost}@invalid`, req.userId)
      for (const table of ['allocations', 'units', 'placards', 'connections', 'devices', 'refresh_tokens', 'source_daily', 'daily_credit', 'step_ledger', 'email_codes', 'entitlements']) {
        db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(req.userId)
      }
    })()
    audit(db, { userId: req.userId, action: 'user.deleted', ip: req.ip })
    res.clearCookie('mf_rt', { path: '/api/auth' })
    res.status(204).end()
  })

  return router
}
