-- Migration to ensure has_chosen_username field exists and is properly set
-- This migration handles both new installations and existing databases

PRAGMA foreign_keys = OFF;

-- Add has_chosen_username column if it doesn't exist
ALTER TABLE users ADD COLUMN has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1));

-- Update existing users to have chosen usernames if they have a username
UPDATE users SET has_chosen_username = 1 WHERE username IS NOT NULL AND username != '';

-- Update users without usernames to have not chosen usernames
UPDATE users SET has_chosen_username = 0 WHERE username IS NULL OR username = '';

-- Create index for the field if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_has_chosen_username ON users(has_chosen_username);

PRAGMA foreign_keys = ON;
