-- Seed file to update existing listings to use "make offer" pricing
-- This demonstrates the new flexible pricing system

PRAGMA foreign_keys = OFF;

-- Update some existing listings to use "make offer" pricing
-- These are listings that currently have price_sat = 0 (want ads)

-- Update want ads with price_sat = 0 to use make offer pricing
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE ad_type = 'want' AND price_sat = 0;

-- Also convert some sell listings to make offer for variety
-- These are items that might benefit from negotiation
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  -- Some unique/rare items that could benefit from negotiation
  SELECT id FROM listings 
  WHERE ad_type = 'sell' 
  AND category IN ('Services', 'Home & Garden', 'Games & Hobbies')
  AND title LIKE '%Art%' OR title LIKE '%Collection%' OR title LIKE '%Vintage%'
  LIMIT 5
);

-- Update some high-value items to make offer for demonstration
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE ad_type = 'sell' 
  AND price_sat > 100000000  -- High value items (>1M sats)
  AND category IN ('Home & Garden', 'Electronics')
  LIMIT 3
);

-- Verify the changes
SELECT 
  'Updated listings to make offer:' as info,
  COUNT(*) as total_make_offer
FROM listings 
WHERE pricing_type = 'make_offer';

SELECT 
  pricing_type,
  ad_type,
  COUNT(*) as count,
  MIN(price_sat) as min_price,
  MAX(price_sat) as max_price
FROM listings 
GROUP BY pricing_type, ad_type;

-- Show some examples of make offer listings
SELECT 
  title,
  category,
  ad_type,
  pricing_type,
  price_sat,
  location
FROM listings 
WHERE pricing_type = 'make_offer'
LIMIT 10;

PRAGMA foreign_keys = ON;
