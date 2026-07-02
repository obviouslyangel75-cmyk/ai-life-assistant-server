const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { optionalFanAuth, requireFanAuth } = require('../middleware/auth');
const { serializeComment } = require('../utils/commentSerializer');

const router = express.Router();

const VOICE_DIR = path.join(__dirname, '..', '..', 'uploads', 'voice');
if (!fs.existsSync(VOICE_DIR)) fs.mkdirSync(VOICE_DIR, { recursive: true });

const ALLOWED_AUDIO = new Set(['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/aac']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, VOICE_DIR),
    filename: (req, file, cb) => {
      const ext = (file.originalname && path.extname(file.originalname)) || '.webm';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max voice note
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_AUDIO.has(file.mimetype)) return cb(new Error('Unsupported audio format.'));
    cb(null, true);
  },
});

// GET /api/posts/:postId/comments?page=1&limit=15
router.get('/posts/:postId/comments', optionalFanAuth, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * limit;

  const rows = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(post.id, limit, offset);
  const total = db.prepare('SELECT COUNT(*) AS c FROM comments WHERE post_id = ?').get(post.id).c;

  res.json({
    comments: rows.map(c => serializeComment(c, req.fan && req.fan.id)),
    page, limit, total,
    hasMore: offset + rows.length < total,
  });
});

// POST /api/posts/:postId/comments  { body: "text" }
router.post('/posts/:postId/comments', requireFanAuth, (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const body = (req.body && req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Comment cannot be empty.' });
  if (body.length > 2000) return res.status(400).json({ error: 'Comment is too long.' });

  const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(req.fan.id);
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO comments (id, post_id, author_id, author_name, author_avatar, body, created_at)
    VALUES (?,?,?,?,?,?,?)`).run(id, post.id, fan.id, fan.name, fan.avatar_url, body, createdAt);

  const saved = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  res.status(201).json({ comment: serializeComment(saved, fan.id) });
});

// POST /api/posts/:postId/comments/voice  (multipart: audio, duration)
router.post('/posts/:postId/comments/voice', requireFanAuth, (req, res) => {
  upload.single('audio')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Voice note upload failed.' });
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (!req.file) return res.status(400).json({ error: 'No audio file received.' });

    const fan = db.prepare('SELECT * FROM fans WHERE id = ?').get(req.fan.id);
    const duration = Math.min(120, Math.max(0, parseFloat(req.body.duration) || 0));
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const voiceUrl = `/uploads/voice/${req.file.filename}`;

    db.prepare(`INSERT INTO comments (id, post_id, author_id, author_name, author_avatar, voice_url, voice_duration, created_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(id, post.id, fan.id, fan.name, fan.avatar_url, voiceUrl, duration, createdAt);

    const saved = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    res.status(201).json({ comment: serializeComment(saved, fan.id) });
  });
});

module.exports = router;
