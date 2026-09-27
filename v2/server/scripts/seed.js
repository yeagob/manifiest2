import crypto from 'node:crypto'
import { UNIT_ROLES, canMint, unitCapacity, generateGenome, rollRarity, GENOME_VERSION, createRng, xpForLevel, COSMETICS } from '@manifiest/shared'
import { loadConfig } from '../src/config.js'
import { createContext } from '../src/app.js'
import { hashPassword } from '../src/security/passwords.js'
import { isoDate, addDays } from '../src/lib/time.js'

const config = loadConfig()
if (config.isProd) throw new Error('No ejecutes el seed en producción')
const ctx = createContext(config)
const { db } = ctx
const rng = createRng('seed')

const CAUSES = [
  { title: 'Animales fuera de las granjas intensivas', demand: 'Moratoria a nuevas macrogranjas en 2027', target: 'Ministerio de Agricultura', category: 'animales', icon: '🐾', color: '#FF6C2F', theme: 'theme_bosque' },
  { title: 'Clima: el Mediterráneo no se vende', demand: 'Ley de protección del litoral antes de 2028', target: 'Congreso de los Diputados', category: 'medio-ambiente', icon: '🌊', color: '#0078BF', theme: 'theme_litoral' },
  { title: 'No a la guerra', demand: 'Destinar el aumento de gasto militar a cooperación', target: 'Gobierno de España', category: 'paz', icon: '🕊️', color: '#FF48B0', theme: 'theme_plaza' },
  { title: 'Vivienda digna ya', demand: 'Limitar el precio del alquiler en zonas tensionadas', target: 'Parlamento autonómico', category: 'vivienda', icon: '🏠', color: '#765BA7', theme: 'theme_neon' }
]
const PLACARDS = ['Ni un paso atrás', 'Sin planeta no hay futuro', 'Paz, pan y techo', 'Caminamos juntas', 'El mar no se vende', 'Menos tanques, más escuelas', 'Jaulas vacías', 'Aquí estamos']
const NAMES = ['Lucía', 'Mateo', 'Aitana', 'Hugo', 'Noa', 'Iker', 'Carmen', 'Leo', 'Vega', 'Pau', 'Amaia', 'Omar', 'Julia', 'Marc', 'Nerea', 'Dani', 'Sara', 'Álex', 'Irene', 'Bruno']

const password = await hashPassword('manifiesto-demo-2026')
const users = []
for (let i = 0; i < 60; i++) {
  const id = crypto.randomUUID()
  db.prepare(`INSERT OR IGNORE INTO users (id, email, password_hash, display_name, email_verified_at) VALUES (?, ?, ?, ?, datetime('now'))`)
    .run(id, `demo${i}@manifiest.local`, password, `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${i}` : ''}`)
  users.push(db.prepare('SELECT id FROM users WHERE email = ?').get(`demo${i}@manifiest.local`).id)
}

const causeIds = CAUSES.map(c => {
  const existing = db.prepare('SELECT id FROM causes WHERE title = ?').get(c.title)
  if (existing) return existing.id
  const id = crypto.randomUUID()
  db.prepare(`INSERT INTO causes (id, title, description, demand, target, category, icon, color, theme, goal_people, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, c.title, `${c.demand}. Cada paso cuenta y cada persona se ve.`, c.demand, c.target, c.category, c.icon, c.color, c.theme, 100, users[0])
  return id
})

const [animals, climate, war, housing] = causeIds
const patterns = [[animals, climate, war, war, war], [climate], [war, housing], [housing, housing, animals], [climate, war]]

users.forEach((userId, i) => {
  const pattern = patterns[i % patterns.length]
  db.prepare('UPDATE users SET pattern_json = ?, pattern_cursor = 0 WHERE id = ?').run(JSON.stringify(pattern), userId)
  const intensity = 0.3 + rng() * 1.2
  const days = 5 + Math.floor(rng() * 26)
  for (let d = days - 1; d >= 0; d--) {
    ctx.ledger.recordDailyTotal(userId, rng() > 0.5 ? 'fitbit' : 'device:ios', addDays(isoDate(), -d), Math.floor((3000 + rng() * 11000) * intensity))
  }
  const VETERAN_LEVELS = [30, 30, 27, 25, 22, 20, 18, 16, 14, 12]
  if (i < VETERAN_LEVELS.length) {
    const lvl = VETERAN_LEVELS[i]
    db.prepare('UPDATE users SET level = ?, xp = ?, active_days = active_days + 60, eco_balance = ?, upgrades_json = ? WHERE id = ?')
      .run(lvl, xpForLevel(lvl) + 10, 2000 + lvl * 300, JSON.stringify({ imprenta: 4, caja: 3, zapatillas: 5, furgoneta: 2, escuela: 2 }), userId)
  }
  const user = db.prepare('SELECT level, active_days FROM users WHERE id = ?').get(userId)
  const capacity = unitCapacity(user.level, user.active_days)
  const veteranCats = { paz: 1e6, 'medio-ambiente': 1e6, animales: 1e6, vivienda: 1e6, igualdad: 1e6 }
  const roles = Object.keys(UNIT_ROLES).sort((a, b) => UNIT_ROLES[b].cost - UNIT_ROLES[a].cost)
  const effects = COSMETICS.filter(c => c.kind === 'effect').map(c => c.id)
  const palettes = COSMETICS.filter(c => c.kind === 'palette').map(c => c.id)
  const owned = []
  let serial = 0
  for (let guard = 0; guard < 80; guard++) {
    const ctxCats = i < VETERAN_LEVELS.length ? veteranCats : {}
    const special = roles.find(r => r !== 'marcher' && !canMint(r, owned, user.level, capacity, { categorySteps: ctxCats }) && rng() > 0.55 && !owned.some(o => o.role === r && UNIT_ROLES[r].cost >= 6))
    const role = special ?? (canMint('marcher', owned, user.level, capacity) ? null : 'marcher')
    if (!role) break
    serial++
    const seed = crypto.randomBytes(16).toString('hex')
    const rarity = rollRarity(seed, user.level, role)
    const loadout = {}
    if (user.level >= 6 && rng() < 0.25) loadout.effect = effects[Math.floor(rng() * effects.length)]
    if (user.level >= 8 && rng() < 0.2) loadout.palette = palettes[Math.floor(rng() * palettes.length)]
    const hoursAgo = Math.floor(rng() * (i < VETERAN_LEVELS.length ? 900 : 200))
    const deployedAt = new Date(Date.now() - hoursAgo * 3600e3).toISOString()
    db.prepare('INSERT INTO units (id, user_id, serial, seed, genome_version, role, rarity, name, cause_id, loadout_json, deployed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), userId, serial, seed, GENOME_VERSION, role, rarity, generateGenome(seed, { rarity, role }).name, pattern[Math.floor(rng() * pattern.length)], JSON.stringify(loadout), deployedAt)
    owned.push({ role })
  }
  db.prepare('UPDATE users SET unit_serial = ? WHERE id = ?').run(serial, userId)
  if (i < PLACARDS.length * 2) {
    db.prepare('INSERT INTO placards (id, user_id, cause_id, text, style, votes) VALUES (?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), userId, pattern[0], PLACARDS[i % PLACARDS.length], i % 3 ? 'placard_carton' : 'placard_riso', Math.floor(rng() * 40))
  }
})

console.info(`Seed listo: ${users.length} usuarios (contraseña manifiesto-demo-2026), ${causeIds.length} causas.`)
console.info(db.prepare('SELECT title, total_steps FROM causes').all())
ctx.db.close()
