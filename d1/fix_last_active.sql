-- Fix last_active timestamps to be in the past
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=./d1/fix_last_active.sql

-- Update all users to have last_active timestamps in the past year
UPDATE users SET last_active = strftime('%s','now') - (random() % 31536000) WHERE last_active > strftime('%s','now');

-- Display results
SELECT 'LAST_ACTIVE TIMESTAMPS FIXED' as status;
SELECT COUNT(*) as users_updated FROM users WHERE last_active < strftime('%s','now');
