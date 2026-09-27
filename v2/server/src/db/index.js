import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql')

const COLUMNS = [
  ['users', 'eco_balance', 'REAL NOT NULL DEFAULT 0'],
  ['users', 'eco_collected_at', 'TEXT'],
  ['users', 'upgrades_json', "TEXT NOT NULL DEFAULT '{}'"],
  ['units', 'deployed_at', 'TEXT'],
  ['units', 'service_seconds', 'INTEGER NOT NULL DEFAULT 0']
]

function migrate(db) {
  for (const [table, column, ddl] of COLUMNS) {
    const exists = db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column)
    if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)
  }
  db.exec(`UPDATE units SET deployed_at = created_at WHERE cause_id IS NOT NULL AND deployed_at IS NULL`)
}

export function openDatabase(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  const hasUsers = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'users'`).get()
  if (hasUsers) migrate(db)
  db.exec(fs.readFileSync(schemaPath, 'utf8'))
  migrate(db)
  return db
}
