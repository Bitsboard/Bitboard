-- Migration 0017: Update User Rating and Add Balance
-- Changes rating field to thumbs_up count and adds balance field

PRAGMA foreign_keys = OFF;

-- Step 1: Rename rating column to thumbs_up
ALTER TABLE users RENAME COLUMN rating TO thumbs_up;

-- Step 2: Add balance column (BIGINT for satoshi amounts)
ALTER TABLE users ADD COLUMN balance BIGINT DEFAULT 0;

-- Step 3: Update thumbs_up default to 0 (thumbs up count)
UPDATE users SET thumbs_up = 0 WHERE thumbs_up IS NULL;

-- Step 4: Add constraint for thumbs_up (must be >= 0)
-- Note: SQLite doesn't support adding CHECK constraints to existing tables
-- This will be enforced at application level

-- Step 5: Add constraint for balance (must be >= 0)
-- Note: SQLite doesn't support adding CHECK constraints to existing tables
-- This will be enforced at application level

PRAGMA foreign_keys = ON;

-- Display updated schema
SELECT 'users table updated successfully' as status;
