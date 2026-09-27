import crypto from 'node:crypto'
import express from 'express'
import { z } from 'zod'
import Stripe from 'stripe'
import { COSMETICS, findCosmetic, ownsCosmetic } from '@manifiest/shared'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { badRequest, conflict, HttpError } from '../lib/errors.js'
import { getProfile } from '../users/profile.js'
import { audit } from '../lib/audit.js'

export function createStripe(config) {
  return config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null
}

export function shopRoutes(ctx) {
  const router = express.Router()
  const { db, config } = ctx
  const stripe = ctx.stripe ?? createStripe(config)
  const auth = requireAuth(ctx)

  router.get('/', auth, (req, res) => {
    const level = getProfile(db, req.userId).progress.level
    const owned = db.prepare('SELECT item_id FROM entitlements WHERE user_id = ?').all(req.userId).map(r => r.item_id)
    res.json({
      paymentsEnabled: Boolean(stripe),
      items: COSMETICS.map(item => ({ ...item, owned: ownsCosmetic(item, level, owned) }))
    })
  })

  router.post('/checkout', auth, ctx.limits.write, validate(z.object({ itemId: z.string().max(40) }).strict()), async (req, res) => {
    if (!stripe) throw new HttpError(503, 'Los pagos no están activados en este servidor', 'payments_disabled')
    const item = findCosmetic(req.valid.body.itemId)
    if (!item || item.priceCents === null) throw badRequest('Este objeto no se vende', 'not_for_sale')
    if (db.prepare('SELECT 1 FROM entitlements WHERE user_id = ? AND item_id = ?').get(req.userId, item.id)) throw conflict('Ya lo tienes', 'already_owned')
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: req.userId,
      metadata: { userId: req.userId, itemId: item.id },
      line_items: [{ quantity: 1, price_data: { currency: 'eur', unit_amount: item.priceCents, product_data: { name: `Manifiest · ${item.name}` } } }],
      success_url: `${config.webUrl}/tienda?ok=${item.id}`,
      cancel_url: `${config.webUrl}/tienda`
    }, { idempotencyKey: `${req.userId}:${item.id}:${Math.floor(Date.now() / 600_000)}` })
    res.json({ url: session.url })
  })

  return router
}

export function stripeWebhook(ctx) {
  const router = express.Router()
  const { db, config } = ctx
  const stripe = ctx.stripe ?? createStripe(config)

  router.post('/', express.raw({ type: 'application/json', limit: '512kb' }), (req, res) => {
    if (!stripe || !config.stripe.webhookSecret) return res.status(404).end()
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), config.stripe.webhookSecret)
    } catch {
      return res.status(400).end()
    }
    if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
      const session = event.data.object
      const item = findCosmetic(session.metadata?.itemId)
      const userId = session.metadata?.userId
      if (item && item.priceCents !== null && session.amount_total === item.priceCents && db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) {
        db.transaction(() => {
          const inserted = db.prepare('INSERT OR IGNORE INTO payments (id, user_id, provider_ref, item_id, amount_cents, status) VALUES (?, ?, ?, ?, ?, ?)')
            .run(crypto.randomUUID(), userId, session.id, item.id, session.amount_total, 'paid').changes
          if (inserted) db.prepare(`INSERT OR IGNORE INTO entitlements (user_id, item_id, source) VALUES (?, ?, 'purchase')`).run(userId, item.id)
        })()
        audit(db, { userId, action: 'shop.purchase', meta: { itemId: item.id, session: session.id } })
      }
    }
    res.json({ received: true })
  })

  return router
}
