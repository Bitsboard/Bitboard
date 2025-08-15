-- D1 initial schema for Bitboard
-- Run with: wrangler d1 migrations apply <DB_NAME> --local (for local) or in dashboard for production

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price_sat INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);


