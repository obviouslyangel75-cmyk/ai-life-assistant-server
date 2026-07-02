const express = require('express');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { requireFanAuth } = require('../middleware/auth');
const { PLANS } = require('../plans');
const { publicFan } = require('./auth');

const router = express.Router();

const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

router.get('/plans', (req, res) => {
  res.json({ plans: Object.values(PLANS), mode: stripeEnabled() ? 'stripe' : 'mock' });
});

// POST /api/subscribe { planId }
// Mock mode (default): subscription is recorded immediately, no payment provider involved.
// Stripe mode (STRIPE_SECRET_KEY set): creates a real Checkout Session and returns a redirect URL.
router.post('/subscribe', requireFanAuth, async (req, res) => {
  const { planId } = req.body || {};
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ error: 'Unknown plan.' });

  const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(req.fan.id);

  if (planId === 'free') {
    db.prepare('UPDATE fans SET plan = ?, subscribed_at = NULL WHERE id = ?').run('free', fan.id);
    const updated = db.prepare('SELECT * FROM fans WHERE id = ?').get(fan.id);
    return res.json({ mode: 'mock', fan: publicFan(updated) });
  }

  if (stripeEnabled()) {
    // Real Stripe Checkout. Requires `npm install stripe` and a STRIPE_PRICE_* env var
    // for this plan (see .env.example). Left as a drop-in extension point.
    let Stripe;
    try {
      Stripe = require('stripe');
    } catch (e) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY is set but the `stripe` package is not installed. Run `npm install stripe` in celebconnect/.' });
    }
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const priceId = process.env[plan.stripePriceEnv];
    if (!priceId) return res.status(500).json({ error: `Missing ${plan.stripePriceEnv} env var for the ${plan.name} plan.` });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: fan.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:4000'}/?subscribed=1`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:4000'}/?subscribed=0`,
      metadata: { fanId: fan.id, planId },
    });
    return res.json({ mode: 'stripe', url: session.url });
  }

  // Mock payment success.
  const now = new Date().toISOString();
  db.prepare('UPDATE fans SET plan = ?, subscribed_at = ? WHERE id = ?').run(planId, now, fan.id);
  db.prepare(`INSERT INTO subscriptions (id, fan_id, plan, amount_cents, status, provider, created_at)
    VALUES (?,?,?,?,?,?,?)`).run(randomUUID(), fan.id, planId, Math.round(plan.price * 100), 'active', 'mock', now);

  const updated = db.prepare('SELECT * FROM fans WHERE id = ?').get(fan.id);
  res.json({ mode: 'mock', fan: publicFan(updated) });
});

router.post('/subscribe/cancel', requireFanAuth, (req, res) => {
  const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(req.fan.id);
  if (fan.plan !== 'free') {
    db.prepare(`UPDATE subscriptions SET status='canceled' WHERE fan_id=? AND plan=? AND status='active'`).run(fan.id, fan.plan);
  }
  db.prepare('UPDATE fans SET plan = ?, subscribed_at = NULL WHERE id = ?').run('free', fan.id);
  const updated = db.prepare('SELECT * FROM fans WHERE id = ?').get(fan.id);
  res.json({ fan: publicFan(updated) });
});

router.get('/subscribe/history', requireFanAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM subscriptions WHERE fan_id = ? ORDER BY created_at DESC').all(req.fan.id);
  res.json({ history: rows });
});

module.exports = router;
