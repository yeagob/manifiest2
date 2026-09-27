import crypto from 'node:crypto'
import { createHttp, ProviderError } from './http.js'
import { fitbitProvider } from './fitbit.js'
import { withingsProvider } from './withings.js'
import { garminProvider } from './garmin.js'
import { pkcePair, randomToken, sha256 } from '../security/tokens.js'
import { badRequest, notFound } from '../lib/errors.js'
import { audit } from '../lib/audit.js'
import { nowIso, inMs, isPast, isoDate, addDays } from '../lib/time.js'

const STATE_TTL_MS = 10 * 60 * 1000

export function createProviders(ctx) {
  const { db, config, cipher } = ctx
  const http = createHttp(ctx.fetch)
  const registry = Object.fromEntries([fitbitProvider, withingsProvider, garminProvider].map(f => {
    const p = f(config, http)
    return [p.id, p]
  }))
  const locks = new Map()

  const redirectUri = id => `${config.apiUrl}/api/connections/${id}/callback`
  const webhookUrl = id => `${config.apiUrl}/api/webhooks/${id}`

  function get(id) {
    const provider = registry[id]
    if (!provider) throw notFound('Proveedor desconocido')
    return provider
  }

  function withLock(key, fn) {
    const previous = locks.get(key) ?? Promise.resolve()
    const next = previous.catch(() => {}).then(fn)
    locks.set(key, next.finally(() => { if (locks.get(key) === next) locks.delete(key) }))
    return next
  }

  function storeTokens(connectionId, tokens) {
    db.prepare(`UPDATE connections SET access_token_enc = ?, refresh_token_enc = COALESCE(?, refresh_token_enc), expires_at = ?, status = 'active', last_error = NULL WHERE id = ?`)
      .run(cipher.encrypt(tokens.accessToken), tokens.refreshToken ? cipher.encrypt(tokens.refreshToken) : null,
        tokens.expiresIn ? inMs(tokens.expiresIn * 1000) : null, connectionId)
  }

  async function freshAccessToken(connection) {
    const provider = get(connection.provider)
    const expiresSoon = connection.expires_at && new Date(connection.expires_at).getTime() - Date.now() < 60_000
    if (!expiresSoon) return cipher.decrypt(connection.access_token_enc)
    const refreshToken = cipher.decrypt(connection.refresh_token_enc)
    if (!refreshToken) throw new ProviderError('Sin refresh token', 401)
    const tokens = await provider.refresh(refreshToken)
    storeTokens(connection.id, tokens)
    return tokens.accessToken
  }

  function markFailure(connection, err) {
    const status = err.status === 401 || err.status === 403 ? 'reauth_required' : 'error'
    db.prepare('UPDATE connections SET status = ?, last_error = ? WHERE id = ?').run(status, String(err.message).slice(0, 300), connection.id)
  }

  function syncConnection(connectionId, { start, end } = {}) {
    return withLock(connectionId, async () => {
      const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId)
      if (!connection) throw notFound('Conexión no encontrada')
      const provider = get(connection.provider)
      const to = end ?? isoDate()
      const from = start ?? addDays(to, -6)
      try {
        const token = await freshAccessToken(connection)
        const days = await provider.fetchDailySteps(token, from, to)
        const results = ctx.ledger.recordMany(connection.user_id, provider.id, days)
        db.prepare('UPDATE connections SET last_sync_at = ?, status = ?, last_error = NULL WHERE id = ?').run(nowIso(), 'active', connection.id)
        return { days: days.length, credited: results.reduce((s, r) => s + (r.delta || 0), 0) }
      } catch (err) {
        markFailure(connection, err)
        throw err
      }
    })
  }

  return {
    registry,
    list(userId) {
      const rows = db.prepare('SELECT provider, status, last_sync_at, last_error, created_at FROM connections WHERE user_id = ?').all(userId)
      return Object.values(registry).map(p => {
        const row = rows.find(r => r.provider === p.id)
        return {
          id: p.id, label: p.label, available: p.configured(), connected: Boolean(row),
          status: row?.status ?? null, lastSyncAt: row?.last_sync_at ?? null, lastError: row?.last_error ?? null
        }
      })
    },

    start(userId, providerId) {
      const provider = get(providerId)
      if (!provider.configured()) throw badRequest('Este proveedor no está configurado en el servidor', 'provider_unavailable')
      const state = randomToken(32)
      const { verifier, challenge } = pkcePair()
      db.prepare('DELETE FROM oauth_states WHERE expires_at < ?').run(nowIso())
      db.prepare('INSERT INTO oauth_states (state_hash, user_id, provider, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?)')
        .run(sha256(state), userId, provider.id, cipher.encrypt(verifier), inMs(STATE_TTL_MS))
      return provider.authorizeUrl({ state, challenge, redirectUri: redirectUri(provider.id) })
    },

    async complete(providerId, { code, state }, ip) {
      const provider = get(providerId)
      const stateHash = sha256(String(state || ''))
      const row = db.prepare('SELECT * FROM oauth_states WHERE state_hash = ? AND provider = ?').get(stateHash, provider.id)
      db.prepare('DELETE FROM oauth_states WHERE state_hash = ?').run(stateHash)
      if (!row || isPast(row.expires_at) || !code) throw badRequest('Autorización inválida o caducada', 'invalid_state')
      const tokens = await provider.exchangeCode({ code, verifier: cipher.decrypt(row.code_verifier), redirectUri: redirectUri(provider.id) })
      if (tokens.externalUserId) {
        const owner = db.prepare('SELECT user_id FROM connections WHERE provider = ? AND external_user_id = ?').get(provider.id, String(tokens.externalUserId))
        if (owner && owner.user_id !== row.user_id) throw badRequest('Esta cuenta de reloj ya está vinculada a otro usuario', 'already_linked')
      }
      const id = db.prepare('SELECT id FROM connections WHERE user_id = ? AND provider = ?').get(row.user_id, provider.id)?.id ?? crypto.randomUUID()
      db.prepare(`INSERT INTO connections (id, user_id, provider, external_user_id, access_token_enc, refresh_token_enc, expires_at, scope)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (user_id, provider) DO UPDATE SET external_user_id = excluded.external_user_id, access_token_enc = excluded.access_token_enc,
        refresh_token_enc = excluded.refresh_token_enc, expires_at = excluded.expires_at, scope = excluded.scope, status = 'active', last_error = NULL`)
        .run(id, row.user_id, provider.id, tokens.externalUserId ? String(tokens.externalUserId) : null,
          cipher.encrypt(tokens.accessToken), cipher.encrypt(tokens.refreshToken), tokens.expiresIn ? inMs(tokens.expiresIn * 1000) : null, tokens.scope ?? null)
      audit(db, { userId: row.user_id, action: 'connection.linked', meta: { provider: provider.id }, ip })
      if (provider.subscribe) {
        provider.subscribe(tokens.accessToken, id, webhookUrl(provider.id)).catch(err => {
          if (config.env !== 'test') console.warn(`[providers] suscripción ${provider.id} fallida: ${err.message}`)
        })
      }
      syncConnection(id, { start: addDays(isoDate(), -6) }).catch(() => {})
      return { userId: row.user_id, provider: provider.id }
    },

    async syncForUser(userId, providerId) {
      const connection = db.prepare('SELECT id FROM connections WHERE user_id = ? AND provider = ?').get(userId, providerId)
      if (!connection) throw notFound('No tienes este proveedor conectado')
      return syncConnection(connection.id)
    },

    syncByExternalUser(providerId, externalUserId, range) {
      const connection = db.prepare('SELECT id FROM connections WHERE provider = ? AND external_user_id = ?').get(providerId, String(externalUserId))
      if (!connection) return Promise.resolve(null)
      return syncConnection(connection.id, range)
    },

    async ingestGarminCallback(externalUserId, callbackUrl) {
      const connection = db.prepare(`SELECT * FROM connections WHERE provider = 'garmin' AND external_user_id = ?`).get(String(externalUserId))
      if (!connection) return null
      return withLock(connection.id, async () => {
        try {
          const token = await freshAccessToken(connection)
          const days = await registry.garmin.fetchCallback(token, callbackUrl)
          ctx.ledger.recordMany(connection.user_id, 'garmin', days)
          db.prepare('UPDATE connections SET last_sync_at = ? WHERE id = ?').run(nowIso(), connection.id)
        } catch (err) {
          markFailure(connection, err)
        }
      })
    },

    async disconnect(userId, providerId, ip) {
      const provider = get(providerId)
      const connection = db.prepare('SELECT * FROM connections WHERE user_id = ? AND provider = ?').get(userId, provider.id)
      if (!connection) throw notFound('No tienes este proveedor conectado')
      if (provider.revoke) await provider.revoke(cipher.decrypt(connection.access_token_enc)).catch(() => {})
      db.prepare('DELETE FROM connections WHERE id = ?').run(connection.id)
      audit(db, { userId, action: 'connection.unlinked', meta: { provider: provider.id }, ip })
    }
  }
}
