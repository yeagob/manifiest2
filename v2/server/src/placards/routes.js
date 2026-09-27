import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import { findCosmetic, ownsCosmetic } from '@manifiest/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'
import { cleanText, placardProblem } from '../lib/text.js'
import { getProfile } from '../users/profile.js'

const HIDE_AFTER_REPORTS = 5
const MAX_ACTIVE_PER_CAUSE = 3

export function placardRoutes(ctx) {
  const router = express.Router()
  const { db } = ctx
  const auth = requireAuth(ctx)

  router.get('/cause/:causeId', (req, res) => {
    res.json(db.prepare(`SELECT p.id, p.text, p.style, p.votes, p.created_at AS createdAt, u.display_name AS author
      FROM placards p JOIN users u ON u.id = p.user_id
      WHERE p.cause_id = ? AND p.status = 'visible' ORDER BY p.votes DESC, p.created_at DESC LIMIT 100`).all(req.params.causeId))
  })

  router.post('/', auth, ctx.limits.write,
    validate(z.object({ causeId: z.string().min(1).max(64), text: z.string().max(200), style: z.string().max(40).default('placard_carton') }).strict()),
    (req, res) => {
      const { causeId, text, style } = req.valid.body
      if (!db.prepare(`SELECT 1 FROM causes WHERE id = ? AND status = 'active'`).get(causeId)) throw notFound('Causa no encontrada o cerrada')
      const problem = placardProblem(text)
      if (problem) throw badRequest(problem, 'invalid_placard')
      const item = findCosmetic(style)
      const owned = db.prepare('SELECT item_id FROM entitlements WHERE user_id = ?').all(req.userId).map(r => r.item_id)
      if (item?.kind !== 'placardStyle' || !ownsCosmetic(item, getProfile(db, req.userId).progress.level, owned)) {
        throw forbidden('No tienes ese estilo de pancarta', 'not_owned')
      }
      const active = db.prepare(`SELECT COUNT(*) AS n FROM placards WHERE user_id = ? AND cause_id = ? AND status = 'visible'`).get(req.userId, causeId).n
      if (active >= MAX_ACTIVE_PER_CAUSE) throw badRequest(`Máximo ${MAX_ACTIVE_PER_CAUSE} pancartas activas por causa`, 'placard_limit')
      const id = crypto.randomUUID()
      db.prepare('INSERT INTO placards (id, user_id, cause_id, text, style) VALUES (?, ?, ?, ?, ?)').run(id, req.userId, causeId, cleanText(text), style)
      res.status(201).json({ id })
    })

  router.post('/:id/vote', auth, ctx.limits.write, (req, res) => {
    const placard = db.prepare(`SELECT id FROM placards WHERE id = ? AND status = 'visible'`).get(req.params.id)
    if (!placard) throw notFound('Pancarta no encontrada')
    const voted = db.transaction(() => {
      const removed = db.prepare('DELETE FROM placard_votes WHERE placard_id = ? AND user_id = ?').run(placard.id, req.userId).changes
      if (!removed) db.prepare('INSERT INTO placard_votes (placard_id, user_id) VALUES (?, ?)').run(placard.id, req.userId)
      db.prepare('UPDATE placards SET votes = (SELECT COUNT(*) FROM placard_votes WHERE placard_id = ?) WHERE id = ?').run(placard.id, placard.id)
      return !removed
    })()
    res.json({ voted })
  })

  router.post('/:id/report', auth, ctx.limits.write, (req, res) => {
    db.transaction(() => {
      const inserted = db.prepare('INSERT OR IGNORE INTO placard_reports (placard_id, user_id) SELECT id, ? FROM placards WHERE id = ?').run(req.userId, req.params.id).changes
      if (inserted) {
        db.prepare('UPDATE placards SET reports = reports + 1 WHERE id = ?').run(req.params.id)
        db.prepare(`UPDATE placards SET status = 'hidden' WHERE id = ? AND reports >= ?`).run(req.params.id, HIDE_AFTER_REPORTS)
      }
    })()
    res.status(202).json({ message: 'Gracias, revisaremos la pancarta.' })
  })

  router.delete('/:id', auth, (req, res) => {
    const result = db.prepare(`UPDATE placards SET status = 'hidden' WHERE id = ? AND (user_id = ? OR ? = 'admin')`).run(req.params.id, req.userId, req.userRole)
    if (!result.changes) throw notFound('Pancarta no encontrada')
    res.status(204).end()
  })

  return router
}
