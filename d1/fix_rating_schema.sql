-- Fix rating field schema and data for staging database
-- This script converts the rating field from REAL DEFAULT 5.0 to INTEGER DEFAULT 0
-- and updates all existing users to have 0 rating instead of 5.0

-- Step 1: Update all existing users to have 0 rating instead of 5.0
UPDATE users SET rating = 0 WHERE rating = 5.0;

-- Step 2: Update all existing users to have 0 rating if rating is NULL
UPDATE users SET rating = 0 WHERE rating IS NULL;

-- Step 3: Update all existing users to have 0 rating if rating is any other non-zero value
-- (This ensures all users start with 0 thumbs up)
UPDATE users SET rating = 0 WHERE rating != 0;

-- Step 4: Remove the old constraint and change column type
-- First, create a backup of the current table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Step 5: Drop the old table and recreate with correct schema
DROP TABLE users;

-- Step 6: Create the new table with correct rating field
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  sso TEXT NOT NULL,
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  is_admin INTEGER DEFAULT 0 CHECK (is_admin IN (0, 1)),
  banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
  created_at INTEGER NOT NULL,
  image TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0), -- INTEGER DEFAULT 0 for thumbs up count
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now'))
);

-- Step 7: Copy data back from backup
INSERT INTO users 
SELECT 
  id, 
  email, 
  username, 
  sso, 
  verified, 
  is_admin, 
  banned, 
  created_at, 
  image, 
  0 as rating, -- All users start with 0 thumbs up
  deals, 
  last_active 
FROM users_backup;

-- Step 8: Drop the backup table
DROP TABLE users_backup;

-- Step 9: Recreate necessary indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Step 10: Verify the fix
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN rating = 0 THEN 1 ELSE 0 END) as users_with_zero_rating,
  SUM(CASE WHEN rating != 0 THEN 1 ELSE 0 END) as users_with_nonzero_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM users;
