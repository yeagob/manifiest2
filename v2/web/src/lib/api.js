const BASE = import.meta.env.VITE_API_URL ?? '/api'

let accessToken = null
let refreshing = null
const listeners = new Set()

export function onSessionChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function setToken(token) {
  accessToken = token
  listeners.forEach(fn => fn(Boolean(token)))
}

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Error ${status}`)
    this.status = status
    this.code = body?.code
  }
}

async function raw(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'X-Requested-With': 'manifiest' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include'
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export async function refreshSession() {
  refreshing ??= raw('/auth/refresh', { method: 'POST', auth: false })
    .then(data => { setToken(data.accessToken); return true })
    .catch(() => { setToken(null); return false })
    .finally(() => { refreshing = null })
  return refreshing
}

export async function request(path, options = {}) {
  try {
    return await raw(path, options)
  } catch (err) {
    if (err.status === 401 && options.auth !== false && err.code !== 'invalid_credentials' && (await refreshSession())) {
      return raw(path, options)
    }
    throw err
  }
}

export const api = {
  register: body => raw('/auth/register', { method: 'POST', body, auth: false }),
  verifyEmail: async body => setToken((await raw('/auth/verify-email', { method: 'POST', body, auth: false })).accessToken),
  resendCode: email => raw('/auth/resend-code', { method: 'POST', body: { email }, auth: false }),
  login: async body => setToken((await raw('/auth/login', { method: 'POST', body, auth: false })).accessToken),
  loginGoogle: async idToken => setToken((await raw('/auth/google', { method: 'POST', body: { idToken }, auth: false })).accessToken),
  logout: async () => { await raw('/auth/logout', { method: 'POST', auth: false }).catch(() => {}); setToken(null) },
  forgot: email => raw('/auth/password/forgot', { method: 'POST', body: { email }, auth: false }),
  reset: body => raw('/auth/password/reset', { method: 'POST', body, auth: false }),
  me: () => request('/auth/me'),
  updateMe: body => request('/users/me', { method: 'PATCH', body }),
  deleteMe: body => request('/users/me', { method: 'DELETE', body }),
  exportUrl: () => `${BASE}/users/me/export`,
  exportData: () => request('/users/me/export'),
  stepSummary: () => request('/steps/summary'),
  setPattern: pattern => request('/steps/pattern', { method: 'PUT', body: { pattern } }),
  allocateReserve: () => request('/steps/reserve/allocate', { method: 'POST' }),
  connections: () => request('/connections'),
  startConnection: provider => request(`/connections/${provider}/start`, { method: 'POST' }),
  syncConnection: provider => request(`/connections/${provider}/sync`, { method: 'POST' }),
  disconnect: provider => request(`/connections/${provider}`, { method: 'DELETE' }),
  devices: () => request('/devices'),
  pairingCode: () => request('/devices/pairing-code', { method: 'POST' }),
  revokeDevice: id => request(`/devices/${id}`, { method: 'DELETE' }),
  causes: () => request('/causes', { auth: false }),
  cause: id => request(`/causes/${id}`, { auth: false }),
  createCause: body => request('/causes', { method: 'POST', body }),
  joinCause: id => request(`/causes/${id}/join`, { method: 'POST' }),
  units: () => request('/units'),
  mint: role => request('/units/mint', { method: 'POST', body: { role } }),
  retire: id => request(`/units/${id}`, { method: 'DELETE' }),
  deploy: (unitIds, causeId) => request('/units/deploy', { method: 'POST', body: { unitIds, causeId } }),
  loadout: (id, body) => request(`/units/${id}/loadout`, { method: 'PUT', body }),
  placards: causeId => request(`/placards/cause/${causeId}`, { auth: false }),
  createPlacard: body => request('/placards', { method: 'POST', body }),
  votePlacard: id => request(`/placards/${id}/vote`, { method: 'POST' }),
  reportPlacard: id => request(`/placards/${id}/report`, { method: 'POST' }),
  world: () => request('/protests/world', { auth: false }),
  scene: causeId => request(`/protests/${causeId}/scene`),
  liveUrl: causeId => `${BASE}/protests/${causeId}/live`,
  gameState: () => request('/game/state'),
  collect: () => request('/game/collect', { method: 'POST' }),
  buyUpgrade: id => request(`/game/upgrades/${id}`, { method: 'POST' }),
  sendUnits: (causeId, role, count) => request(`/game/fronts/${causeId}/send`, { method: 'POST', body: { role, count } }),
  recallUnits: (causeId, role, count) => request(`/game/fronts/${causeId}/recall`, { method: 'POST', body: { role, count } }),
  autoDeploy: () => request('/game/auto-deploy', { method: 'POST' }),
  shop: () => request('/shop'),
  checkout: itemId => request('/shop/checkout', { method: 'POST', body: { itemId } })
}
