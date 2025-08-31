-- Migration 0020: Fix Users Table Complete
-- Adds missing has_chosen_username column and removes old rating column

PRAGMA foreign_keys = OFF;

-- Step 1: Add has_chosen_username column if it doesn't exist
ALTER TABLE users ADD COLUMN has_chosen_username INTEGER DEFAULT 0;

-- Step 2: Remove the old rating column (it was renamed to thumbs_up in migration 0017)
ALTER TABLE users DROP COLUMN rating;

PRAGMA foreign_keys = ON;

-- Display updated schema
SELECT 'users table updated successfully' as status;
