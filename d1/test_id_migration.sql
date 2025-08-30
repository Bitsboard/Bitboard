-- Test script for ID migration
-- This script tests the new ID system to ensure it works correctly

-- Test 1: Verify new table structure
PRAGMA table_info(users);
PRAGMA table_info(listings);

-- Test 2: Check ID format constraints
-- Users should have 8-character IDs
SELECT 
  id,
  length(id) as id_length,
  CASE 
    WHEN length(id) = 8 THEN 'Valid'
    ELSE 'Invalid'
  END as format_check
FROM users 
LIMIT 10;

-- Listings should have 10-character IDs
SELECT 
  id,
  length(id) as id_length,
  CASE 
    WHEN length(id) = 10 THEN 'Valid'
    ELSE 'Invalid'
  END as format_check
FROM listings 
LIMIT 10;

-- Test 3: Check for ID collisions
-- Users should have unique IDs
SELECT 
  'Users' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT id) THEN 'No collisions'
    ELSE 'COLLISIONS DETECTED'
  END as collision_check
FROM users;

-- Listings should have unique IDs
SELECT 
  'Listings' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT id) as unique_ids,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT id) THEN 'No collisions'
    ELSE 'COLLISIONS DETECTED'
  END as collision_check
FROM listings;

-- Test 4: Verify foreign key relationships
-- Check that listings.posted_by references valid user IDs
SELECT 
  'Listings posted_by' as check_type,
  COUNT(*) as total_listings,
  COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_user_references,
  COUNT(CASE WHEN u.id IS NULL THEN 1 END) as orphaned_listings
FROM listings l
LEFT JOIN users u ON l.posted_by = u.id;

-- Check that chats reference valid listings and users
SELECT 
  'Chats foreign keys' as check_type,
  COUNT(*) as total_chats,
  COUNT(CASE WHEN l.id IS NOT NULL THEN 1 END) as valid_listing_references,
  COUNT(CASE WHEN u1.id IS NOT NULL THEN 1 END) as valid_buyer_references,
  COUNT(CASE WHEN u2.id IS NOT NULL THEN 1 END) as valid_seller_references
FROM chats c
LEFT JOIN listings l ON c.listing_id = l.id
LEFT JOIN users u1 ON c.buyer_id = u1.id
LEFT JOIN users u2 ON c.seller_id = u2.id;

-- Test 5: Sample data verification
-- Show sample users with their IDs
SELECT 
  'Sample Users' as info,
  id,
  username,
  email,
  length(id) as id_length
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- Show sample listings with their IDs
SELECT 
  'Sample Listings' as info,
  id,
  title,
  posted_by,
  length(id) as id_length
FROM listings 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 6: Performance check
-- Check that indexes are working
EXPLAIN QUERY PLAN SELECT * FROM users WHERE id = 'test1234';
EXPLAIN QUERY PLAN SELECT * FROM listings WHERE id = 'test12345678';

-- Test 7: Data integrity summary
SELECT 
  'MIGRATION SUMMARY' as section,
  '' as detail;

SELECT 
  'Users Table' as table_name,
  COUNT(*) as total_records,
  MIN(length(id)) as min_id_length,
  MAX(length(id)) as max_id_length,
  COUNT(CASE WHEN length(id) = 8 THEN 1 END) as valid_format_count
FROM users;

SELECT 
  'Listings Table' as table_name,
  COUNT(*) as total_records,
  MIN(length(id)) as min_id_length,
  MAX(length(id)) as max_id_length,
  COUNT(CASE WHEN length(id) = 10 THEN 1 END) as valid_format_count
FROM listings;

SELECT 
  'Foreign Key Integrity' as check_type,
  COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as valid_user_references,
  COUNT(CASE WHEN u.id IS NULL THEN 1 END) as orphaned_references
FROM listings l
LEFT JOIN users u ON l.posted_by = u.id;
