import { badRequest, notFound } from '../lib/errors.js'
import { nowIso } from '../lib/time.js'
import { serviceSecondsOf } from './service.js'

export function createDeployer(ctx) {
  const { db, events } = ctx

  const moveUnits = db.transaction((userId, unitIds, causeId) => {
    if (causeId && !db.prepare(`SELECT 1 FROM causes WHERE id = ? AND status = 'active'`).get(causeId)) throw notFound('Causa no encontrada o cerrada')
    ctx.game.settle(userId)
    const now = Date.now()
    const nowStr = nowIso()
    const select = db.prepare('SELECT id, cause_id, deployed_at, service_seconds FROM units WHERE id = ? AND user_id = ?')
    const update = db.prepare('UPDATE units SET cause_id = ?, deployed_at = ?, service_seconds = ? WHERE id = ?')
    const touched = new Map()
    let moved = 0
    for (const id of unitIds) {
      const unit = select.get(id, userId)
      if (!unit) throw badRequest('Alguna unidad no te pertenece', 'invalid_units')
      if (unit.cause_id === causeId) { moved++; continue }
      update.run(causeId, causeId ? nowStr : null, serviceSecondsOf(unit, now), unit.id)
      if (unit.cause_id) touched.set(unit.cause_id, (touched.get(unit.cause_id) ?? 0) - 1)
      if (causeId) touched.set(causeId, (touched.get(causeId) ?? 0) + 1)
      moved++
    }
    return { moved, touched }
  })

  return {
    move(userId, unitIds, causeId) {
      const { moved, touched } = moveUnits(userId, unitIds, causeId)
      for (const [id, delta] of touched) if (delta) events.emit('deploy', { causeId: id, delta })
      return moved
    },
    pick(userId, { role, count, fromCause }) {
      const rows = db.prepare(`SELECT id FROM units WHERE user_id = ? AND role = ? AND ${fromCause ? 'cause_id = ?' : 'cause_id IS NULL'}
        ORDER BY service_seconds DESC, serial LIMIT ?`).all(...[userId, role, ...(fromCause ? [fromCause] : []), count])
      return rows.map(r => r.id)
    }
  }
}
