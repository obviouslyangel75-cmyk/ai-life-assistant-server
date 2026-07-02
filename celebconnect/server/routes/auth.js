const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { signFanToken, signAdminToken, requireFanAuth } = require('../middleware/auth');
const { PLANS } = require('../plans');

const router = express.Router();

function publicFan(fan) {
  return {
    id: fan.id,
    name: fan.name,
    email: fan.email,
    avatar_url: fan.avatar_url,
    plan: fan.plan,
    planName: PLANS[fan.plan] ? PLANS[fan.plan].name : 'Fan',
    subscribed_at: fan.subscribed_at,
  };
}

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM fans WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const avatar = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(normalizedEmail)}`;
  db.prepare(`INSERT INTO fans (id, name, email, password_hash, avatar_url, plan, created_at)
    VALUES (?,?,?,?,?,?,?)`).run(id, name.trim(), normalizedEmail, passwordHash, avatar, 'free', new Date().toISOString());

  const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(id);
  const token = signFanToken(fan);
  res.status(201).json({ token, fan: publicFan(fan) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const fan = db.prepare('SELECT * FROM fans WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!fan || !bcrypt.compareSync(password, fan.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = signFanToken(fan);
  res.json({ token, fan: publicFan(fan) });
});

router.get('/me', requireFanAuth, (req, res) => {
  const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(req.fan.id);
  if (!fan) return res.status(404).json({ error: 'Account not found.' });
  res.json({ fan: publicFan(fan) });
});

router.post('/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }
  const token = signAdminToken(admin);
  res.json({ token, admin: { id: admin.id, email: admin.email } });
});

module.exports = { router, publicFan };
