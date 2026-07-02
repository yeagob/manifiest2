import Database from 'better-sqlite3';
import { promises as fs, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_PATH = join(__dirname, '../../data');
const DB_PATH = process.env.DATABASE_PATH || join(DATA_PATH, 'manifiest2.db');

// Base de datos real (SQLite) como almacén de documentos: una tabla única
// (collection, id, data) que replica la interfaz del antiguo storage de
// ficheros JSON, así los modelos y las rutas no cambian ni una línea.
// En tests (NODE_ENV=test o JEST_WORKER_ID) usa una BD en memoria.
let db = null;

function getDb() {
  if (db) return db;
  const enTests = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
  db = new Database(enTests ? ':memory:' : DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      collection TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (collection, id)
    );
    CREATE INDEX IF NOT EXISTS idx_documents_collection ON documents(collection);
  `);
  return db;
}

// Migración única: importa los JSON del almacén antiguo (data/[col]/[id].json)
// la primera vez que una colección está vacía en la BD y hay ficheros legacy.
const coleccionesMigradas = new Set();
function migrarLegacy(collection) {
  if (coleccionesMigradas.has(collection)) return;
  coleccionesMigradas.add(collection);
  const d = getDb();
  const cuantos = d.prepare('SELECT COUNT(*) AS n FROM documents WHERE collection = ?').get(collection).n;
  if (cuantos > 0) return;
  const dir = join(DATA_PATH, collection);
  if (!existsSync(dir)) return;
  const insertar = d.prepare('INSERT OR IGNORE INTO documents (collection, id, data) VALUES (?, ?, ?)');
  let importados = 0;
  const tx = d.transaction(() => {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = readFileSync(join(dir, file), 'utf-8');
        JSON.parse(raw); // valida
        insertar.run(collection, file.replace(/\.json$/, ''), raw);
        importados++;
      } catch { /* fichero corrupto: se salta */ }
    }
  });
  tx();
  if (importados > 0) {
    console.log(`📦 Migrados ${importados} documentos legacy de "${collection}" a SQLite`);
  }
}

/**
 * Generic document storage service (SQLite-backed).
 * Misma interfaz async que el antiguo storage de ficheros JSON.
 */
class StorageService {
  constructor(collectionName) {
    this.collection = collectionName;
    // compat: algún código antiguo miraba esta propiedad
    this.collectionPath = join(DATA_PATH, collectionName);
  }

  async read(id) {
    migrarLegacy(this.collection);
    const row = getDb()
      .prepare('SELECT data FROM documents WHERE collection = ? AND id = ?')
      .get(this.collection, String(id));
    return row ? JSON.parse(row.data) : null;
  }

  async write(id, data) {
    migrarLegacy(this.collection);
    getDb()
      .prepare(`INSERT INTO documents (collection, id, data, updated_at)
                VALUES (?, ?, ?, datetime('now'))
                ON CONFLICT(collection, id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`)
      .run(this.collection, String(id), JSON.stringify(data));
    return data;
  }

  async delete(id) {
    migrarLegacy(this.collection);
    const res = getDb()
      .prepare('DELETE FROM documents WHERE collection = ? AND id = ?')
      .run(this.collection, String(id));
    return res.changes > 0;
  }

  async list() {
    migrarLegacy(this.collection);
    const rows = getDb()
      .prepare('SELECT data FROM documents WHERE collection = ?')
      .all(this.collection);
    const items = [];
    for (const r of rows) {
      try { items.push(JSON.parse(r.data)); } catch { /* corrupto: fuera */ }
    }
    return items;
  }

  async exists(id) {
    migrarLegacy(this.collection);
    return !!getDb()
      .prepare('SELECT 1 FROM documents WHERE collection = ? AND id = ?')
      .get(this.collection, String(id));
  }

  async update(id, updates) {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`Item ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    return this.write(id, updated);
  }
}

// Para tests: resetear la BD en memoria entre suites si hace falta
export function __resetDbForTests() {
  if (db) {
    db.close();
    db = null;
  }
  coleccionesMigradas.clear();
}

export default StorageService;
