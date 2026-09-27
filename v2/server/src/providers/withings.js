import { ProviderError } from './http.js'

const API = 'https://wbsapi.withings.net'

function unwrap(data) {
  if (!data || data.status !== 0) throw new ProviderError(`Withings devolvió estado ${data?.status}`, data?.status === 401 ? 401 : 502)
  return data.body
}

export function withingsProvider(config, http) {
  const { clientId, clientSecret } = config.providers.withings
  return {
    id: 'withings',
    label: 'Withings ScanWatch',
    usesPkce: false,
    configured: () => Boolean(clientId && clientSecret),
    authorizeUrl({ state, redirectUri }) {
      const url = new URL('https://account.withings.com/oauth2_user/authorize2')
      url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, scope: 'user.activity', redirect_uri: redirectUri, state })
      return url.toString()
    },
    async exchangeCode({ code, redirectUri }) {
      const body = unwrap(await http.request(`${API}/v2/oauth2`, {
        method: 'POST',
        form: { action: 'requesttoken', grant_type: 'authorization_code', client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }
      }))
      return { accessToken: body.access_token, refreshToken: body.refresh_token, expiresIn: body.expires_in, externalUserId: String(body.userid), scope: body.scope }
    },
    async refresh(refreshToken) {
      const body = unwrap(await http.request(`${API}/v2/oauth2`, {
        method: 'POST',
        form: { action: 'requesttoken', grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }
      }))
      return { accessToken: body.access_token, refreshToken: body.refresh_token, expiresIn: body.expires_in }
    },
    async fetchDailySteps(accessToken, start, end) {
      const body = unwrap(await http.request(`${API}/v2/measure`, {
        method: 'POST', token: accessToken,
        form: { action: 'getactivity', startdateymd: start, enddateymd: end, data_fields: 'steps' }
      }))
      return (body.activities || []).map(a => ({ date: a.date, steps: Number(a.steps) || 0 }))
    },
    async subscribe(accessToken, _connectionId, callbackUrl) {
      unwrap(await http.request(`${API}/notify`, { method: 'POST', token: accessToken, form: { action: 'subscribe', callbackurl: callbackUrl, appli: 16 } }))
    }
  }
}
