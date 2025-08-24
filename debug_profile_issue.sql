-- Debug script to investigate why users show no listings on profile page
-- when they clearly have listings on homepage

-- 1. Check if there are any listings at all
SELECT '=== BASIC LISTING COUNT ===' as section;
SELECT COUNT(*) as total_listings FROM listings;

-- 2. Check if there are any users at all
SELECT '=== BASIC USER COUNT ===' as section;
SELECT COUNT(*) as total_users FROM users;

-- 3. Check the JOIN between listings and users
SELECT '=== LISTINGS WITH USER INFO ===' as section;
SELECT 
    l.id as listing_id,
    l.title,
    l.posted_by as listing_user_id,
    u.id as user_id,
    u.username,
    l.status
FROM listings l
JOIN users u ON l.posted_by = u.id
LIMIT 10;

-- 4. Check for any orphaned listings (listings without valid users)
SELECT '=== ORPHANED LISTINGS ===' as section;
SELECT 
    l.id,
    l.title,
    l.posted_by,
    l.status
FROM listings l
LEFT JOIN users u ON l.posted_by = u.id
WHERE u.id IS NULL;

-- 5. Check for users with no listings
SELECT '=== USERS WITH NO LISTINGS ===' as section;
SELECT 
    u.id,
    u.username,
    u.created_at
FROM users u
LEFT JOIN listings l ON u.id = l.posted_by
WHERE l.id IS NULL;

-- 6. Check specific user listings (replace 'testuser' with actual username)
SELECT '=== SAMPLE USER LISTINGS ===' as section;
SELECT 
    u.username,
    COUNT(l.id) as listing_count,
    GROUP_CONCAT(l.title, ' | ') as sample_titles
FROM users u
LEFT JOIN listings l ON u.id = l.posted_by AND l.status = 'active'
GROUP BY u.id, u.username
HAVING listing_count > 0
LIMIT 5;

-- 7. Check for case sensitivity issues in usernames
SELECT '=== USERNAME CASE ANALYSIS ===' as section;
SELECT 
    username,
    LENGTH(username) as length,
    LOWER(username) as lower_case,
    UPPER(username) as upper_case
FROM users
LIMIT 10;

-- 8. Check listing status distribution
SELECT '=== LISTING STATUS DISTRIBUTION ===' as section;
SELECT 
    status,
    COUNT(*) as count
FROM listings
GROUP BY status;

-- 9. Test the exact query used in user profile API
SELECT '=== PROFILE API QUERY TEST ===' as section;
-- This simulates the query from /api/users/[username]/listings
-- Replace 'testuser' with an actual username from your data
SELECT 
    'Sample user lookup' as test,
    u.username,
    u.id,
    COUNT(l.id) as active_listings
FROM users u
LEFT JOIN listings l ON l.posted_by = u.id AND l.status = 'active'
WHERE u.username = 'testuser'  -- Replace with actual username
GROUP BY u.id, u.username;
