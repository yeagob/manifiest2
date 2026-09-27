import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import {
  UNIT_ROLES, GENOME_VERSION, canMint, generateGenome, rollRarity,
  findCosmetic, ownsCosmetic, mintCost, rankFor
} from '@manifiest/shared'
import { serviceSecondsOf } from '../game/service.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'
import { getProfile } from '../users/profile.js'
import { audit } from '../lib/audit.js'

const LOADOUT_SLOTS = { placardStyle: 'placardStyle', palette: 'palette', effect: 'effect', frame: 'frame' }

export function serializeUnit(row, upgrades = {}) {
  return {
    id: row.id, serial: row.serial, role: row.role, rarity: row.rarity, name: row.name, causeId: row.cause_id,
    loadout: JSON.parse(row.loadout_json),
    rank: rankFor(serviceSecondsOf(row), upgrades),
    genome: generateGenome(row.seed, { rarity: row.rarity, role: row.role })
  }
}

export function unitRoutes(ctx) {
  const router = express.Router()
  const { db } = ctx
  router.use(requireAuth(ctx))

  const entitlements = userId => db.prepare('SELECT item_id FROM entitlements WHERE user_id = ?').all(userId).map(r => r.item_id)

  const upgradesOf = userId => ctx.game.upgradesOf(db.prepare('SELECT upgrades_json FROM users WHERE id = ?').get(userId))

  router.get('/', (req, res) => {
    const upgrades = upgradesOf(req.userId)
    res.json({
      roles: UNIT_ROLES,
      units: db.prepare('SELECT * FROM units WHERE user_id = ? ORDER BY serial').all(req.userId).map(u => serializeUnit(u, upgrades))
    })
  })

  router.post('/mint', ctx.limits.write, validate(z.object({ role: z.enum(Object.keys(UNIT_ROLES)) }).strict()), (req, res) => {
    const unit = db.transaction(() => {
      ctx.game.settle(req.userId)
      const user = db.prepare('SELECT id, level, unit_serial, eco_balance, upgrades_json FROM users WHERE id = ?').get(req.userId)
      const profile = getProfile(db, req.userId)
      const owned = db.prepare('SELECT role FROM units WHERE user_id = ?').all(req.userId)
      const upgrades = ctx.game.upgradesOf(user)
      const price = mintCost(req.valid.body.role, upgrades, owned.filter(o => o.role === 'marcher').length)
      const problem = canMint(req.valid.body.role, owned, user.level, profile.capacity, { categorySteps: ctx.game.categorySteps(req.userId), eco: user.eco_balance, price })
      if (problem) throw badRequest(problem, 'cannot_mint')
      if (price > 0) ctx.game.spend(user.id, price)
      const serial = user.unit_serial + 1
      const seed = crypto.createHmac('sha256', ctx.config.jwtSecret).update(`${user.id}:${serial}:${crypto.randomUUID()}`).digest('hex').slice(0, 32)
      const role = req.valid.body.role
      const rarity = rollRarity(seed, user.level, role)
      const genome = generateGenome(seed, { rarity, role })
      const id = crypto.randomUUID()
      db.prepare('INSERT INTO units (id, user_id, serial, seed, genome_version, role, rarity, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, user.id, serial, seed, GENOME_VERSION, role, rarity, genome.name)
      db.prepare('UPDATE users SET unit_serial = ? WHERE id = ?').run(serial, user.id)
      audit(db, { userId: user.id, action: 'unit.minted', meta: { id, role, rarity, price } })
      return db.prepare('SELECT * FROM units WHERE id = ?').get(id)
    })()
    res.status(201).json(serializeUnit(unit, upgradesOf(req.userId)))
  })

  router.delete('/:id', ctx.limits.write, (req, res) => {
    const unit = db.prepare('SELECT id, cause_id FROM units WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
    if (!unit) throw notFound('Unidad no encontrada')
    ctx.game.settle(req.userId)
    db.prepare('DELETE FROM units WHERE id = ?').run(unit.id)
    if (unit.cause_id) ctx.events.emit('deploy', { causeId: unit.cause_id, delta: -1 })
    res.status(204).end()
  })

  router.post('/deploy', ctx.limits.write,
    validate(z.object({ unitIds: z.array(z.string().uuid()).min(1).max(500), causeId: z.string().min(1).max(64).nullable() }).strict()),
    (req, res) => {
      const { unitIds, causeId } = req.valid.body
      res.json({ moved: ctx.deployer.move(req.userId, [...new Set(unitIds)], causeId) })
    })

  router.put('/:id/loadout', ctx.limits.write,
    validate(z.object(Object.fromEntries(Object.keys(LOADOUT_SLOTS).map(k => [k, z.string().max(40).nullable().optional()]))).strict()),
    (req, res) => {
      const unit = db.prepare('SELECT * FROM units WHERE id = ? AND user_id = ?').get(req.params.id, req.userId)
      if (!unit) throw notFound('Unidad no encontrada')
      const level = getProfile(db, req.userId).progress.level
      const owned = entitlements(req.userId)
      const loadout = JSON.parse(unit.loadout_json)
      for (const [slot, itemId] of Object.entries(req.valid.body)) {
        if (itemId === null || itemId === undefined) { delete loadout[slot]; continue }
        const item = findCosmetic(itemId)
        if (!item || item.kind !== LOADOUT_SLOTS[slot]) throw badRequest(`Objeto inválido para ${slot}`, 'invalid_item')
        if (!ownsCosmetic(item, level, owned)) throw forbidden(`Aún no tienes "${item.name}"`, 'not_owned')
        loadout[slot] = itemId
      }
      db.prepare('UPDATE units SET loadout_json = ? WHERE id = ?').run(JSON.stringify(loadout), unit.id)
      res.json(serializeUnit({ ...unit, loadout_json: JSON.stringify(loadout) }, upgradesOf(req.userId)))
    })

  return router
}
