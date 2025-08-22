-- Database Audit Script for bitsbarter Staging
-- Run this after seeding to verify database integrity

-- 1. Verify table structure
SELECT '=== TABLE STRUCTURE VERIFICATION ===' as audit_section;

-- Check if all required tables exist
SELECT 'Tables found:' as info, COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('users', 'listings', 'chats', 'messages', 'escrow', 'saved_searches');

-- 2. User data verification
SELECT '=== USER DATA VERIFICATION ===' as audit_section;

-- Count total users
SELECT 'Total users:' as metric, COUNT(*) as count FROM users;

-- Check user profile completeness
SELECT 
  'Users with complete profiles:' as metric,
  COUNT(*) as count
FROM users 
WHERE email IS NOT NULL 
  AND username IS NOT NULL 
  AND created_at IS NOT NULL;

-- Check verification status distribution
SELECT 
  'Verification status:' as metric,
  verified as status,
  COUNT(*) as count
FROM users 
GROUP BY verified;

-- Check user ratings distribution
SELECT 
  'User ratings distribution:' as metric,
  CASE 
    WHEN rating >= 4.5 THEN '4.5+ (Excellent)'
    WHEN rating >= 4.0 THEN '4.0-4.4 (Good)'
    WHEN rating >= 3.5 THEN '3.5-3.9 (Average)'
    ELSE 'Below 3.5 (Poor)'
  END as rating_range,
  COUNT(*) as count
FROM users 
GROUP BY rating_range
ORDER BY MIN(rating) DESC;

-- 3. Listing data verification
SELECT '=== LISTING DATA VERIFICATION ===' as audit_section;

-- Count total listings
SELECT 'Total listings:' as metric, COUNT(*) as count FROM listings;

-- Check listing distribution by user
SELECT 
  'Listings per user:' as metric,
  posted_by as user_id,
  COUNT(*) as listing_count
FROM listings 
GROUP BY posted_by 
ORDER BY listing_count DESC;

-- Check category distribution
SELECT 
  'Category distribution:' as metric,
  category,
  COUNT(*) as count
FROM listings 
GROUP BY category 
ORDER BY count DESC;

-- Check ad type distribution
SELECT 
  'Ad type distribution:' as metric,
  ad_type,
  COUNT(*) as count
FROM listings 
GROUP BY ad_type;

-- Check price range distribution
SELECT 
  'Price distribution (sats):' as metric,
  CASE 
    WHEN price_sat < 100000 THEN 'Under 100k'
    WHEN price_sat < 500000 THEN '100k-500k'
    WHEN price_sat < 1000000 THEN '500k-1M'
    WHEN price_sat < 5000000 THEN '1M-5M'
    WHEN price_sat < 10000000 THEN '5M-10M'
    ELSE 'Over 10M'
  END as price_range,
  COUNT(*) as count
FROM listings 
GROUP BY price_range
ORDER BY MIN(price_sat);

-- 4. Foreign key relationship verification
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as audit_section;

-- Check for orphaned listings (listings without valid users)
SELECT 
  'Orphaned listings:' as metric,
  COUNT(*) as count
FROM listings l
LEFT JOIN users u ON l.posted_by = u.id
WHERE u.id IS NULL;

-- Check for users with no listings
SELECT 
  'Users with no listings:' as metric,
  COUNT(*) as count
FROM users u
LEFT JOIN listings l ON u.id = l.posted_by
WHERE l.id IS NULL;

-- 5. Data quality checks
SELECT '=== DATA QUALITY CHECKS ===' as audit_section;

-- Check for listings with missing descriptions
SELECT 
  'Listings with missing descriptions:' as metric,
  COUNT(*) as count
FROM listings 
WHERE description IS NULL OR description = '';

-- Check for listings with missing images
SELECT 
  'Listings with missing images:' as metric,
  COUNT(*) as count
FROM listings 
WHERE image_url IS NULL OR image_url = '';

-- Check for listings with invalid coordinates
SELECT 
  'Listings with invalid coordinates:' as metric,
  COUNT(*) as count
FROM listings 
WHERE lat < -90 OR lat > 90 OR lng < -180 OR lng > 180;

-- 6. Content analysis
SELECT '=== CONTENT ANALYSIS ===' as audit_section;

-- Average description length
SELECT 
  'Average description length (chars):' as metric,
  ROUND(AVG(LENGTH(description)), 0) as avg_length
FROM listings 
WHERE description IS NOT NULL AND description != '';

-- Longest descriptions
SELECT 
  'Longest descriptions:' as metric,
  title,
  LENGTH(description) as char_count
FROM listings 
WHERE description IS NOT NULL AND description != ''
ORDER BY LENGTH(description) DESC
LIMIT 5;

-- 7. Geographic distribution
SELECT '=== GEOGRAPHIC DISTRIBUTION ===' as audit_section;

-- Location distribution
SELECT 
  'Location distribution:' as metric,
  location,
  COUNT(*) as count
FROM listings 
GROUP BY location 
ORDER BY count DESC
LIMIT 10;

-- 8. Summary statistics
SELECT '=== SUMMARY STATISTICS ===' as audit_section;

-- Overall database health score
SELECT 
  'Database health score:' as metric,
  CASE 
    WHEN (SELECT COUNT(*) FROM users) >= 10 
      AND (SELECT COUNT(*) FROM listings) >= 40
      AND (SELECT COUNT(*) FROM listings l LEFT JOIN users u ON l.posted_by = u.id WHERE u.id IS NULL) = 0
    THEN 'EXCELLENT - All checks passed'
    WHEN (SELECT COUNT(*) FROM users) >= 8 
      AND (SELECT COUNT(*) FROM listings) >= 30
      AND (SELECT COUNT(*) FROM listings l LEFT JOIN users u ON l.posted_by = u.id WHERE u.id IS NULL) = 0
    THEN 'GOOD - Minor issues detected'
    WHEN (SELECT COUNT(*) FROM users) >= 5 
      AND (SELECT COUNT(*) FROM listings) >= 20
    THEN 'FAIR - Some issues detected'
    ELSE 'POOR - Significant issues detected'
  END as health_status;

-- 9. Recommendations
SELECT '=== RECOMMENDATIONS ===' as audit_section;

-- Generate recommendations based on audit results
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM users) < 10 THEN 'Add more users to increase diversity'
    WHEN (SELECT COUNT(*) FROM listings) < 40 THEN 'Add more listings to improve content'
    WHEN (SELECT COUNT(*) FROM listings l LEFT JOIN users u ON l.posted_by = u.id WHERE u.id IS NULL) > 0 THEN 'Fix orphaned listings'
    WHEN (SELECT COUNT(*) FROM listings WHERE description IS NULL OR description = '') > 0 THEN 'Add descriptions to all listings'
    ELSE 'Database is well-seeded and ready for production'
  END as recommendation;
