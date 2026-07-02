const db = require('../db');
const { reactionSummaryForComment } = require('./postSerializer');
const { PLANS } = require('../plans');

function serializeComment(c, fanId) {
  let badge = null;
  if (c.author_id) {
    const fan = db.prepare('SELECT plan FROM fans WHERE id = ?').get(c.author_id);
    if (fan && fan.plan && fan.plan !== 'free' && PLANS[fan.plan]) badge = PLANS[fan.plan].name;
  }
  return {
    id: c.id,
    author_id: c.author_id,
    author_name: c.author_name,
    author_avatar: c.author_avatar,
    badge,
    body: c.body,
    voice_url: c.voice_url,
    voice_duration: c.voice_duration,
    created_at: c.created_at,
    reactions: reactionSummaryForComment(c.id, fanId),
  };
}

module.exports = { serializeComment };
