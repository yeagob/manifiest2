export const nowIso = () => new Date().toISOString()
export const inMs = ms => new Date(Date.now() + ms).toISOString()
export const isPast = iso => !iso || new Date(iso).getTime() <= Date.now()

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return isoDate(d)
}
