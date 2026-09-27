export class ProviderError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function createHttp(fetchImpl = globalThis.fetch) {
  async function request(url, { method = 'GET', headers = {}, form, json, token, basic, timeoutMs = 10_000 } = {}) {
    const finalHeaders = { Accept: 'application/json', ...headers }
    let body
    if (form) {
      body = new URLSearchParams(Object.entries(form).filter(([, v]) => v !== undefined && v !== null)).toString()
      finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
    } else if (json) {
      body = JSON.stringify(json)
      finalHeaders['Content-Type'] = 'application/json'
    }
    if (token) finalHeaders.Authorization = `Bearer ${token}`
    if (basic) finalHeaders.Authorization = `Basic ${Buffer.from(`${basic[0]}:${basic[1]}`).toString('base64')}`
    const res = await fetchImpl(url, { method, headers: finalHeaders, body, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!res.ok) throw new ProviderError(`${method} ${new URL(url).host} respondió ${res.status}`, res.status)
    return data
  }
  return { request }
}
