-- Fix the posted_by field mapping between listings and users
-- The listings table has posted_by values like "na-user-002" but users table has UUIDs
-- We need to map these correctly

-- First, let's see what we're working with
SELECT 'Current state:' as info;
SELECT 
  'Listings count:' as label,
  COUNT(*) as count
FROM listings;

SELECT 
  'Users count:' as label,
  COUNT(*) as count
FROM users;

SELECT 
  'Sample posted_by values:' as label,
  posted_by,
  COUNT(*) as count
FROM listings 
GROUP BY posted_by 
LIMIT 10;

-- Create a mapping table to convert na-user-XXX to actual user IDs
-- We'll assign listings to users in a round-robin fashion
WITH user_mapping AS (
  SELECT 
    ROW_NUMBER() OVER (ORDER BY id) as user_num,
    id as user_id,
    username
  FROM users
),
listing_mapping AS (
  SELECT 
    id as listing_id,
    posted_by,
    CASE 
      WHEN posted_by = 'na-user-002' THEN (SELECT user_id FROM user_mapping WHERE user_num = 1)
      WHEN posted_by = 'na-user-003' THEN (SELECT user_id FROM user_mapping WHERE user_num = 2)
      WHEN posted_by = 'na-user-004' THEN (SELECT user_id FROM user_mapping WHERE user_num = 3)
      WHEN posted_by = 'na-user-005' THEN (SELECT user_id FROM user_mapping WHERE user_num = 4)
      WHEN posted_by = 'na-user-006' THEN (SELECT user_id FROM user_mapping WHERE user_num = 5)
      WHEN posted_by = 'na-user-007' THEN (SELECT user_id FROM user_mapping WHERE user_num = 6)
      WHEN posted_by = 'na-user-008' THEN (SELECT user_id FROM user_mapping WHERE user_num = 7)
      WHEN posted_by = 'na-user-009' THEN (SELECT user_id FROM user_mapping WHERE user_num = 8)
      WHEN posted_by = 'na-user-010' THEN (SELECT user_id FROM user_mapping WHERE user_num = 1)
      WHEN posted_by = 'na-user-011' THEN (SELECT user_id FROM user_mapping WHERE user_num = 2)
      WHEN posted_by = 'na-user-012' THEN (SELECT user_id FROM user_mapping WHERE user_num = 3)
      WHEN posted_by = 'na-user-013' THEN (SELECT user_id FROM user_mapping WHERE user_num = 4)
      WHEN posted_by = 'na-user-014' THEN (SELECT user_id FROM user_mapping WHERE user_num = 5)
      WHEN posted_by = 'na-user-015' THEN (SELECT user_id FROM user_mapping WHERE user_num = 6)
      WHEN posted_by = 'na-user-016' THEN (SELECT user_id FROM user_mapping WHERE user_num = 7)
      WHEN posted_by = 'na-user-017' THEN (SELECT user_id FROM user_mapping WHERE user_num = 8)
      WHEN posted_by = 'na-user-018' THEN (SELECT user_id FROM user_mapping WHERE user_num = 1)
      WHEN posted_by = 'na-user-019' THEN (SELECT user_id FROM user_mapping WHERE user_num = 2)
      WHEN posted_by = 'na-user-020' THEN (SELECT user_id FROM user_mapping WHERE user_num = 3)
      ELSE (SELECT user_id FROM user_mapping WHERE user_num = 1) -- Default fallback
    END as new_posted_by
  FROM listings
)
SELECT 
  'Mapping preview:' as info,
  COUNT(*) as total_listings,
  COUNT(CASE WHEN new_posted_by IS NOT NULL THEN 1 END) as mapped_listings,
  COUNT(CASE WHEN new_posted_by IS NULL THEN 1 END) as unmapped_listings
FROM listing_mapping;

-- Now update the listings table with the correct user IDs
UPDATE listings 
SET posted_by = CASE 
  WHEN posted_by = 'na-user-002' THEN (SELECT id FROM users WHERE username = 'satoshi')
  WHEN posted_by = 'na-user-003' THEN (SELECT id FROM users WHERE username = 'luna')
  WHEN posted_by = 'na-user-004' THEN (SELECT id FROM users WHERE username = 'arya')
  WHEN posted_by = 'na-user-005' THEN (SELECT id FROM users WHERE username = 'nova')
  WHEN posted_by = 'na-user-006' THEN (SELECT id FROM users WHERE username = 'kai')
  WHEN posted_by = 'na-user-007' THEN (SELECT id FROM users WHERE username = 'zen')
  WHEN posted_by = 'na-user-008' THEN (SELECT id FROM users WHERE username = 'olivia')
  WHEN posted_by = 'na-user-009' THEN (SELECT id FROM users WHERE username = 'noah')
  WHEN posted_by = 'na-user-010' THEN (SELECT id FROM users WHERE username = 'satoshi')
  WHEN posted_by = 'na-user-011' THEN (SELECT id FROM users WHERE username = 'luna')
  WHEN posted_by = 'na-user-012' THEN (SELECT id FROM users WHERE username = 'arya')
  WHEN posted_by = 'na-user-013' THEN (SELECT id FROM users WHERE username = 'nova')
  WHEN posted_by = 'na-user-014' THEN (SELECT id FROM users WHERE username = 'kai')
  WHEN posted_by = 'na-user-015' THEN (SELECT id FROM users WHERE username = 'zen')
  WHEN posted_by = 'na-user-016' THEN (SELECT id FROM users WHERE username = 'olivia')
  WHEN posted_by = 'na-user-017' THEN (SELECT id FROM users WHERE username = 'noah')
  WHEN posted_by = 'na-user-018' THEN (SELECT id FROM users WHERE username = 'satoshi')
  WHEN posted_by = 'na-user-019' THEN (SELECT id FROM users WHERE username = 'luna')
  WHEN posted_by = 'na-user-020' THEN (SELECT id FROM users WHERE username = 'arya')
  ELSE (SELECT id FROM users WHERE username = 'satoshi') -- Default fallback
END
WHERE posted_by LIKE 'na-user-%';

-- Verify the fix
SELECT 'After fix:' as info;
SELECT 
  'JOIN test:' as label,
  COUNT(*) as joined_count
FROM listings l 
JOIN users u ON l.posted_by = u.id;

SELECT 
  'Sample fixed listings:' as label,
  l.id,
  l.title,
  l.posted_by,
  u.username
FROM listings l 
JOIN users u ON l.posted_by = u.id
LIMIT 5;
