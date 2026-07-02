const express = require('express');
const { randomUUID } = require('node:crypto');
const db = require('../db');
const { requireFanAuth } = require('../middleware/auth');
const { REACTION_TYPES, reactionSummaryForPost, reactionSummaryForComment } = require('../utils/postSerializer');

const router = express.Router();

function toggleReaction(targetType, targetId, fanId, type) {
  const existing = db.prepare('SELECT * FROM reactions WHERE target_type=? AND target_id=? AND user_id=?')
    .get(targetType, targetId, fanId);

  if (existing && existing.type === type) {
    db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
    return null;
  }
  if (existing) {
    db.prepare('UPDATE reactions SET type=?, created_at=? WHERE id=?').run(type, new Date().toISOString(), existing.id);
    return type;
  }
  db.prepare('INSERT INTO reactions (id, target_type, target_id, user_id, type, created_at) VALUES (?,?,?,?,?,?)')
    .run(randomUUID(), targetType, targetId, fanId, type, new Date().toISOString());
  return type;
}

// POST /api/posts/:postId/react  { type: 'like'|'love'|'haha'|'wow'|'sad'|'angry' }
router.post('/posts/:postId/react', requireFanAuth, (req, res) => {
  const { type } = req.body || {};
  if (!REACTION_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid reaction type.' });
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  toggleReaction('post', post.id, req.fan.id, type);
  const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(post.id);
  res.json({ reactions: reactionSummaryForPost(updatedPost, req.fan.id) });
});

// POST /api/comments/:commentId/react  { type }
router.post('/comments/:commentId/react', requireFanAuth, (req, res) => {
  const { type } = req.body || {};
  if (!REACTION_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid reaction type.' });
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  toggleReaction('comment', comment.id, req.fan.id, type);
  res.json({ reactions: reactionSummaryForComment(comment.id, req.fan.id) });
});

module.exports = router;
