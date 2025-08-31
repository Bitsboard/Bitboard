-- Migration: Fix title constraint to allow more seed data
-- The current constraint is too strict and prevents seed data from loading

PRAGMA foreign_keys = OFF;

-- Create new table with more lenient constraints
CREATE TABLE listings_fixed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 500), -- More lenient
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Misc' CHECK (category IN ('Mining Gear', 'Electronics', 'Services', 'Home & Garden', 'Games & Hobbies', 'Office', 'Sports & Outdoors')),
  ad_type TEXT DEFAULT 'sell' CHECK (ad_type IN ('sell', 'want')),
  location TEXT DEFAULT '',
  lat REAL DEFAULT 0 CHECK (lat >= -90 AND lat <= 90),
  lng REAL DEFAULT 0 CHECK (lng >= -180 AND lng <= 180),
  image_url TEXT DEFAULT '',
  price_sat INTEGER NOT NULL CHECK (price_sat >= -1), -- Allow -1 for "make offer"
  pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'make_offer')),
  posted_by TEXT NOT NULL,
  boosted_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted')),
  views INTEGER DEFAULT 0,
  images_migrated INTEGER DEFAULT 0
);

-- Copy existing data
INSERT INTO listings_fixed 
SELECT * FROM listings;

-- Drop old table and rename new table
DROP TABLE listings;
ALTER TABLE listings_fixed RENAME TO listings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted_by ON listings(posted_by);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sat);
CREATE INDEX IF NOT EXISTS idx_listings_pricing_type ON listings(pricing_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);

PRAGMA foreign_keys = ON;
