import { ProviderError } from './http.js'

export function fitbitProvider(config, http) {
  const { clientId, clientSecret } = config.providers.fitbit
  return {
    id: 'fitbit',
    label: 'Fitbit / Pixel Watch',
    usesPkce: true,
    configured: () => Boolean(clientId && clientSecret),
    authorizeUrl({ state, challenge, redirectUri }) {
      const url = new URL('https://www.fitbit.com/oauth2/authorize')
      url.search = new URLSearchParams({
        response_type: 'code', client_id: clientId, scope: 'activity', redirect_uri: redirectUri,
        state, code_challenge: challenge, code_challenge_method: 'S256'
      })
      return url.toString()
    },
    async exchangeCode({ code, verifier, redirectUri }) {
      const data = await http.request('https://api.fitbit.com/oauth2/token', {
        method: 'POST', basic: [clientId, clientSecret],
        form: { client_id: clientId, grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirectUri }
      })
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, externalUserId: data.user_id, scope: data.scope }
    },
    async refresh(refreshToken) {
      const data = await http.request('https://api.fitbit.com/oauth2/token', {
        method: 'POST', basic: [clientId, clientSecret],
        form: { grant_type: 'refresh_token', refresh_token: refreshToken }
      })
      return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in }
    },
    async fetchDailySteps(accessToken, start, end) {
      const data = await http.request(`https://api.fitbit.com/1/user/-/activities/steps/date/${start}/${end}.json`, { token: accessToken })
      const rows = data?.['activities-steps']
      if (!Array.isArray(rows)) throw new ProviderError('Respuesta de Fitbit inesperada', 502)
      return rows.map(r => ({ date: r.dateTime, steps: Number.parseInt(r.value, 10) || 0 }))
    },
    async subscribe(accessToken, connectionId) {
      await http.request(`https://api.fitbit.com/1/user/-/activities/apiSubscriptions/${connectionId}.json`, { method: 'POST', token: accessToken })
    },
    async revoke(accessToken) {
      await http.request('https://api.fitbit.com/oauth2/revoke', { method: 'POST', basic: [clientId, clientSecret], form: { token: accessToken } })
    }
  }
}
