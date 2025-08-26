-- Fix rating field to be thumbs up counter instead of 0-5 scale
-- Change rating from REAL to INTEGER and remove the 0-5 constraint

-- First, create a temporary table with the new schema
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
  rating INTEGER DEFAULT 0 CHECK (rating >= 0), -- Changed from REAL to INTEGER, removed 0-5 constraint
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now'))
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
  COALESCE(CAST(rating AS INTEGER), 0) as rating, -- Convert REAL to INTEGER, default to 0
  deals, 
  last_active 
FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to the original name
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes if any existed
-- (Add any specific indexes your app needs here)
