import crypto from 'node:crypto'
import express from 'express'
import { UNIT_ROLES, figuresFor, rankFor } from '@manifiest/shared'
import { notFound } from '../lib/errors.js'
import { CAUSE_SELECT, serializeCause } from '../causes/routes.js'
import { serviceSecondsOf } from '../game/service.js'
import { verifyAccessToken } from '../security/tokens.js'

const MAX_UNITS = 3000
const MAX_PEOPLE = 2000
const CITIZENS_PER_BLOCK = 24
const MAX_STREAMS_PER_CAUSE = 2000

const blockKey = (salt, userId) => crypto.createHmac('sha256', salt).update(userId).digest('hex').slice(0, 16)

export function protestRoutes(ctx) {
  const router = express.Router()
  const { db, events, config } = ctx
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
    const unitRows = db.prepare(`SELECT un.*, us.display_name, us.level, us.upgrades_json FROM units un JOIN users us ON us.id = un.user_id
      WHERE un.cause_id = ? ORDER BY un.deployed_at, un.serial LIMIT ?`).all(row.id, MAX_UNITS)
    const people = db.prepare(`SELECT a.user_id, a.steps FROM allocations a WHERE a.cause_id = ? AND a.steps > 0 ORDER BY a.steps DESC LIMIT ?`).all(row.id, MAX_PEOPLE)
    const placardByUser = new Map(db.prepare(`SELECT user_id, text, style FROM placards WHERE cause_id = ? AND status = 'visible' ORDER BY votes DESC, created_at DESC`)
      .all(row.id).reverse().map(p => [p.user_id, { text: p.text, style: p.style }]))
    const topPlacards = db.prepare(`SELECT p.id, p.text, p.style, p.votes, u.display_name AS author FROM placards p JOIN users u ON u.id = p.user_id
      WHERE p.cause_id = ? AND p.status = 'visible' ORDER BY p.votes DESC LIMIT 24`).all(row.id)
    const stepsByUser = new Map(people.map(p => [p.user_id, p.steps]))
    let viewer = null
    const [scheme, token] = (req.get('authorization') || '').split(' ')
    if (scheme === 'Bearer' && token) {
      try { viewer = verifyAccessToken(config.jwtSecret, token).sub } catch {}
    }

    const byOwner = new Map()
    for (const u of unitRows) {
      if (!byOwner.has(u.user_id)) {
        byOwner.set(u.user_id, {
          key: blockKey(config.jwtSecret, u.user_id),
          type: 'unit',
          owner: { displayName: u.display_name, level: u.level },
          steps: stepsByUser.get(u.user_id) ?? 0,
          placard: placardByUser.get(u.user_id) ?? null,
          since: u.deployed_at,
          mine: viewer === u.user_id,
          units: [],
          upgrades: JSON.parse(u.upgrades_json || '{}')
        })
      }
      const block = byOwner.get(u.user_id)
      block.units.push({
        id: u.id, s: u.seed, r: u.role, q: u.rarity, n: u.name,
        k: rankFor(serviceSecondsOf(u), block.upgrades).id,
        l: JSON.parse(u.loadout_json)
      })
    }
    const unitBlocks = [...byOwner.values()].map(({ upgrades, ...b }) => ({
      ...b, power: b.units.reduce((s, x) => s + (UNIT_ROLES[x.r]?.cost ?? 1), 0)
    }))
    const citizens = people.filter(p => !byOwner.has(p.user_id)).map(p => ({ s: `person:${blockKey(config.jwtSecret, p.user_id)}`, steps: p.steps }))
    const citizenBlocks = []
    for (let i = 0; i < citizens.length; i += CITIZENS_PER_BLOCK) {
      const group = citizens.slice(i, i + CITIZENS_PER_BLOCK)
      citizenBlocks.push({ key: `c${i / CITIZENS_PER_BLOCK}`, type: 'citizens', owner: null, citizens: group, steps: group.reduce((s, c) => s + c.steps, 0) })
    }
    unitBlocks.sort((a, b) => b.power - a.power)
    const blocks = []
    let ci = 0
    unitBlocks.forEach((b, i) => {
      blocks.push(b)
      if ((i + 1) % 3 === 0 && ci < citizenBlocks.length) blocks.push(citizenBlocks[ci++])
    })
    while (ci < citizenBlocks.length) blocks.push(citizenBlocks[ci++])

    res.set('Cache-Control', 'no-store')
    res.json({
      cause: serializeCause(row),
      stats: {
        uniquePeople: row.unique_people,
        totalSteps: row.total_steps,
        deployedUnits: row.deployed_units,
        figures: figuresFor(unitRows.map(u => ({ role: u.role }))) + citizens.length,
        blocks: blocks.length
      },
      blocks,
      placards: topPlacards,
      milestones: db.prepare('SELECT kind, threshold, reached_at AS reachedAt FROM milestones WHERE cause_id = ? ORDER BY reached_at DESC LIMIT 10').all(row.id)
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
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    const onSteps = e => { if (e.causeId === causeId) send('steps', { steps: e.steps, at: Date.now() }) }
    const onMilestone = e => { if (e.causeId === causeId) send('milestone', { kind: e.kind, threshold: e.threshold, at: Date.now() }) }
    const onDeploy = e => { if (e.causeId === causeId) send('deploy', { delta: e.delta, at: Date.now() }) }
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
    events.on('steps', onSteps)
    events.on('milestone', onMilestone)
    events.on('deploy', onDeploy)
    req.on('close', () => {
      clearInterval(heartbeat)
      events.off('steps', onSteps)
      events.off('milestone', onMilestone)
      events.off('deploy', onDeploy)
      set.delete(res)
    })
  })

  return router
}
