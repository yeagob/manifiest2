import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { verifyEd25519, ed25519PublicKey } from '../security/signatures.js'
import { sha256 } from '../security/tokens.js'
import { badRequest, unauthorized, notFound } from '../lib/errors.js'
import { audit } from '../lib/audit.js'
import { nowIso, inMs, isPast } from '../lib/time.js'

const PAIRING_TTL_MS = 10 * 60 * 1000
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000
const PAIRING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MAX_DEVICES = 5

const ingestSchema = z.object({
  deviceId: z.string().uuid(),
  timestamp: z.number().int(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  days: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    steps: z.number().int().min(0).max(1_000_000)
  })).min(1).max(31)
}).strict()

function pairingCode() {
  let code = ''
  for (let i = 0; i < 8; i++) code += PAIRING_ALPHABET[crypto.randomInt(0, PAIRING_ALPHABET.length)]
  return code
}

export function deviceRoutes(ctx) {
  const router = express.Router()
  const { db } = ctx
  const auth = requireAuth(ctx)

  router.get('/', auth, (req, res) => {
    res.json(db.prepare('SELECT id, name, platform, last_seen_at AS lastSeenAt, created_at AS createdAt FROM devices WHERE user_id = ? AND revoked_at IS NULL').all(req.userId))
  })

  router.post('/pairing-code', auth, ctx.limits.write, (req, res) => {
    const code = pairingCode()
    db.prepare('DELETE FROM pairing_codes WHERE user_id = ? OR expires_at < ?').run(req.userId, nowIso())
    db.prepare('INSERT INTO pairing_codes (code_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(code), req.userId, inMs(PAIRING_TTL_MS))
    res.status(201).json({ code, expiresInSeconds: PAIRING_TTL_MS / 1000 })
  })

  router.post('/pair', ctx.limits.auth, express.json({ limit: '8kb' }),
    validate(z.object({
      code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8}$/),
      publicKey: z.string().regex(/^[A-Za-z0-9+/]{43}=$/),
      name: z.string().trim().min(1).max(60),
      platform: z.enum(['ios', 'android'])
    }).strict()),
    (req, res) => {
      const { code, publicKey, name, platform } = req.valid.body
      try { ed25519PublicKey(publicKey) } catch { throw badRequest('Clave pública inválida', 'invalid_key') }
      const deviceId = db.transaction(() => {
        const row = db.prepare('SELECT * FROM pairing_codes WHERE code_hash = ?').get(sha256(code))
        if (!row || row.consumed_at || isPast(row.expires_at)) throw badRequest('Código de emparejamiento inválido o caducado', 'invalid_pairing')
        db.prepare('UPDATE pairing_codes SET consumed_at = ? WHERE code_hash = ?').run(nowIso(), row.code_hash)
        const active = db.prepare('SELECT COUNT(*) AS n FROM devices WHERE user_id = ? AND revoked_at IS NULL').get(row.user_id).n
        if (active >= MAX_DEVICES) throw badRequest(`Máximo ${MAX_DEVICES} dispositivos por cuenta`, 'too_many_devices')
        if (db.prepare('SELECT 1 FROM devices WHERE public_key = ?').get(publicKey)) throw badRequest('Clave ya registrada', 'duplicate_key')
        const id = crypto.randomUUID()
        db.prepare('INSERT INTO devices (id, user_id, name, platform, public_key) VALUES (?, ?, ?, ?, ?)').run(id, row.user_id, name, platform, publicKey)
        audit(db, { userId: row.user_id, action: 'device.paired', meta: { deviceId: id, platform }, ip: req.ip })
        return id
      })()
      res.status(201).json({ deviceId })
    })

  router.post('/ingest', ctx.limits.ingest, express.text({ type: '*/*', limit: '32kb' }), (req, res) => {
    const raw = typeof req.body === 'string' ? req.body : ''
    const signature = req.get('x-device-signature') || ''
    let payload
    try { payload = ingestSchema.parse(JSON.parse(raw)) } catch { throw badRequest('Carga inválida', 'invalid_payload') }

    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND revoked_at IS NULL').get(payload.deviceId)
    if (!device || !verifyEd25519(device.public_key, raw, signature)) throw unauthorized('Firma de dispositivo inválida', 'invalid_signature')
    if (Math.abs(Date.now() - payload.timestamp) > MAX_CLOCK_SKEW_MS) throw unauthorized('Marca temporal fuera de rango', 'stale_request')

    db.prepare('DELETE FROM device_nonces WHERE created_at < ?').run(new Date(Date.now() - 2 * MAX_CLOCK_SKEW_MS).toISOString())
    const fresh = db.prepare('INSERT OR IGNORE INTO device_nonces (device_id, nonce, created_at) VALUES (?, ?, ?)').run(device.id, payload.nonce, nowIso())
    if (fresh.changes === 0) throw unauthorized('Petición repetida', 'replay')

    const results = ctx.ledger.recordMany(device.user_id, `device:${device.platform}`, payload.days)
    db.prepare('UPDATE devices SET last_seen_at = ? WHERE id = ?').run(nowIso(), device.id)
    res.json({ credited: results.reduce((s, r) => s + (r.delta || 0), 0), days: results })
  })

  router.delete('/:id', auth, (req, res) => {
    const result = db.prepare('UPDATE devices SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL').run(nowIso(), req.params.id, req.userId)
    if (!result.changes) throw notFound('Dispositivo no encontrado')
    audit(db, { userId: req.userId, action: 'device.revoked', meta: { deviceId: req.params.id }, ip: req.ip })
    res.status(204).end()
  })

  return router
}
