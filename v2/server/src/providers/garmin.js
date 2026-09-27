import { ProviderError } from './http.js'
import { addDays } from '../lib/time.js'

export const GARMIN_API_HOST = 'apis.garmin.com'

export function isTrustedGarminCallback(callbackUrl) {
  try {
    const url = new URL(callbackUrl)
    return url.protocol === 'https:' && url.hostname === GARMIN_API_HOST && !url.username && !url.password && (url.port === '' || url.port === '443')
  } catch {
    return false
  }
}

function toDaily(rows) {
  const byDate = {}
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r?.calendarDate) continue
    byDate[r.calendarDate] = Math.max(byDate[r.calendarDate] ?? 0, Number(r.steps) || 0)
  }
  return Object.entries(byDate).map(([date, steps]) => ({ date, steps }))
}

export function garminProvider(config, http) {
  const { clientId, clientSecret } = config.providers.garmin
  return {
    id: 'garmin',
    label: 'Garmin',
    usesPkce: true,
    configured: () => Boolean(clientId && clientSecret),
    authorizeUrl({ state, challenge, redirectUri }) {
      const url = new URL('https://connect.garmin.com/oauth2Confirm')
      url.search = new URLSearchParams({
        response_type: 'code', client_id: clientId, redirect_uri: redirectUri, state,
        code_challenge: challenge, code_challenge_method: 'S256'
      })
      return url.toString()
    },
    async exchangeCode({ code, verifier, redirectUri }) {
      const data = await http.request('https://diauth.garmin.com/di-oauth2-service/oauth/token', {
        method: 'POST',
        form: { grant_type: 'authorization_code', client_id: clientId, client_secret: clientSecret, code, code_verifier: verifier, redirect_uri: redirectUri }
      })
      const me = await http.request(`https://${GARMIN_API_HOST}/wellness-api/rest/user/id`, { token: data.access_token })
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, externalUserId: me?.userId, scope: data.scope }
    },
    async refresh(refreshToken) {
      const data = await http.request('https://diauth.garmin.com/di-oauth2-service/oauth/token', {
        method: 'POST',
        form: { grant_type: 'refresh_token', client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken }
      })
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
    },
    async fetchDailySteps(accessToken, start, end) {
      const all = []
      for (let day = start; day <= end; day = addDays(day, 1)) {
        const from = Math.floor(new Date(`${day}T00:00:00Z`).getTime() / 1000)
        const rows = await http.request(`https://${GARMIN_API_HOST}/wellness-api/rest/dailies?uploadStartTimeInSeconds=${from}&uploadEndTimeInSeconds=${from + 86400}`, { token: accessToken })
        all.push(...(Array.isArray(rows) ? rows : []))
      }
      return toDaily(all)
    },
    async fetchCallback(accessToken, callbackUrl) {
      if (!isTrustedGarminCallback(callbackUrl)) throw new ProviderError('callbackURL de Garmin no confiable', 400)
      return toDaily(await http.request(callbackUrl, { token: accessToken }))
    }
  }
}
