import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import { findCosmetic, ownsCosmetic } from '@manifiest/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js'
import { cleanText } from '../lib/text.js'
import { getProfile, setPattern } from '../users/profile.js'

export const CATEGORIES = ['medio-ambiente', 'animales', 'paz', 'derechos-humanos', 'vivienda', 'sanidad', 'educacion', 'igualdad', 'trabajo', 'otra']

const causeInput = z.object({
  title: z.string().trim().min(5).max(80),
  description: z.string().trim().min(20).max(1000),
  demand: z.string().trim().min(10).max(280),
  target: z.string().trim().min(3).max(120),
  category: z.enum(CATEGORIES),
  icon: z.string().trim().min(1).max(8),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  goalPeople: z.number().int().min(10).max(100_000_000).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
}).strict()

export function serializeCause(row) {
  return {
    id: row.id, title: row.title, description: row.description, demand: row.demand, target: row.target,
    category: row.category, icon: row.icon, color: row.color, theme: row.theme, status: row.status,
    goalPeople: row.goal_people, deadline: row.deadline, totalSteps: row.total_steps,
    uniquePeople: row.unique_people ?? 0, deployedUnits: row.deployed_units ?? 0,
    createdAt: row.created_at
  }
}

export const CAUSE_SELECT = `SELECT c.*,
  (SELECT COUNT(*) FROM allocations a WHERE a.cause_id = c.id AND a.steps > 0) AS unique_people,
  (SELECT COUNT(*) FROM units u WHERE u.cause_id = c.id) AS deployed_units
  FROM causes c`

export function causeRoutes(ctx) {
  const router = express.Router()
  const { db } = ctx
  const auth = requireAuth(ctx)

  router.get('/', (req, res) => {
    const rows = db.prepare(`${CAUSE_SELECT} WHERE c.status != 'archived' ORDER BY c.total_steps DESC LIMIT 200`).all()
    res.json(rows.map(serializeCause))
  })

  router.get('/:id', (req, res) => {
    const row = db.prepare(`${CAUSE_SELECT} WHERE c.id = ?`).get(req.params.id)
    if (!row) throw notFound('Causa no encontrada')
    res.json(serializeCause(row))
  })

  router.post('/', auth, ctx.limits.write, validate(causeInput), (req, res) => {
    const input = req.valid.body
    const title = cleanText(input.title)
    if (db.prepare('SELECT 1 FROM causes WHERE lower(title) = lower(?)').get(title)) throw conflict('Ya existe una causa con ese título: súmate a ella', 'duplicate_cause')
    const recent = db.prepare(`SELECT COUNT(*) AS n FROM causes WHERE created_by = ? AND created_at > datetime('now', '-1 day')`).get(req.userId).n
    if (recent >= 3) throw badRequest('Puedes crear como máximo 3 causas al día', 'cause_limit')
    const id = crypto.randomUUID()
    db.prepare(`INSERT INTO causes (id, title, description, demand, target, category, icon, color, goal_people, deadline, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, title, cleanText(input.description), cleanText(input.demand), cleanText(input.target), input.category,
        input.icon, input.color, input.goalPeople ?? null, input.deadline ?? null, req.userId)
    res.status(201).json(serializeCause(db.prepare(`${CAUSE_SELECT} WHERE c.id = ?`).get(id)))
  })

  router.patch('/:id', auth, ctx.limits.write,
    validate(z.object({
      status: z.enum(['active', 'delivered', 'won', 'lost', 'archived']).optional(),
      theme: z.string().max(40).optional(),
      description: z.string().trim().min(20).max(1000).optional()
    }).strict()),
    (req, res) => {
      const cause = db.prepare('SELECT * FROM causes WHERE id = ?').get(req.params.id)
      if (!cause) throw notFound('Causa no encontrada')
      if (cause.created_by !== req.userId && req.userRole !== 'admin') throw forbidden()
      const { status, theme, description } = req.valid.body
      if (theme) {
        const item = findCosmetic(theme)
        const profile = getProfile(db, req.userId)
        const owned = db.prepare('SELECT item_id FROM entitlements WHERE user_id = ?').all(req.userId).map(r => r.item_id)
        if (item?.kind !== 'avenueTheme' || !ownsCosmetic(item, profile.progress.level, owned)) throw forbidden('No tienes ese tema de avenida', 'not_owned')
      }
      db.prepare('UPDATE causes SET status = COALESCE(?, status), theme = COALESCE(?, theme), description = COALESCE(?, description) WHERE id = ?')
        .run(status ?? null, theme ?? null, description ? cleanText(description) : null, cause.id)
      res.json(serializeCause(db.prepare(`${CAUSE_SELECT} WHERE c.id = ?`).get(cause.id)))
    })

  router.post('/:id/join', auth, ctx.limits.write, (req, res) => {
    const cause = db.prepare(`SELECT id FROM causes WHERE id = ? AND status = 'active'`).get(req.params.id)
    if (!cause) throw notFound('Causa no encontrada o cerrada')
    const profile = getProfile(db, req.userId)
    if (!profile.pattern.includes(cause.id)) {
      const problem = setPattern(db, req.userId, [...profile.pattern, cause.id])
      if (problem) throw badRequest(problem, 'invalid_pattern')
    }
    res.json(getProfile(db, req.userId))
  })

  return router
}
