-- Final seed file to reach exactly 100 make offer listings
-- This adds 7 more strategic listings to reach our target

PRAGMA foreign_keys = OFF;

-- Add 7 more listings to reach exactly 100 make offer listings
-- Target some additional categories and types for variety

-- Convert some additional mining equipment
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Mining Gear'
  AND pricing_type = 'fixed'
  AND (
    title LIKE '%Antminer%' OR
    title LIKE '%S19%' OR
    title LIKE '%Pro%'
  )
  LIMIT 3
);

-- Convert some additional electronics
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Electronics'
  AND pricing_type = 'fixed'
  AND (
    title LIKE '%RTX%' OR
    title LIKE '%Bitcoin ATM%'
  )
  LIMIT 2
);

-- Convert some additional home & garden items
UPDATE listings 
SET 
  pricing_type = 'make_offer',
  price_sat = -1
WHERE id IN (
  SELECT id FROM listings 
  WHERE category = 'Home & Garden'
  AND pricing_type = 'fixed'
  AND (
    title LIKE '%Pool%' OR
    title LIKE '%Garden%'
  )
  LIMIT 2
);

-- Verify we now have exactly 100 make offer listings
SELECT 
  'Final count of make offer listings:' as info,
  COUNT(*) as total_make_offer
FROM listings 
WHERE pricing_type = 'make_offer';

-- Show final distribution
SELECT 
  'Final pricing type distribution:' as info;
SELECT 
  pricing_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM listings), 2) as percentage
FROM listings 
GROUP BY pricing_type
ORDER BY count DESC;

-- Show breakdown by category for make offer listings
SELECT 
  'Final make offer listings by category:' as info;
SELECT 
  category,
  COUNT(*) as count
FROM listings 
WHERE pricing_type = 'make_offer'
GROUP BY category
ORDER BY count DESC;

PRAGMA foreign_keys = ON;
