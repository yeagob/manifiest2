export const STEPS_PER_XP = 100
export const ACTIVE_DAY_MIN_STEPS = 2000
export const ACTIVE_DAY_XP = 20
export const STREAK_XP_PER_DAY = 5
export const STREAK_XP_CAP = 30
export const ACTIVE_DAYS_PER_SENIORITY_UNIT = 30
export const DAILY_STEP_CAP = 70000

export function xpForDay(steps, streakLength = 0) {
  const credited = Math.min(Math.max(0, steps), DAILY_STEP_CAP)
  let xp = Math.floor(credited / STEPS_PER_XP)
  if (credited >= ACTIVE_DAY_MIN_STEPS) {
    xp += ACTIVE_DAY_XP + Math.min(Math.max(0, streakLength - 1) * STREAK_XP_PER_DAY, STREAK_XP_CAP)
  }
  return xp
}

export function levelFromXp(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}

export function xpForLevel(level) {
  return 100 * (level - 1) ** 2
}

export function levelProgress(xp) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  return { level, xp, levelFloor: floor, levelCeil: ceil, ratio: (xp - floor) / (ceil - floor) }
}

export function unitCapacity(level, activeDays = 0) {
  const base = Math.floor(3 + 1.5 * (level - 1) + 0.1 * level * level)
  return base + Math.floor(Math.max(0, activeDays) / ACTIVE_DAYS_PER_SENIORITY_UNIT)
}
