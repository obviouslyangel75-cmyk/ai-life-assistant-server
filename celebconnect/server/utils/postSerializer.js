const db = require('../db');
const { formatCount } = require('./format');

const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const REACTION_EMOJI = { like: '👍', love: '❤️', haha: '😆', wow: '😮', sad: '😢', angry: '😡' };
const REACTION_LABEL = { like: 'Like', love: 'Love', haha: 'Haha (LOL)', wow: 'Wow', sad: 'Sad', angry: 'Angry' };

function reactionSummaryForPost(post, fanId) {
  const rows = db.prepare(`SELECT type, COUNT(*) AS c FROM reactions WHERE target_type='post' AND target_id=? GROUP BY type`).all(post.id);
  const counts = {};
  for (const t of REACTION_TYPES) counts[t] = post['seed_' + t] || 0;
  for (const r of rows) counts[r.type] = (counts[r.type] || 0) + r.c;
  const total = REACTION_TYPES.reduce((s, t) => s + counts[t], 0);
  const top = REACTION_TYPES.filter(t => counts[t] > 0).sort((a, b) => counts[b] - counts[a]).slice(0, 3);

  let myReaction = null;
  if (fanId) {
    const mine = db.prepare(`SELECT type FROM reactions WHERE target_type='post' AND target_id=? AND user_id=?`).get(post.id, fanId);
    if (mine) myReaction = mine.type;
  }
  return { counts, total, totalFormatted: formatCount(total), top, myReaction };
}

function reactionSummaryForComment(commentId, fanId) {
  const rows = db.prepare(`SELECT type, COUNT(*) AS c FROM reactions WHERE target_type='comment' AND target_id=? GROUP BY type`).all(commentId);
  const counts = {};
  for (const t of REACTION_TYPES) counts[t] = 0;
  for (const r of rows) counts[r.type] = r.c;
  const total = REACTION_TYPES.reduce((s, t) => s + counts[t], 0);
  let myReaction = null;
  if (fanId) {
    const mine = db.prepare(`SELECT type FROM reactions WHERE target_type='comment' AND target_id=? AND user_id=?`).get(commentId, fanId);
    if (mine) myReaction = mine.type;
  }
  return { counts, total, totalFormatted: formatCount(total), myReaction };
}

function serializePost(post, celeb, fanId) {
  const commentCount = db.prepare('SELECT COUNT(*) AS c FROM comments WHERE post_id=?').get(post.id).c;
  return {
    id: post.id,
    content: post.content,
    image_url: post.image_url,
    created_at: post.created_at,
    celebrity: {
      id: celeb.id,
      name: celeb.name,
      handle: celeb.handle,
      avatar_url: celeb.avatar_url,
      verified: !!celeb.verified,
      followers: celeb.followers,
      followersFormatted: formatCount(celeb.followers),
      category: celeb.category,
    },
    reactions: reactionSummaryForPost(post, fanId),
    commentCount,
    commentCountFormatted: formatCount(commentCount),
  };
}

module.exports = {
  REACTION_TYPES, REACTION_EMOJI, REACTION_LABEL,
  reactionSummaryForPost, reactionSummaryForComment, serializePost,
};
