-- Migration: Add pricing type support for "make offer" listings
-- This allows listings to have either a fixed price or be "make offer"

PRAGMA foreign_keys = OFF;

-- Add the new pricing_type column
ALTER TABLE listings ADD COLUMN pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'make_offer'));

-- Update existing listings to have 'fixed' pricing type
UPDATE listings SET pricing_type = 'fixed' WHERE pricing_type IS NULL;

-- For listings with price_sat = 0, set them to 'make_offer' if they're want ads
UPDATE listings SET pricing_type = 'make_offer' WHERE price_sat = 0 AND ad_type = 'want';

-- Update the price constraint to allow -1 for "make offer" listings
-- We'll use -1 as a special value to indicate "make offer"
CREATE TABLE listings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
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

-- Copy data from old table to new table
INSERT INTO listings_new 
SELECT 
  id, title, description, category, ad_type, location, lat, lng, image_url, 
  CASE 
    WHEN pricing_type = 'make_offer' THEN -1 
    ELSE price_sat 
  END as price_sat,
  pricing_type,
  posted_by, boosted_until, created_at, updated_at, status, views, images_migrated
FROM listings;

-- Drop old table and rename new table
DROP TABLE listings;
ALTER TABLE listings_new RENAME TO listings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted_by ON listings(posted_by);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sat);
CREATE INDEX IF NOT EXISTS idx_listings_pricing_type ON listings(pricing_type);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);

-- Verify the migration
SELECT 'After adding pricing type support:' as info;
SELECT 
  pricing_type,
  ad_type,
  COUNT(*) as count,
  MIN(price_sat) as min_price,
  MAX(price_sat) as max_price
FROM listings 
GROUP BY pricing_type, ad_type;

PRAGMA foreign_keys = ON;
