const express = require('express');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { requireAdminAuth } = require('../middleware/auth');
const { formatCount } = require('../utils/format');
const { PLANS } = require('../plans');

const router = express.Router();
router.use(requireAdminAuth);

router.get('/stats', (req, res) => {
  const celebrities = db.prepare('SELECT COUNT(*) AS c FROM celebrities').get().c;
  const posts = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;
  const comments = db.prepare('SELECT COUNT(*) AS c FROM comments').get().c;
  const fans = db.prepare('SELECT COUNT(*) AS c FROM fans').get().c;
  const activeSubs = db.prepare(`SELECT plan, COUNT(*) AS c FROM fans WHERE plan != 'free' GROUP BY plan`).all();
  const mrrCents = activeSubs.reduce((sum, row) => sum + (PLANS[row.plan] ? Math.round(PLANS[row.plan].price * 100) * row.c : 0), 0);
  res.json({
    celebrities, posts, comments, fans,
    activeSubscribers: activeSubs.reduce((s, r) => s + r.c, 0),
    mrr: (mrrCents / 100).toFixed(2),
  });
});

router.get('/celebrities', (req, res) => {
  const rows = db.prepare('SELECT * FROM celebrities ORDER BY name ASC').all();
  res.json({ celebrities: rows.map(c => ({ ...c, followersFormatted: formatCount(c.followers) })) });
});

router.post('/celebrities', (req, res) => {
  const { name, handle, category, bio, avatar_url, followers, verified } = req.body || {};
  if (!name || !handle || !category) return res.status(400).json({ error: 'name, handle and category are required.' });
  const cleanHandle = String(handle).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (!cleanHandle) return res.status(400).json({ error: 'Invalid handle.' });
  const exists = db.prepare('SELECT id FROM celebrities WHERE handle = ?').get(cleanHandle);
  if (exists) return res.status(409).json({ error: 'Handle already in use.' });

  const id = randomUUID();
  db.prepare(`INSERT INTO celebrities (id, name, handle, category, avatar_url, cover_url, bio, verified, followers, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    id, name.trim(), cleanHandle, category,
    avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(cleanHandle)}`,
    '', bio || '', verified === false ? 0 : 1, Math.max(0, parseInt(followers, 10) || 0),
    new Date().toISOString()
  );
  res.status(201).json({ celebrity: db.prepare('SELECT * FROM celebrities WHERE id = ?').get(id) });
});

router.put('/celebrities/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM celebrities WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Celebrity not found.' });

  const fields = ['name', 'category', 'avatar_url', 'cover_url', 'bio', 'followers', 'verified'];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }
  if (updates.followers !== undefined) updates.followers = Math.max(0, parseInt(updates.followers, 10) || 0);
  if (updates.verified !== undefined) updates.verified = updates.verified ? 1 : 0;

  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'No fields to update.' });
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE celebrities SET ${setClause} WHERE id = ?`).run(...keys.map(k => updates[k]), c.id);
  res.json({ celebrity: db.prepare('SELECT * FROM celebrities WHERE id = ?').get(c.id) });
});

router.delete('/celebrities/:id', (req, res) => {
  const result = db.prepare('DELETE FROM celebrities WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Celebrity not found.' });
  res.json({ ok: true });
});

router.get('/celebrities/:id/posts', (req, res) => {
  const rows = db.prepare('SELECT * FROM posts WHERE celebrity_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ posts: rows });
});

router.post('/celebrities/:id/posts', (req, res) => {
  const c = db.prepare('SELECT * FROM celebrities WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Celebrity not found.' });
  const content = (req.body && req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Post content is required.' });

  const id = randomUUID();
  db.prepare(`INSERT INTO posts (id, celebrity_id, content, image_url, created_at)
    VALUES (?,?,?,?,?)`).run(id, c.id, content, (req.body.image_url || null), new Date().toISOString());
  res.status(201).json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(id) });
});

router.delete('/posts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Post not found.' });
  res.json({ ok: true });
});

module.exports = router;
