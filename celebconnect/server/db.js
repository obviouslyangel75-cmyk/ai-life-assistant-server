const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'celebconnect.sqlite');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS celebrities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  cover_url TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  verified INTEGER NOT NULL DEFAULT 1,
  followers INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  celebrity_id TEXT NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT NOT NULL,
  -- Baseline "seed" reaction counts representing the celebrity's existing
  -- audience engagement (avoids materializing millions of reaction rows).
  -- Real reactions from logged-in fans are added on top of these at read time.
  seed_like INTEGER NOT NULL DEFAULT 0,
  seed_love INTEGER NOT NULL DEFAULT 0,
  seed_haha INTEGER NOT NULL DEFAULT 0,
  seed_wow INTEGER NOT NULL DEFAULT 0,
  seed_sad INTEGER NOT NULL DEFAULT 0,
  seed_angry INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_celeb ON posts(celebrity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  body TEXT,
  voice_url TEXT,
  voice_duration REAL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS reactions (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK(target_type IN ('post','comment')),
  target_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('like','love','haha','wow','sad','angry')),
  created_at TEXT NOT NULL,
  UNIQUE(target_type, target_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);

CREATE TABLE IF NOT EXISTS fans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  subscribed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
  fan_id TEXT NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  celebrity_id TEXT NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (fan_id, celebrity_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  fan_id TEXT NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  provider TEXT NOT NULL DEFAULT 'mock',
  provider_ref TEXT,
  created_at TEXT NOT NULL
);
`);

module.exports = db;
