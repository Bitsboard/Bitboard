-- D1 initial schema for Bitboard - Production Ready
-- Run with: wrangler d1 migrations apply <DB_NAME> --local (for local) or in dashboard for production

PRAGMA foreign_keys = ON;

-- Users table with proper constraints
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  sso TEXT NOT NULL,
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  is_admin INTEGER DEFAULT 0 CHECK (is_admin IN (0, 1)),
  banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
  created_at INTEGER NOT NULL,
  image TEXT,
  rating REAL DEFAULT 5.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now'))
);

-- Listings table with proper constraints and foreign key
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Misc' CHECK (category IN ('Mining Gear', 'Electronics', 'Services', 'Home & Garden', 'Games & Hobbies', 'Office', 'Sports & Outdoors')),
  ad_type TEXT DEFAULT 'sell' CHECK (ad_type IN ('sell', 'want')),
  location TEXT DEFAULT '',
  lat REAL DEFAULT 0 CHECK (lat >= -90 AND lat <= 90),
  lng REAL DEFAULT 0 CHECK (lng >= -180 AND lng <= 180),
  image_url TEXT DEFAULT '',
  price_sat INTEGER NOT NULL CHECK (price_sat > 0),
  posted_by TEXT NOT NULL,
  boosted_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted')),
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Chats table for messaging between users
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_message_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table for chat conversations
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read_at INTEGER,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (from_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Escrow table for secure transactions
CREATE TABLE IF NOT EXISTS escrow (
  id TEXT PRIMARY KEY,
  listing_id INTEGER UNIQUE NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount_sats INTEGER NOT NULL CHECK (amount_sats > 0),
  fee_sats INTEGER NOT NULL CHECK (fee_sats >= 0),
  hold_invoice TEXT NOT NULL,
  status TEXT DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED', 'DISPUTED')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved searches for users
CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  query TEXT,
  category TEXT,
  ad_type TEXT CHECK (ad_type IN ('sell', 'want', 'all')),
  center_lat REAL NOT NULL CHECK (center_lat >= -90 AND center_lat <= 90),
  center_lng REAL NOT NULL CHECK (center_lng >= -180 AND center_lng <= 180),
  radius_km INTEGER NOT NULL CHECK (radius_km >= 0 AND radius_km <= 1000),
  notify BOOLEAN DEFAULT 1 CHECK (notify IN (0, 1)),
  last_opened INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted_by ON listings(posted_by);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sat);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

CREATE INDEX IF NOT EXISTS idx_chats_listing_id ON chats(listing_id);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_escrow_listing_id ON escrow(listing_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON escrow(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_location ON saved_searches(center_lat, center_lng);


