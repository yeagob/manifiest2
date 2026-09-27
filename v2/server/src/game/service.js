import {
  UNIT_ROLES, UPGRADES, upgradeCost, upgradeLevel, upgradeProblem, rankFor, needMultiplier, effectiveNeed,
  ecoRatePerHour, pendingEco, storageHours, extraCapacity, crossedMilestones, unitCapacity, usedCapacity,
  levelProgress, unlockTrack, categoryUnits, categoryProgress, lockReason, mintCost
} from '@manifiest/shared'
import { badRequest, notFound } from '../lib/errors.js'
import { nowIso } from '../lib/time.js'
import { audit } from '../lib/audit.js'

const MILESTONE_REWARD_PER_UNIT = 25
const MILESTONE_REWARD_CAP = 500

export function serviceSecondsOf(row, now = Date.now()) {
  const current = row.deployed_at ? Math.max(0, Math.floor((now - new Date(row.deployed_at).getTime()) / 1000)) : 0
  return (row.service_seconds ?? 0) + current
}

export function createGame(ctx) {
  const { db, events } = ctx

  const upgradesOf = user => JSON.parse(user.upgrades_json || '{}')

  function fronts() {
    const rows = db.prepare(`SELECT c.id, c.title, c.icon, c.color, c.category, c.theme, c.total_steps, c.created_at, c.goal_people,
      (SELECT COUNT(*) FROM allocations a WHERE a.cause_id = c.id AND a.steps > 0) AS people,
      (SELECT COUNT(*) FROM units u WHERE u.cause_id = c.id) AS deployed
      FROM causes c WHERE c.status = 'active'`).all()
    const totalPeople = rows.reduce((s, r) => s + Math.max(r.people, 1), 0)
    const totalDeployed = rows.reduce((s, r) => s + r.deployed, 0)
    const globalRatio = Math.max(0.5, totalDeployed / Math.max(totalPeople, 1))
    const since = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const momentum = Object.fromEntries(db.prepare(`SELECT json_each.key AS cause_id, SUM(json_each.value) AS steps
      FROM step_ledger, json_each(step_ledger.allocation_json) WHERE step_ledger.date >= ? GROUP BY json_each.key`).all(since).map(r => [r.cause_id, r.steps]))
    return rows.map(r => ({
      id: r.id, title: r.title, icon: r.icon, color: r.color, category: r.category, theme: r.theme,
      totalSteps: r.total_steps, people: r.people, deployed: r.deployed, goalPeople: r.goal_people,
      steps24h: momentum[r.id] ?? 0,
      need: needMultiplier({ people: r.people, deployed: r.deployed, globalRatio, ageDays: (Date.now() - new Date(r.created_at).getTime()) / 86400000 })
    }))
  }

  function categorySteps(userId) {
    return Object.fromEntries(db.prepare(`SELECT c.category, SUM(a.steps) AS steps FROM allocations a JOIN causes c ON c.id = a.cause_id
      WHERE a.user_id = ? GROUP BY c.category`).all(userId).map(r => [r.category, r.steps]))
  }

  function unitsWithRank(userId, upgrades, now = Date.now()) {
    return db.prepare('SELECT id, role, cause_id, deployed_at, service_seconds FROM units WHERE user_id = ?').all(userId).map(u => {
      const rank = rankFor(serviceSecondsOf(u, now), upgrades)
      return { id: u.id, role: u.role, causeId: u.cause_id, rank, rankMult: rank.mult }
    })
  }

  function rateFor(userId, upgrades, frontList = fronts()) {
    const needByCause = Object.fromEntries(frontList.map(f => [f.id, f.need]))
    return ecoRatePerHour(unitsWithRank(userId, upgrades), needByCause, upgrades)
  }

  function pendingFor(user, rate, now = Date.now()) {
    if (!user.eco_collected_at) return 0
    return pendingEco(rate, (now - new Date(user.eco_collected_at).getTime()) / 1000, upgradesOf(user))
  }

  const settle = db.transaction(userId => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    const now = Date.now()
    const collected = pendingFor(user, rateFor(userId, upgradesOf(user)), now)
    const balance = user.eco_balance + collected
    db.prepare('UPDATE users SET eco_balance = ?, eco_collected_at = ? WHERE id = ?').run(balance, new Date(now).toISOString(), userId)
    return { balance, collected }
  })

  function spend(userId, amount) {
    const result = db.prepare('UPDATE users SET eco_balance = eco_balance - ? WHERE id = ? AND eco_balance >= ?').run(amount, userId, amount - 1e-9)
    if (!result.changes) throw badRequest('No tienes Eco suficiente', 'insufficient_eco')
  }

  function state(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!user) throw notFound('Usuario no encontrado')
    if (!user.eco_collected_at) {
      db.prepare('UPDATE users SET eco_collected_at = ? WHERE id = ?').run(nowIso(), userId)
      user.eco_collected_at = nowIso()
    }
    const upgrades = upgradesOf(user)
    const frontList = fronts()
    const units = unitsWithRank(userId, upgrades)
    const needByCause = Object.fromEntries(frontList.map(f => [f.id, f.need]))
    const rate = ecoRatePerHour(units, needByCause, upgrades)
    const progress = levelProgress(user.xp)
    const catSteps = categorySteps(userId)
    const capacity = unitCapacity(user.level, user.active_days, extraCapacity(upgrades))
    const ownedMarchers = units.filter(u => u.role === 'marcher').length
    return {
      eco: {
        balance: user.eco_balance,
        pending: pendingFor(user, rate),
        ratePerHour: rate,
        storageHours: storageHours(upgrades),
        collectedAt: user.eco_collected_at
      },
      progress,
      capacity,
      usedCapacity: usedCapacity(units),
      upgrades: Object.entries(UPGRADES).map(([id, u]) => {
        const level = upgradeLevel(upgrades, id)
        return {
          id, label: u.label, description: u.description, level, max: u.max, minLevel: u.minLevel,
          cost: level < u.max ? upgradeCost(id, level) : null,
          effectNow: u.effect(level), effectNext: level < u.max ? u.effect(level + 1) : null,
          problem: upgradeProblem(id, upgrades, progress.level, user.eco_balance)
        }
      }),
      roles: Object.entries(UNIT_ROLES).map(([id, r]) => ({
        id, ...r, price: mintCost(id, upgrades, ownedMarchers),
        locked: lockReason(id, progress.level, catSteps),
        categoryProgress: categoryProgress(id, catSteps)
      })),
      fronts: frontList.map(f => {
        const mine = units.filter(u => u.causeId === f.id)
        const byRole = {}
        for (const u of mine) byRole[u.role] = (byRole[u.role] ?? 0) + 1
        return {
          ...f,
          effectiveNeed: effectiveNeed(f.need, upgrades),
          myUnits: mine.length,
          myRoles: byRole,
          myRate: ecoRatePerHour(mine, needByCause, upgrades)
        }
      }),
      reserve: units.filter(u => !u.causeId).reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc }, {}),
      categorySteps: catSteps,
      track: unlockTrack(),
      categoryUnits: categoryUnits()
    }
  }

  function buyUpgrade(userId, id) {
    return db.transaction(() => {
      settle(userId)
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
      const upgrades = upgradesOf(user)
      const problem = upgradeProblem(id, upgrades, user.level, user.eco_balance)
      if (problem) throw badRequest(problem, 'cannot_upgrade')
      const level = upgradeLevel(upgrades, id)
      spend(userId, upgradeCost(id, level))
      upgrades[id] = level + 1
      db.prepare('UPDATE users SET upgrades_json = ? WHERE id = ?').run(JSON.stringify(upgrades), userId)
      audit(db, { userId, action: 'game.upgrade', meta: { id, level: level + 1 } })
    })()
  }

  function checkMilestones(causeId, kind, before, after) {
    const reached = []
    for (const threshold of crossedMilestones(kind, before, after)) {
      const inserted = db.prepare('INSERT OR IGNORE INTO milestones (cause_id, kind, threshold) VALUES (?, ?, ?)').run(causeId, kind, threshold).changes
      if (!inserted) continue
      const present = db.prepare('SELECT user_id, COUNT(*) AS n FROM units WHERE cause_id = ? GROUP BY user_id').all(causeId)
      const reward = db.prepare('UPDATE users SET eco_balance = eco_balance + ? WHERE id = ?')
      for (const p of present) reward.run(Math.min(p.n * MILESTONE_REWARD_PER_UNIT, MILESTONE_REWARD_CAP), p.user_id)
      reached.push({ causeId, kind, threshold })
    }
    return reached
  }

  function announce(milestones) {
    for (const m of milestones) events.emit('milestone', m)
  }

  return { fronts, categorySteps, unitsWithRank, rateFor, settle, spend, state, buyUpgrade, checkMilestones, announce, upgradesOf }
}
