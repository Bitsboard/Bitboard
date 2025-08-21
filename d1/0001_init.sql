-- D1 initial schema for Bitboard
-- Run with: wrangler d1 migrations apply <DB_NAME> --local (for local) or in dashboard for production

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Misc',
  ad_type TEXT DEFAULT 'sell',
  location TEXT DEFAULT '',
  lat REAL DEFAULT 0,
  lng REAL DEFAULT 0,
  image_url TEXT DEFAULT '',
  price_sat INTEGER NOT NULL,
  posted_by TEXT DEFAULT '',
  boosted_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted_by ON listings(posted_by);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sat);

-- Users table for authentication and profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  sso TEXT,
  verified INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  banned INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  image TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);


