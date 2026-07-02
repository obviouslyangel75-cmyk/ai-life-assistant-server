const express = require('express');
const db = require('../db');
const { optionalFanAuth } = require('../middleware/auth');
const { serializePost } = require('../utils/postSerializer');

const router = express.Router();

// GET /api/feed?page=1&limit=10
router.get('/', optionalFanAuth, (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * limit;

  const rows = db.prepare(`
    SELECT posts.*, celebrities.id as c_id, celebrities.name as c_name, celebrities.handle as c_handle,
           celebrities.avatar_url as c_avatar_url, celebrities.verified as c_verified,
           celebrities.followers as c_followers, celebrities.category as c_category
    FROM posts JOIN celebrities ON posts.celebrity_id = celebrities.id
    ORDER BY posts.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) AS c FROM posts').get().c;

  const posts = rows.map(row => {
    const post = { id: row.id, celebrity_id: row.celebrity_id, content: row.content, image_url: row.image_url,
      created_at: row.created_at, seed_like: row.seed_like, seed_love: row.seed_love, seed_haha: row.seed_haha,
      seed_wow: row.seed_wow, seed_sad: row.seed_sad, seed_angry: row.seed_angry };
    const celeb = { id: row.c_id, name: row.c_name, handle: row.c_handle, avatar_url: row.c_avatar_url,
      verified: row.c_verified, followers: row.c_followers, category: row.c_category };
    return serializePost(post, celeb, req.fan && req.fan.id);
  });

  res.json({ posts, page, limit, total, hasMore: offset + rows.length < total });
});

module.exports = router;
