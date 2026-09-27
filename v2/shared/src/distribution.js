export const MAX_PATTERN_LENGTH = 20

export function validatePattern(pattern) {
  if (!Array.isArray(pattern)) return 'El patrón debe ser una lista'
  if (pattern.length > MAX_PATTERN_LENGTH) return `El patrón admite como máximo ${MAX_PATTERN_LENGTH} posiciones`
  if (pattern.some(id => typeof id !== 'string' || id.length === 0 || id.length > 64)) return 'Identificador de causa inválido'
  return null
}

export function buildPattern(blocks) {
  const pattern = []
  for (const { causeId, slots } of blocks) {
    for (let i = 0; i < slots; i++) pattern.push(causeId)
  }
  return pattern
}

export function patternShares(pattern) {
  const shares = {}
  if (!pattern.length) return shares
  for (const id of pattern) shares[id] = (shares[id] || 0) + 1
  for (const id of Object.keys(shares)) shares[id] = shares[id] / pattern.length
  return shares
}

export function allocateSteps(pattern, cursor, steps) {
  const allocation = {}
  if (!pattern.length || steps <= 0) return { allocation, cursor }
  const len = pattern.length
  const start = ((cursor % len) + len) % len
  const fullCycles = Math.floor(steps / len)
  const remainder = steps % len
  for (let i = 0; i < len; i++) {
    const causeId = pattern[(start + i) % len]
    const amount = fullCycles + (i < remainder ? 1 : 0)
    if (amount > 0) allocation[causeId] = (allocation[causeId] || 0) + amount
  }
  return { allocation, cursor: (start + remainder) % len }
}
