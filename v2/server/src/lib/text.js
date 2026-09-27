const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g
const URL_LIKE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|es|xyz|ru|info|biz)\b)/i
const BLOCKLIST = ['matar', 'muerte a', 'asesinar', 'exterminar', 'nazi', 'kill', 'sieg heil']

export function cleanText(text) {
  return String(text).normalize('NFC').replace(CONTROL, '').replace(/\s+/g, ' ').trim()
}

export function placardProblem(text) {
  const clean = cleanText(text)
  if (clean.length < 2 || clean.length > 80) return 'La pancarta debe tener entre 2 y 80 caracteres'
  if (URL_LIKE.test(clean)) return 'Las pancartas no pueden contener enlaces'
  const lower = clean.toLowerCase()
  if (BLOCKLIST.some(w => lower.includes(w))) return 'La pancarta incumple las normas de convivencia'
  return null
}
