-- Migration 0002: Add missing columns to existing tables
-- This migration adds new columns without breaking existing data

-- Add missing columns to listings table (with constant defaults)
ALTER TABLE listings ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE listings ADD COLUMN updated_at INTEGER DEFAULT 0;

-- Add missing columns to users table (with constant defaults)
ALTER TABLE users ADD COLUMN rating REAL DEFAULT 5.0;
ALTER TABLE users ADD COLUMN deals INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_active INTEGER DEFAULT 0;

-- Create new tables that don't exist yet
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  last_message_at INTEGER DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  read_at INTEGER,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS escrow (
  id TEXT PRIMARY KEY,
  listing_id INTEGER UNIQUE NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount_sats INTEGER NOT NULL,
  fee_sats INTEGER NOT NULL,
  hold_invoice TEXT NOT NULL,
  status TEXT DEFAULT 'PROPOSED',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  query TEXT,
  category TEXT,
  ad_type TEXT,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  radius_km INTEGER NOT NULL,
  notify INTEGER DEFAULT 1,
  last_opened INTEGER,
  created_at INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON escrow(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_location ON saved_searches(center_lat, center_lng);
