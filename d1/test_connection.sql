-- Simple connection test for bitsbarter staging database
-- Run this first to verify database connectivity

-- Test basic connectivity
SELECT 'Database connection successful' as status, datetime('now') as timestamp;

-- Test table access
SELECT 'Tables accessible:' as info, COUNT(*) as count FROM sqlite_master WHERE type='table';

-- Test basic queries
SELECT 'Users count:' as metric, COUNT(*) as count FROM users;
SELECT 'Listings count:' as metric, COUNT(*) as count FROM listings;

-- Test a simple join
SELECT 
  'Sample listing with user:' as info,
  l.title,
  u.username,
  l.price_sat
FROM listings l
JOIN users u ON l.posted_by = u.id
LIMIT 1;
