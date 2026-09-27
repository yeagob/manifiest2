import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getProfile, setPattern } from '../users/profile.js'
import { badRequest } from '../lib/errors.js'

export function stepRoutes(ctx) {
  const router = express.Router()
  router.use(requireAuth(ctx))

  router.get('/summary', (req, res) => {
    const days = ctx.db.prepare('SELECT date, credited_steps AS steps, xp FROM daily_credit WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(req.userId)
    const sources = ctx.db.prepare('SELECT source, date, steps FROM source_daily WHERE user_id = ? ORDER BY date DESC LIMIT 90').all(req.userId)
    const allocations = ctx.db.prepare(`SELECT a.cause_id AS causeId, c.title, c.icon, c.color, a.steps FROM allocations a
      JOIN causes c ON c.id = a.cause_id WHERE a.user_id = ? ORDER BY a.steps DESC`).all(req.userId)
    res.json({ days, sources, allocations })
  })

  router.put('/pattern', ctx.limits.write,
    validate(z.object({ pattern: z.array(z.string().min(1).max(64)).max(20) })),
    (req, res) => {
      const problem = setPattern(ctx.db, req.userId, req.valid.body.pattern)
      if (problem) throw badRequest(problem, 'invalid_pattern')
      res.json(getProfile(ctx.db, req.userId))
    })

  router.post('/reserve/allocate', ctx.limits.write, (req, res) => {
    const result = ctx.ledger.allocateReserve(req.userId)
    res.json({ ...result, profile: getProfile(ctx.db, req.userId) })
  })

  return router
}
