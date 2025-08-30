-- Rollback script for ID migration 0008
-- WARNING: This will restore the old ID system
-- Only use if the migration causes issues

PRAGMA foreign_keys = OFF;

-- Step 1: Create backup tables with old structure
CREATE TABLE IF NOT EXISTS users_rollback (
  id TEXT PRIMARY KEY, -- Old format: 'na-user-001'
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
  last_active INTEGER DEFAULT (strftime('%s','now')),
  has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1))
);

CREATE TABLE IF NOT EXISTS listings_rollback (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- Old format: 1, 2, 3
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted'))
);

-- Step 2: Restore original data with old ID format
-- Note: This will generate sequential IDs for listings and restore user IDs to original format
INSERT INTO users_rollback (
  id, email, username, sso, verified, is_admin, banned, created_at, image, rating, deals, last_active, has_chosen_username
)
SELECT 
  'na-user-' || printf('%03d', ROW_NUMBER() OVER (ORDER BY created_at)) as id,
  email, username, sso, verified, is_admin, banned, created_at, image, rating, deals, last_active, has_chosen_username
FROM users
ORDER BY created_at;

INSERT INTO listings_rollback (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until, created_at, updated_at, status
)
SELECT 
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until, created_at, updated_at, status
FROM listings
ORDER BY created_at;

-- Step 3: Update foreign keys in listings to use old user IDs
UPDATE listings_rollback 
SET posted_by = (
  SELECT ur.id 
  FROM users_rollback ur 
  WHERE ur.email = (
    SELECT u.email 
    FROM users u 
    WHERE u.id = listings_rollback.posted_by
  )
);

-- Step 4: Drop new tables and rename rollback tables
DROP TABLE users;
DROP TABLE listings;
DROP TABLE chats;
DROP TABLE messages;
DROP TABLE escrow;
DROP TABLE saved_searches;

ALTER TABLE users_rollback RENAME TO users;
ALTER TABLE listings_rollback RENAME TO listings;

-- Step 5: Recreate other tables with old structure
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

-- Step 6: Recreate indexes
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

-- Step 7: Re-enable foreign keys
PRAGMA foreign_keys = ON;

-- Step 8: Verify rollback
SELECT 'Rollback completed successfully' as status;
SELECT 'Users restored:' as info, COUNT(*) as count FROM users;
SELECT 'Listings restored:' as info, COUNT(*) as count FROM listings;
SELECT 'User ID format check:' as info, 
  CASE 
    WHEN id LIKE 'na-user-%' THEN 'Original format restored'
    ELSE 'Unexpected format: ' || id
  END as format_check
FROM users LIMIT 1;
