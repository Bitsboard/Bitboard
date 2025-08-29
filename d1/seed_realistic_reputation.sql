-- Seed realistic reputation values for existing users
-- This gives seeded users realistic thumbs-up counts instead of just 0

-- Update users with realistic thumbs-up counts based on typical user behavior
-- We'll simulate that some users have received thumbs up from deals

-- High reputation users (verified, active sellers)
UPDATE users 
SET rating = 12 
WHERE username IN ('alice', 'bob', 'charlie', 'diana', 'emma') 
AND verified = 1;

-- Medium reputation users (regular users)
UPDATE users 
SET rating = 7 
WHERE username IN ('frank', 'grace', 'henry', 'iris', 'jack') 
AND verified = 0;

-- Good reputation users (experienced users)
UPDATE users 
SET rating = 9 
WHERE username IN ('kate', 'liam', 'maya', 'nathan', 'olivia') 
AND verified = 1;

-- Decent reputation users
UPDATE users 
SET rating = 5 
WHERE username IN ('paul', 'quinn', 'rachel', 'sam', 'taylor') 
AND verified = 0;

-- New users with some reputation
UPDATE users 
SET rating = 3 
WHERE username IN ('uma', 'victor', 'willa', 'xander', 'yara') 
AND verified = 0;

-- Very active users with high reputation
UPDATE users 
SET rating = 15 
WHERE username IN ('zoe', 'adam', 'bella', 'carlos', 'daisy') 
AND verified = 1;

-- Users with moderate reputation
UPDATE users 
SET rating = 6 
WHERE username IN ('eddie', 'fiona', 'george', 'hannah', 'ian') 
AND verified = 0;

-- Set remaining users to have at least 1 thumbs up (new users)
UPDATE users 
SET rating = 1 
WHERE rating = 0;

-- Verify the changes
SELECT 
  username,
  verified,
  rating,
  CASE 
    WHEN rating >= 10 THEN 'High Reputation'
    WHEN rating >= 5 THEN 'Good Reputation'
    WHEN rating >= 2 THEN 'Decent Reputation'
    ELSE 'New User'
  END as reputation_level
FROM users 
ORDER BY rating DESC, username
LIMIT 20;
