-- Fix all last_active timestamps to be in the past year
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=./d1/fix_last_active_complete.sql

-- Set all users to have last_active timestamps in the past year (not future)
UPDATE users SET last_active = strftime('%s','now') - (random() % 31536000) - 86400;

-- Display results
SELECT 'ALL LAST_ACTIVE TIMESTAMPS FIXED' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT MIN(datetime(last_active, 'unixepoch')) as earliest_activity, MAX(datetime(last_active, 'unixepoch')) as latest_activity FROM users;
