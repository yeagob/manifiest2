import express from 'express'
import { UNIT_ROLES, figuresFor, generateGenome } from '@manifiest/shared'
import { notFound } from '../lib/errors.js'
import { CAUSE_SELECT, serializeCause } from '../causes/routes.js'
import { serializeUnit } from '../units/routes.js'

const MAX_UNITS = 3000
const MAX_PEOPLE = 1500
const MAX_STREAMS_PER_CAUSE = 2000

export function protestRoutes(ctx) {
  const router = express.Router()
  const { db, events } = ctx
  const streams = new Map()

  router.get('/world', (_req, res) => {
    const causes = db.prepare(`${CAUSE_SELECT} WHERE c.status IN ('active', 'delivered', 'won') ORDER BY c.total_steps DESC LIMIT 60`).all()
    const figures = db.prepare('SELECT cause_id, role, COUNT(*) AS n FROM units WHERE cause_id IS NOT NULL GROUP BY cause_id, role').all()
    res.json(causes.map(row => {
      const cause = serializeCause(row)
      const unitFigures = figures.filter(f => f.cause_id === row.id).reduce((s, f) => s + (UNIT_ROLES[f.role]?.figures ?? 0) * f.n, 0)
      return { ...cause, figures: unitFigures }
    }))
  })

  router.get('/:causeId/scene', (req, res) => {
    const row = db.prepare(`${CAUSE_SELECT} WHERE c.id = ?`).get(req.params.causeId)
    if (!row) throw notFound('Causa no encontrada')
    const unitRows = db.prepare(`SELECT un.*, us.display_name, us.level FROM units un JOIN users us ON us.id = un.user_id
      WHERE un.cause_id = ? ORDER BY CASE un.rarity WHEN 'legendary' THEN 0 WHEN 'epic' THEN 1 WHEN 'rare' THEN 2 ELSE 3 END, un.created_at LIMIT ?`).all(row.id, MAX_UNITS)
    const people = db.prepare(`SELECT a.user_id AS userId, u.display_name AS displayName, u.level, a.steps FROM allocations a
      JOIN users u ON u.id = a.user_id WHERE a.cause_id = ? AND a.steps > 0 ORDER BY a.steps DESC LIMIT ?`).all(row.id, MAX_PEOPLE)
    const placards = db.prepare(`SELECT p.id, p.text, p.style, p.votes, u.display_name AS author FROM placards p JOIN users u ON u.id = p.user_id
      WHERE p.cause_id = ? AND p.status = 'visible' ORDER BY p.votes DESC LIMIT 24`).all(row.id)
    const units = unitRows.map(u => ({ ...serializeUnit(u), owner: { displayName: u.display_name, level: u.level } }))
    const unitOwners = new Set(unitRows.map(u => u.user_id))
    res.json({
      cause: serializeCause(row),
      stats: {
        uniquePeople: row.unique_people,
        totalSteps: row.total_steps,
        deployedUnits: row.deployed_units,
        figures: figuresFor(unitRows) + people.filter(p => !unitOwners.has(p.userId)).length
      },
      units,
      people: people.map(p => ({
        displayName: p.displayName,
        level: p.level,
        steps: p.steps,
        hasUnits: unitOwners.has(p.userId),
        genome: generateGenome(`person:${p.userId}`, { rarity: 'common', role: 'marcher' })
      })),
      placards
    })
  })

  router.get('/:causeId/live', (req, res) => {
    const causeId = req.params.causeId
    if (!db.prepare('SELECT 1 FROM causes WHERE id = ?').get(causeId)) throw notFound('Causa no encontrada')
    const set = streams.get(causeId) ?? new Set()
    if (set.size >= MAX_STREAMS_PER_CAUSE) return res.status(503).json({ error: 'Demasiados espectadores, inténtalo en un momento', code: 'busy' })
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
    res.flushHeaders()
    set.add(res)
    streams.set(causeId, set)
    const onSteps = event => {
      if (event.causeId === causeId) res.write(`event: steps\ndata: ${JSON.stringify({ steps: event.steps, at: Date.now() })}\n\n`)
    }
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
    events.on('steps', onSteps)
    req.on('close', () => {
      clearInterval(heartbeat)
      events.off('steps', onSteps)
      set.delete(res)
    })
  })

  return router
}
