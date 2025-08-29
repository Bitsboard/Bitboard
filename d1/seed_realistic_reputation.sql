-- Seed realistic reputation values for existing users
-- This gives seeded users random thumbs-up counts between 1-100

-- Generate random reputation for ALL users (1-100 range)
-- Verified users get higher reputation (20-100), non-verified get lower (1-50)

-- First, let's see what users we have
SELECT username, verified, rating FROM users ORDER BY username LIMIT 10;

-- Update verified users with random high reputation (20-100)
UPDATE users 
SET rating = ABS(RANDOM() % 81) + 20
WHERE verified = 1;

-- Update non-verified users with random lower reputation (1-50)
UPDATE users 
SET rating = ABS(RANDOM() % 50) + 1
WHERE verified = 0;

-- Verify the changes
SELECT 
  username,
  verified,
  rating,
  CASE 
    WHEN rating >= 80 THEN 'Very High Reputation'
    WHEN rating >= 60 THEN 'High Reputation'
    WHEN rating >= 40 THEN 'Good Reputation'
    WHEN rating >= 20 THEN 'Decent Reputation'
    WHEN rating >= 10 THEN 'Moderate Reputation'
    ELSE 'New User'
  END as reputation_level
FROM users 
ORDER BY rating DESC, username
LIMIT 20;
