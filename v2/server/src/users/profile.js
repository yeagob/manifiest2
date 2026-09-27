import { levelProgress, unitCapacity, usedCapacity, validatePattern } from '@manifiest/shared'

export function getProfile(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return null
  const units = db.prepare('SELECT role FROM units WHERE user_id = ?').all(userId)
  const capacity = unitCapacity(user.level, user.active_days)
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
    hasPassword: Boolean(user.password_hash),
    googleLinked: Boolean(user.google_sub),
    createdAt: user.created_at,
    progress: levelProgress(user.xp),
    activeDays: user.active_days,
    totalSteps: user.total_steps,
    unallocatedSteps: user.unallocated_steps,
    pattern: JSON.parse(user.pattern_json),
    capacity,
    usedCapacity: usedCapacity(units),
    unitCount: units.length
  }
}

export function setPattern(db, userId, pattern) {
  const problem = validatePattern(pattern)
  if (problem) return problem
  const unique = [...new Set(pattern)]
  if (unique.length) {
    const found = db.prepare(`SELECT COUNT(*) AS n FROM causes WHERE status = 'active' AND id IN (${unique.map(() => '?').join(',')})`).get(...unique).n
    if (found !== unique.length) return 'El patrón incluye causas inexistentes o cerradas'
  }
  db.prepare('UPDATE users SET pattern_json = ?, pattern_cursor = 0 WHERE id = ?').run(JSON.stringify(pattern), userId)
  return null
}
