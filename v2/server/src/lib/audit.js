export function audit(db, { userId = null, action, meta = null, ip = null }) {
  db.prepare('INSERT INTO audit_log (user_id, action, meta_json, ip) VALUES (?, ?, ?, ?)')
    .run(userId, action, meta ? JSON.stringify(meta) : null, ip)
}
