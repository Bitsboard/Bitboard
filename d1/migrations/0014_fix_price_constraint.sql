-- Migration: Fix price constraint for want ads
-- The current constraint price_sat > 0 is too restrictive for want ads
-- Want ads should allow price_sat >= 0 (0 means no price specified)

-- Step 1: Drop the existing constraint and views
PRAGMA foreign_keys = OFF;

-- Drop the view that references the listings table
DROP VIEW IF EXISTS listings_with_images;

-- Remove the old constraint by recreating the table without the constraint
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
  price_sat INTEGER NOT NULL CHECK (price_sat >= 0), -- Changed from > 0 to >= 0
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
SELECT * FROM listings;

-- Drop old table and rename new table
DROP TABLE listings;
ALTER TABLE listings_new RENAME TO listings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_posted_by ON listings(posted_by);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_ad_type ON listings(ad_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_sat);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(lat, lng);

-- Note: The view will be recreated by the images migration

PRAGMA foreign_keys = ON;

-- Verify the fix
SELECT 'After fixing price constraint:' as info;
SELECT 
  ad_type,
  COUNT(*) as count,
  MIN(price_sat) as min_price,
  MAX(price_sat) as max_price
FROM listings 
GROUP BY ad_type;
