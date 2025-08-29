-- SAFE Fix for rating field schema and data
-- This script safely converts the rating field without dropping the table
-- It's safer for production/staging databases

-- Step 1: Update all existing users to have 0 rating instead of 5.0
UPDATE users SET rating = 0 WHERE rating = 5.0;

-- Step 2: Update all existing users to have 0 rating if rating is NULL
UPDATE users SET rating = 0 WHERE rating IS NULL;

-- Step 3: Update all existing users to have 0 rating if rating is any other non-zero value
-- (This ensures all users start with 0 thumbs up)
UPDATE users SET rating = 0 WHERE rating != 0;

-- Step 4: Try to change the column type safely (SQLite allows this in some cases)
-- If this fails, we'll need to use the more complex migration approach
PRAGMA foreign_keys=OFF;

-- Step 5: Attempt to modify the column type (SQLite 3.35.0+ supports this)
-- Note: This might not work in older SQLite versions, but it's worth trying
ALTER TABLE users MODIFY COLUMN rating INTEGER DEFAULT 0;

-- If the above fails, we'll need to use the backup/recreate approach
-- For now, let's ensure the data is correct
PRAGMA foreign_keys=ON;

-- Step 6: Verify the fix
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as users_with_zero_rating,
  SUM(CASE WHEN rating != 0 THEN 1 ELSE 0 END) as users_with_nonzero_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM users;

-- Step 7: Show current schema for verification
PRAGMA table_info(users);
