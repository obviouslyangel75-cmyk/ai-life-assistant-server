const express = require('express');
const db = require('../db');
const { optionalFanAuth, requireFanAuth } = require('../middleware/auth');
const { formatCount } = require('../utils/format');
const { serializePost } = require('../utils/postSerializer');

const router = express.Router();

function celebDTO(c, fanId) {
  let following = false;
  if (fanId) {
    following = !!db.prepare('SELECT 1 FROM follows WHERE fan_id=? AND celebrity_id=?').get(fanId, c.id);
  }
  return {
    id: c.id,
    name: c.name,
    handle: c.handle,
    category: c.category,
    avatar_url: c.avatar_url,
    bio: c.bio,
    verified: !!c.verified,
    followers: c.followers,
    followersFormatted: formatCount(c.followers),
    following,
  };
}

// GET /api/celebrities?search=&category=
router.get('/', optionalFanAuth, (req, res) => {
  const { search, category } = req.query;
  let sql = 'SELECT * FROM celebrities WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (name LIKE ? OR handle LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY followers DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ celebrities: rows.map(c => celebDTO(c, req.fan && req.fan.id)) });
});

router.get('/:id', optionalFanAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM celebrities WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Celebrity not found.' });
  const posts = db.prepare('SELECT * FROM posts WHERE celebrity_id=? ORDER BY created_at DESC LIMIT 20').all(c.id);
  res.json({
    celebrity: celebDTO(c, req.fan && req.fan.id),
    posts: posts.map(p => serializePost(p, c, req.fan && req.fan.id)),
  });
});

router.post('/:id/follow', requireFanAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM celebrities WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Celebrity not found.' });
  const already = db.prepare('SELECT 1 FROM follows WHERE fan_id=? AND celebrity_id=?').get(req.fan.id, c.id);
  if (!already) {
    db.prepare('INSERT INTO follows (fan_id, celebrity_id, created_at) VALUES (?,?,?)')
      .run(req.fan.id, c.id, new Date().toISOString());
  }
  res.json({ following: true });
});

router.delete('/:id/follow', requireFanAuth, (req, res) => {
  db.prepare('DELETE FROM follows WHERE fan_id=? AND celebrity_id=?').run(req.fan.id, req.params.id);
  res.json({ following: false });
});

module.exports = router;
