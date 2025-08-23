-- Migration to add hasChosenUsername field to users table
-- This field tracks whether a user has completed username selection

PRAGMA foreign_keys = OFF;

-- Add hasChosenUsername column to users table
ALTER TABLE users ADD COLUMN has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1));

-- Update existing users to have chosen usernames (since they already have usernames)
UPDATE users SET has_chosen_username = 1 WHERE username IS NOT NULL AND username != '';

-- Create index for the new field
CREATE INDEX IF NOT EXISTS idx_users_has_chosen_username ON users(has_chosen_username);

PRAGMA foreign_keys = ON;
