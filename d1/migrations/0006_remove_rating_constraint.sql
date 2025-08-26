-- Remove the old rating constraint that limits rating to 0-5 scale
-- This allows us to set proper thumbs up counts (like 50, 75, etc.)

-- First, create a new table without the constraint
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  sso TEXT NOT NULL,
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  is_admin INTEGER DEFAULT 0 CHECK (is_admin IN (0, 1)),
  banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
  created_at INTEGER NOT NULL,
  image TEXT,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0), -- Removed the 0-5 constraint
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now')),
  has_chosen_username INTEGER DEFAULT 0 CHECK (has_chosen_username IN (0, 1))
);

-- Copy data from old table to new table
INSERT INTO users_new 
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
  rating, -- Keep existing rating values for now
  deals, 
  last_active,
  has_chosen_username
FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to the original name
ALTER TABLE users_new RENAME TO users;
