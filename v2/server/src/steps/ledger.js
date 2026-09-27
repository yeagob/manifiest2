import { allocateSteps, xpForDay, levelFromXp, stepsEco, ACTIVE_DAY_MIN_STEPS, DAILY_STEP_CAP } from '@manifiest/shared'
import { badRequest } from '../lib/errors.js'
import { nowIso, isoDate, addDays } from '../lib/time.js'

export const BACKFILL_DAYS = 30
export const SOURCES = ['fitbit', 'withings', 'garmin', 'device:ios', 'device:android']

export function createLedger(ctx) {
  const { db, events } = ctx

  const q = {
    user: db.prepare('SELECT id, xp, active_days, pattern_json, pattern_cursor, upgrades_json FROM users WHERE id = ?'),
    allocOf: db.prepare('SELECT steps FROM allocations WHERE user_id = ? AND cause_id = ?'),
    causeStats: db.prepare('SELECT total_steps, (SELECT COUNT(*) FROM allocations a WHERE a.cause_id = causes.id AND a.steps > 0) AS people FROM causes WHERE id = ?'),
    sourceDay: db.prepare('SELECT steps FROM source_daily WHERE user_id = ? AND source = ? AND date = ?'),
    upsertSource: db.prepare(`INSERT INTO source_daily (user_id, source, date, steps, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (user_id, source, date) DO UPDATE SET steps = excluded.steps, updated_at = excluded.updated_at`),
    maxForDay: db.prepare('SELECT MAX(steps) AS steps FROM source_daily WHERE user_id = ? AND date = ?'),
    credit: db.prepare('SELECT credited_steps, xp FROM daily_credit WHERE user_id = ? AND date = ?'),
    upsertCredit: db.prepare(`INSERT INTO daily_credit (user_id, date, credited_steps, xp) VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, date) DO UPDATE SET credited_steps = excluded.credited_steps, xp = excluded.xp`),
    activeOn: db.prepare('SELECT credited_steps FROM daily_credit WHERE user_id = ? AND date = ?'),
    ledger: db.prepare('INSERT INTO step_ledger (user_id, date, source, delta, allocation_json) VALUES (?, ?, ?, ?, ?)'),
    alloc: db.prepare(`INSERT INTO allocations (user_id, cause_id, steps) VALUES (?, ?, ?)
      ON CONFLICT (user_id, cause_id) DO UPDATE SET steps = steps + excluded.steps`),
    causeTotal: db.prepare('UPDATE causes SET total_steps = total_steps + ? WHERE id = ?'),
    activeCauses: db.prepare(`SELECT id FROM causes WHERE status = 'active'`),
    updateUser: db.prepare(`UPDATE users SET xp = ?, level = ?, active_days = ?, total_steps = total_steps + ?,
      unallocated_steps = unallocated_steps + ?, pattern_cursor = ?, eco_balance = eco_balance + ? WHERE id = ?`),
    flag: db.prepare('INSERT INTO integrity_flags (user_id, source, date, reason, value) VALUES (?, ?, ?, ?, ?)')
  }

  function streakEndingAt(userId, date) {
    let streak = 1
    let cursor = addDays(date, -1)
    for (let i = 0; i < 60; i++) {
      const row = q.activeOn.get(userId, cursor)
      if (!row || row.credited_steps < ACTIVE_DAY_MIN_STEPS) break
      streak++
      cursor = addDays(cursor, -1)
    }
    return streak
  }

  function distribute(userId, pattern, cursor, delta) {
    const active = new Set(q.activeCauses.all().map(r => r.id))
    const livePattern = pattern.filter(id => active.has(id))
    if (!livePattern.length) return { allocation: {}, cursor: 0, unallocated: delta, milestones: [] }
    const safeCursor = livePattern.length === pattern.length ? cursor : 0
    const result = allocateSteps(livePattern, safeCursor, delta)
    const milestones = []
    for (const [causeId, steps] of Object.entries(result.allocation)) {
      const newcomer = !(q.allocOf.get(userId, causeId)?.steps > 0)
      q.alloc.run(userId, causeId, steps)
      q.causeTotal.run(steps, causeId)
      const after = q.causeStats.get(causeId)
      milestones.push(...ctx.game.checkMilestones(causeId, 'steps', after.total_steps - steps, after.total_steps))
      if (newcomer) milestones.push(...ctx.game.checkMilestones(causeId, 'people', after.people - 1, after.people))
    }
    return { ...result, unallocated: 0, milestones }
  }

  const recordDailyTotal = db.transaction((userId, source, date, reportedSteps) => {
    if (!SOURCES.includes(source)) throw badRequest('Fuente desconocida', 'invalid_source')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest('Fecha inválida', 'invalid_date')
    const today = isoDate()
    if (date > addDays(today, 1)) throw badRequest('No se aceptan pasos del futuro', 'future_date')
    if (date < addDays(today, -BACKFILL_DAYS)) return { delta: 0, ignored: 'too_old' }
    if (!Number.isInteger(reportedSteps) || reportedSteps < 0) throw badRequest('Número de pasos inválido', 'invalid_steps')

    let steps = reportedSteps
    if (steps > DAILY_STEP_CAP) {
      q.flag.run(userId, source, date, 'daily_cap_exceeded', steps)
      steps = DAILY_STEP_CAP
    }

    const previous = q.sourceDay.get(userId, source, date)?.steps ?? 0
    if (steps <= previous) return { delta: 0 }
    q.upsertSource.run(userId, source, date, steps, nowIso())

    const credited = q.maxForDay.get(userId, date).steps
    const prevCredit = q.credit.get(userId, date) ?? { credited_steps: 0, xp: 0 }
    const delta = credited - prevCredit.credited_steps
    if (delta <= 0) return { delta: 0 }

    const user = q.user.get(userId)
    const becameActive = prevCredit.credited_steps < ACTIVE_DAY_MIN_STEPS && credited >= ACTIVE_DAY_MIN_STEPS
    const dayXp = xpForDay(credited, credited >= ACTIVE_DAY_MIN_STEPS ? streakEndingAt(userId, date) : 0)
    q.upsertCredit.run(userId, date, credited, dayXp)

    const xp = user.xp + (dayXp - prevCredit.xp)
    const level = levelFromXp(xp)
    const activeDays = user.active_days + (becameActive ? 1 : 0)
    const { allocation, cursor, unallocated, milestones } = distribute(userId, JSON.parse(user.pattern_json), user.pattern_cursor, delta)

    q.ledger.run(userId, date, source, delta, JSON.stringify(allocation))
    q.updateUser.run(xp, level, activeDays, delta, unallocated, cursor, stepsEco(delta, JSON.parse(user.upgrades_json || '{}')), userId)

    return { delta, allocation, unallocated, xp, level, milestones }
  })

  const allocateReserve = db.transaction((userId) => {
    const user = db.prepare('SELECT unallocated_steps, pattern_json, pattern_cursor FROM users WHERE id = ?').get(userId)
    if (!user.unallocated_steps) return { allocation: {}, allocated: 0 }
    const { allocation, cursor, unallocated, milestones } = distribute(userId, JSON.parse(user.pattern_json), user.pattern_cursor, user.unallocated_steps)
    if (unallocated) throw badRequest('Configura primero tu patrón de reparto', 'empty_pattern')
    db.prepare('UPDATE users SET unallocated_steps = 0, pattern_cursor = ? WHERE id = ?').run(cursor, userId)
    q.ledger.run(userId, isoDate(), 'reserve', 0, JSON.stringify(allocation))
    return { allocation, allocated: user.unallocated_steps, milestones }
  })

  return {
    recordDailyTotal(userId, source, date, steps) {
      const result = recordDailyTotal(userId, source, date, steps)
      if (result.delta > 0) {
        for (const [causeId, amount] of Object.entries(result.allocation)) events.emit('steps', { causeId, userId, steps: amount })
        ctx.game.announce(result.milestones)
      }
      return result
    },
    recordMany(userId, source, days) {
      return days.map(d => ({ date: d.date, ...this.recordDailyTotal(userId, source, d.date, d.steps) }))
    },
    allocateReserve(userId) {
      const result = allocateReserve(userId)
      for (const [causeId, amount] of Object.entries(result.allocation)) events.emit('steps', { causeId, userId, steps: amount })
      ctx.game.announce(result.milestones ?? [])
      return result
    }
  }
}
