import { loadIdentity, saveIdentity, createKeys, sign, nonce } from './identity.js'
import { dailySteps, platform } from './health'

async function post(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.error ?? `Error ${res.status}`)
    err.code = data?.code
    throw err
  }
  return data
}

export function normalizeServer(url) {
  const u = new URL(url.trim())
  if (u.protocol !== 'https:' && !['localhost', '10.0.2.2', '127.0.0.1'].includes(u.hostname)) throw new Error('El servidor debe usar HTTPS')
  return u.origin
}

export async function pair({ server, code, name }) {
  const origin = normalizeServer(server)
  const keys = await createKeys()
  const { deviceId } = await post(`${origin}/api/devices/pair`, JSON.stringify({ code: code.trim().toUpperCase(), publicKey: keys.publicKey, name, platform }))
  const identity = { ...keys, deviceId, server: origin, pairedAt: new Date().toISOString() }
  await saveIdentity(identity)
  return identity
}

export async function syncNow(days = 7) {
  const identity = await loadIdentity()
  if (!identity) throw new Error('Este móvil no está emparejado')
  const rows = (await dailySteps(days)).filter(r => r.steps > 0)
  if (!rows.length) return { credited: 0 }
  const body = JSON.stringify({ deviceId: identity.deviceId, timestamp: Date.now(), nonce: nonce(), days: rows })
  const result = await post(`${identity.server}/api/devices/ingest`, body, { 'X-Device-Signature': sign(identity, body) })
  await saveIdentity({ ...identity, lastSyncAt: new Date().toISOString(), lastCredited: result.credited })
  return result
}
