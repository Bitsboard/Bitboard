-- Seed file to update existing listings to use "make offer" pricing
-- This demonstrates the new flexible pricing system

PRAGMA foreign_keys = OFF;

-- Update 100 existing listings to use "make offer" pricing
-- This creates a good mix of different types of make offer listings

-- 1. Convert all want ads with price_sat = 0 to make offer (these are perfect for negotiation)
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE ad_type = 'want' AND price_sat = 0;

-- 2. Convert unique/rare items that benefit from negotiation
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE ad_type = 'sell' 
  AND (
    title LIKE '%Art%' OR 
    title LIKE '%Collection%' OR 
    title LIKE '%Vintage%' OR
    title LIKE '%Rare%' OR
    title LIKE '%Antique%' OR
    title LIKE '%Custom%' OR
    title LIKE '%Professional%' OR
    title LIKE '%Elite%' OR
    title LIKE '%Premium%' OR
    title LIKE '%Exclusive%'
  )
  LIMIT 25
);

-- 3. Convert high-value items that could benefit from negotiation
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE ad_type = 'sell' 
  AND price_sat > 50000000  -- High value items (>500k sats)
  AND category IN ('Home & Garden', 'Electronics', 'Mining Gear')
  LIMIT 20
);

-- 4. Convert services that typically require negotiation
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Services'
  LIMIT 15
);

-- 5. Convert unique mining equipment that could benefit from negotiation
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Mining Gear'
  AND (
    title LIKE '%Container%' OR
    title LIKE '%Farm%' OR
    title LIKE '%Setup%' OR
    title LIKE '%Turnkey%' OR
    title LIKE '%Professional%'
  )
  LIMIT 15
);

-- 6. Convert luxury/unique home items
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Home & Garden'
  AND (
    title LIKE '%Mansion%' OR
    title LIKE '%Luxury%' OR
    title LIKE '%Beach House%' OR
    title LIKE '%Mountain%' OR
    title LIKE '%Cabin%' OR
    title LIKE '%Tiny House%'
  )
  LIMIT 10
);

-- 7. Convert collectible and hobby items
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Games & Hobbies'
  AND (
    title LIKE '%Collectible%' OR
    title LIKE '%Vintage%' OR
    title LIKE '%Rare%' OR
    title LIKE '%Professional%'
  )
  LIMIT 10
);

-- 8. Convert unique electronics and vehicles
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Electronics'
  AND (
    title LIKE '%Tesla%' OR
    title LIKE '%Custom%' OR
    title LIKE '%Professional%' OR
    title LIKE '%Industrial%'
  )
  LIMIT 5
);

-- Verify the changes and show breakdown
SELECT 
  'Total make offer listings after update:' as info,
  COUNT(*) as total_make_offer
FROM listings 
WHERE pricing_type = 'make_offer';

-- Show breakdown by category
SELECT 
  'Make offer listings by category:' as info;
SELECT 
  category,
  COUNT(*) as count
FROM listings 
WHERE pricing_type = 'make_offer'
GROUP BY category
ORDER BY count DESC;

-- Show breakdown by ad type
SELECT 
  'Make offer listings by ad type:' as info;
SELECT 
  ad_type,
  COUNT(*) as count
FROM listings 
WHERE pricing_type = 'make_offer'
GROUP BY ad_type;

-- Show some examples of make offer listings
SELECT 
  'Sample make offer listings:' as info;
SELECT 
  title,
  category,
  ad_type,
  pricing_type,
  price_sat,
  location
FROM listings 
WHERE pricing_type = 'make_offer'
ORDER BY RANDOM()
LIMIT 15;

-- Show the distribution of pricing types
SELECT 
  'Final pricing type distribution:' as info;
SELECT 
  pricing_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM listings), 2) as percentage
FROM listings 
GROUP BY pricing_type
ORDER BY count DESC;

PRAGMA foreign_keys = ON;
