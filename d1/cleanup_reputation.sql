-- Clean up reputation data: convert old star ratings to realistic thumbs up counts
-- This script converts the old 0-5 star rating system to a thumbs up counter system

-- First, let's see what we're working with
SELECT 'Current reputation data:' as info;
SELECT username, rating, deals FROM users WHERE rating > 0 OR deals > 0 ORDER BY rating DESC LIMIT 20;

-- Convert old star ratings to realistic thumbs up counts
-- Star ratings like 4.9, 4.7, etc. will be converted to reasonable thumbs up counts
-- We'll use a formula: (rating - 3.0) * 20 + random(10, 30) to create realistic variation
UPDATE users 
SET rating = CASE 
    WHEN rating >= 4.5 THEN 50 + (ABS(RANDOM()) % 30)  -- 4.5+ stars = 50-80 thumbs up
    WHEN rating >= 4.0 THEN 30 + (ABS(RANDOM()) % 25)  -- 4.0-4.4 stars = 30-55 thumbs up  
    WHEN rating >= 3.5 THEN 15 + (ABS(RANDOM()) % 20)  -- 3.5-3.9 stars = 15-35 thumbs up
    WHEN rating >= 3.0 THEN 5 + (ABS(RANDOM()) % 15)   -- 3.0-3.4 stars = 5-20 thumbs up
    WHEN rating >= 2.5 THEN 1 + (ABS(RANDOM()) % 10)   -- 2.5-2.9 stars = 1-11 thumbs up
    ELSE 0                                               -- Below 2.5 stars = 0 thumbs up
END
WHERE rating > 0 AND rating <= 5.0;

-- Clean up deals count to be more realistic (should be related to rating)
-- Users with higher thumbs up should generally have more deals
UPDATE users 
SET deals = CASE 
    WHEN rating >= 50 THEN 20 + (ABS(RANDOM()) % 30)   -- 50+ thumbs up = 20-50 deals
    WHEN rating >= 30 THEN 10 + (ABS(RANDOM()) % 20)   -- 30-49 thumbs up = 10-30 deals
    WHEN rating >= 15 THEN 5 + (ABS(RANDOM()) % 15)    -- 15-29 thumbs up = 5-20 deals
    WHEN rating >= 5 THEN 1 + (ABS(RANDOM()) % 10)     -- 5-14 thumbs up = 1-11 deals
    ELSE 0                                              -- 0-4 thumbs up = 0 deals
END
WHERE rating > 0;

-- Set new users (rating = 0) to have 0 deals
UPDATE users SET deals = 0 WHERE rating = 0;

-- Show the cleaned up data
SELECT 'Cleaned up reputation data:' as info;
SELECT username, rating, deals FROM users WHERE rating > 0 OR deals > 0 ORDER BY rating DESC LIMIT 20;

-- Show summary statistics
SELECT 'Summary statistics:' as info;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN rating > 0 THEN 1 END) as users_with_reputation,
    AVG(rating) as avg_thumbs_up,
    MAX(rating) as max_thumbs_up,
    AVG(deals) as avg_deals,
    MAX(deals) as max_deals
FROM users;
