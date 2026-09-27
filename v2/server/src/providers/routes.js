import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { hmacBase64 } from '../security/signatures.js'
import { safeEqual } from '../security/tokens.js'
import { isTrustedGarminCallback } from './garmin.js'

export function connectionRoutes(ctx) {
  const router = express.Router()
  const auth = requireAuth(ctx)

  router.get('/', auth, (req, res) => res.json(ctx.providers.list(req.userId)))

  router.post('/:provider/start', auth, ctx.limits.write, (req, res) => {
    res.json({ authorizeUrl: ctx.providers.start(req.userId, req.params.provider) })
  })

  router.get('/:provider/callback', ctx.limits.auth, async (req, res) => {
    const target = new URL('/dispositivos', ctx.config.webUrl)
    try {
      if (req.query.error) throw new Error('denied')
      await ctx.providers.complete(req.params.provider, { code: req.query.code, state: req.query.state }, req.ip)
      target.searchParams.set('connected', req.params.provider)
    } catch (err) {
      target.searchParams.set('error', err.code === 'already_linked' ? 'already_linked' : 'link_failed')
    }
    res.redirect(303, target.toString())
  })

  router.post('/:provider/sync', auth, ctx.limits.ingest, async (req, res) => {
    res.json(await ctx.providers.syncForUser(req.userId, req.params.provider))
  })

  router.delete('/:provider', auth, async (req, res) => {
    await ctx.providers.disconnect(req.userId, req.params.provider, req.ip)
    res.status(204).end()
  })

  return router
}

export function webhookRoutes(ctx) {
  const router = express.Router()
  const { fitbit } = ctx.config.providers
  const quiet = promise => promise.catch(err => {
    if (ctx.config.env !== 'test') console.warn(`[webhook] ${err.message}`)
  })

  router.get('/fitbit', (req, res) => {
    const ok = fitbit.subscriberVerify && typeof req.query.verify === 'string' && safeEqual(req.query.verify, fitbit.subscriberVerify)
    res.status(ok ? 204 : 404).end()
  })

  router.post('/fitbit', express.raw({ type: '*/*', limit: '256kb' }), (req, res) => {
    const signature = req.get('x-fitbit-signature')
    if (!fitbit.clientSecret || !signature || !Buffer.isBuffer(req.body)) return res.status(404).end()
    const expected = hmacBase64('sha1', `${fitbit.clientSecret}&`, req.body)
    if (!safeEqual(signature, expected)) return res.status(404).end()
    let notifications
    try { notifications = JSON.parse(req.body.toString('utf8')) } catch { return res.status(400).end() }
    res.status(204).end()
    for (const n of Array.isArray(notifications) ? notifications.slice(0, 100) : []) {
      if (n?.collectionType !== 'activities' || typeof n.ownerId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(n.date)) continue
      quiet(ctx.providers.syncByExternalUser('fitbit', n.ownerId, { start: n.date, end: n.date }))
    }
  })

  router.head('/withings', (_req, res) => res.status(200).end())
  router.get('/withings', (_req, res) => res.status(200).end())
  router.post('/withings', express.urlencoded({ extended: false, limit: '16kb' }), (req, res) => {
    res.status(200).end()
    const userId = req.body?.userid
    if (typeof userId === 'string' && /^\d{1,20}$/.test(userId)) quiet(ctx.providers.syncByExternalUser('withings', userId))
  })

  router.post('/garmin', express.json({ limit: '1mb' }), (req, res) => {
    res.status(200).end()
    const pings = Array.isArray(req.body?.dailies) ? req.body.dailies.slice(0, 200) : []
    for (const ping of pings) {
      if (typeof ping?.userId !== 'string' || !isTrustedGarminCallback(ping.callbackURL)) continue
      quiet(ctx.providers.ingestGarminCallback(ping.userId, ping.callbackURL))
    }
  })

  return router
}
