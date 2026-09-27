import express from 'express'
import { z } from 'zod'
import { UNIT_ROLES, featureUnlocked, UPGRADES } from '@manifiest/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, forbidden } from '../lib/errors.js'

const roleEnum = z.enum(Object.keys(UNIT_ROLES))

export function gameRoutes(ctx) {
  const router = express.Router()
  const { db, game, deployer } = ctx
  router.use(requireAuth(ctx))

  router.get('/state', (req, res) => res.json(game.state(req.userId)))

  router.post('/collect', ctx.limits.write, (req, res) => {
    const result = game.settle(req.userId)
    res.json({ ...result, state: game.state(req.userId) })
  })

  router.post('/upgrades/:id', ctx.limits.write, (req, res) => {
    if (!UPGRADES[req.params.id]) throw badRequest('Mejora desconocida', 'unknown_upgrade')
    game.buyUpgrade(req.userId, req.params.id)
    res.json(game.state(req.userId))
  })

  router.post('/fronts/:causeId/send', ctx.limits.write,
    validate(z.object({ role: roleEnum, count: z.number().int().min(1).max(500) }).strict()),
    (req, res) => {
      const ids = deployer.pick(req.userId, { role: req.valid.body.role, count: req.valid.body.count })
      if (!ids.length) throw badRequest('No tienes unidades de ese tipo en la reserva', 'empty_reserve')
      deployer.move(req.userId, ids, req.params.causeId)
      res.json(game.state(req.userId))
    })

  router.post('/fronts/:causeId/recall', ctx.limits.write,
    validate(z.object({ role: roleEnum, count: z.number().int().min(1).max(500) }).strict()),
    (req, res) => {
      const ids = deployer.pick(req.userId, { role: req.valid.body.role, count: req.valid.body.count, fromCause: req.params.causeId })
      if (!ids.length) throw badRequest('No tienes unidades de ese tipo en esta mani', 'nothing_to_recall')
      deployer.move(req.userId, ids, null)
      res.json(game.state(req.userId))
    })

  router.post('/auto-deploy', ctx.limits.write, (req, res) => {
    const level = db.prepare('SELECT level FROM users WHERE id = ?').get(req.userId).level
    if (!featureUnlocked('auto_deploy', level)) throw forbidden('El despliegue estratégico se desbloquea en el nivel 10', 'locked')
    const reserve = db.prepare('SELECT id FROM units WHERE user_id = ? AND cause_id IS NULL ORDER BY serial').all(req.userId).map(r => r.id)
    if (!reserve.length) throw badRequest('Tu reserva está vacía', 'empty_reserve')
    const fronts = game.fronts().sort((a, b) => b.need - a.need)
    const targets = fronts.filter(f => f.need >= 1).slice(0, 3)
    if (!targets.length) throw badRequest('Ahora mismo ninguna mani necesita refuerzos', 'no_targets')
    const totalNeed = targets.reduce((s, f) => s + f.need, 0)
    let cursor = 0
    targets.forEach((f, i) => {
      const share = i === targets.length - 1 ? reserve.length - cursor : Math.round(reserve.length * (f.need / totalNeed))
      const slice = reserve.slice(cursor, cursor + share)
      cursor += slice.length
      if (slice.length) deployer.move(req.userId, slice, f.id)
    })
    res.json(game.state(req.userId))
  })

  return router
}
