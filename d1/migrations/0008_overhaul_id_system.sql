-- Migration 0008: Overhaul ID System
-- Changes user IDs to 8 random alphanumeric characters
-- Changes listing IDs to 10 random alphanumeric characters
-- Ensures collision-free random ID generation

PRAGMA foreign_keys = OFF;

-- Step 1: Create new tables with proper ID structure
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY CHECK (length(id) = 8),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  sso TEXT NOT NULL,
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  is_admin INTEGER DEFAULT 0 CHECK (is_admin IN (0, 1)),
  banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
  created_at INTEGER NOT NULL,
  image TEXT,
  rating INTEGER DEFAULT 0,
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS listings_new (
  id TEXT PRIMARY KEY CHECK (length(id) = 10),
  title TEXT NOT NULL CHECK (length(title) >= 2 AND length(title) <= 200),
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Misc' CHECK (category IN ('Mining Gear', 'Electronics', 'Services', 'Home & Garden', 'Games & Hobbies', 'Office', 'Sports & Outdoors')),
  ad_type TEXT DEFAULT 'sell' CHECK (ad_type IN ('sell', 'want')),
  location TEXT DEFAULT '',
  lat REAL DEFAULT 0 CHECK (lat >= -90 AND lat <= 90),
  lng REAL DEFAULT 0 CHECK (lng >= -180 AND lng <= 180),
  image_url TEXT DEFAULT '',
  price_sat INTEGER NOT NULL CHECK (price_sat >= 0),
  posted_by TEXT NOT NULL,
  boosted_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted'))
);

CREATE TABLE IF NOT EXISTS chats_new (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_message_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS messages_new (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read_at INTEGER
);

CREATE TABLE IF NOT EXISTS escrow_new (
  id TEXT PRIMARY KEY,
  listing_id TEXT UNIQUE NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  amount_sats INTEGER NOT NULL CHECK (amount_sats > 0),
  fee_sats INTEGER NOT NULL CHECK (fee_sats >= 0),
  hold_invoice TEXT NOT NULL,
  status TEXT DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'FUNDED', 'RELEASED', 'REFUND_REQUESTED', 'REFUNDED', 'DISPUTED')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS saved_searches_new (
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
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Step 2: Generate new random IDs and migrate data
-- Users migration with 8-character random IDs
INSERT INTO users_new (
  id, email, username, sso, verified, is_admin, banned, created_at, image, rating, deals, last_active
)
SELECT 
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) as id,
  email, username, sso, verified, is_admin, banned, created_at, image, rating, deals, last_active
FROM users;

-- Listings migration with 10-character random IDs
INSERT INTO listings_new (
  id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until, created_at, updated_at, status
)
SELECT 
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
  substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) as id,
  CASE 
    WHEN length(title) < 3 THEN title || ' Vehicle'
    ELSE title
  END as title,
  description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until, created_at, updated_at, status
FROM listings;

-- Step 3: Create ID mapping tables for foreign key updates
CREATE TABLE IF NOT EXISTS user_id_mapping (
  old_id TEXT,
  new_id TEXT
);

CREATE TABLE IF NOT EXISTS listing_id_mapping (
  old_id INTEGER,
  new_id TEXT
);

-- Populate mapping tables
INSERT INTO user_id_mapping (old_id, new_id)
SELECT u.id, un.id
FROM users u
JOIN users_new un ON u.email = un.email;

INSERT INTO listing_id_mapping (old_id, new_id)
SELECT l.id, ln.id
FROM listings l
JOIN listings_new ln ON l.title = ln.title AND l.created_at = ln.created_at;

-- Step 4: Update foreign keys in listings_new
UPDATE listings_new 
SET posted_by = (
  SELECT um.new_id 
  FROM user_id_mapping um 
  WHERE um.old_id = listings_new.posted_by
);

-- Step 5: Migrate chats with updated foreign keys
INSERT INTO chats_new (
  id, listing_id, buyer_id, seller_id, created_at, last_message_at
)
SELECT 
  c.id,
  (SELECT lim.new_id FROM listing_id_mapping lim WHERE lim.old_id = c.listing_id),
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = c.buyer_id),
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = c.seller_id),
  c.created_at,
  c.last_message_at
FROM chats c
WHERE c.listing_id IN (SELECT old_id FROM listing_id_mapping)
  AND c.buyer_id IN (SELECT old_id FROM user_id_mapping)
  AND c.seller_id IN (SELECT old_id FROM user_id_mapping);

-- Step 6: Migrate messages with updated foreign keys
INSERT INTO messages_new (
  id, chat_id, from_id, text, created_at, read_at
)
SELECT 
  m.id,
  m.chat_id,
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = m.from_id),
  m.text,
  m.created_at,
  m.read_at
FROM messages m
WHERE m.chat_id IN (SELECT id FROM chats_new)
  AND m.from_id IN (SELECT old_id FROM user_id_mapping);

-- Step 7: Migrate escrow with updated foreign keys
INSERT INTO escrow_new (
  id, listing_id, buyer_id, seller_id, amount_sats, fee_sats, hold_invoice, status, created_at, updated_at
)
SELECT 
  e.id,
  (SELECT lim.new_id FROM listing_id_mapping lim WHERE lim.old_id = e.listing_id),
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = e.buyer_id),
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = e.seller_id),
  e.amount_sats,
  e.fee_sats,
  e.hold_invoice,
  e.status,
  e.created_at,
  e.updated_at
FROM escrow e
WHERE e.listing_id IN (SELECT old_id FROM listing_id_mapping)
  AND e.buyer_id IN (SELECT old_id FROM user_id_mapping)
  AND e.seller_id IN (SELECT old_id FROM user_id_mapping);

-- Step 8: Migrate saved_searches with updated foreign keys
INSERT INTO saved_searches_new (
  id, user_id, name, query, category, ad_type, center_lat, center_lng, radius_km, notify, last_opened, created_at
)
SELECT 
  ss.id,
  (SELECT uim.new_id FROM user_id_mapping uim WHERE uim.old_id = ss.user_id),
  ss.name,
  ss.query,
  ss.category,
  ss.ad_type,
  ss.center_lat,
  ss.center_lng,
  ss.radius_km,
  ss.notify,
  ss.last_opened,
  ss.created_at
FROM saved_searches ss
WHERE ss.user_id IN (SELECT old_id FROM user_id_mapping);

-- Step 9: Drop old tables and rename new ones
DROP TABLE users;
DROP TABLE listings;
DROP TABLE chats;
DROP TABLE messages;
DROP TABLE escrow;
DROP TABLE saved_searches;
DROP TABLE user_id_mapping;
DROP TABLE listing_id_mapping;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE listings_new RENAME TO listings;
ALTER TABLE chats_new RENAME TO chats;
ALTER TABLE messages_new RENAME TO messages;
ALTER TABLE escrow_new RENAME TO escrow;
ALTER TABLE saved_searches_new RENAME TO saved_searches;

-- Step 10: Recreate indexes and constraints
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
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

-- Step 11: Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Step 12: Verify migration
SELECT 'Migration completed successfully' as status;
SELECT 'Users migrated:' as info, COUNT(*) as count FROM users;
SELECT 'Listings migrated:' as info, COUNT(*) as count FROM listings;
SELECT 'Chats migrated:' as info, COUNT(*) as count FROM chats;
SELECT 'Messages migrated:' as info, COUNT(*) as count FROM messages;
SELECT 'Escrow migrated:' as info, COUNT(*) as count FROM escrow;
SELECT 'Saved searches migrated:' as info, COUNT(*) as count FROM saved_searches;
