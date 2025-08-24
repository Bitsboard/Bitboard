-- Staging database seeding for bitsbarter
-- This file is now minimal since the database is already populated with real data
-- from the larger batch seed files

-- Note: The database now contains 100+ real users with 2400+ active listings
-- from production-quality seed data. This file serves as a reference for
-- the clean database structure.

-- Database is already clean and populated with:
-- - 100 active users (all with listings)
-- - 2400+ active listings
-- - No test users or empty profiles
-- - Production-ready data

-- To reset to this clean state, use the larger batch seed files:
-- - seed_batch_01.sql through seed_batch_24.sql
-- - seed_large_listings.sql
-- - seed_listings_north_america.sql

-- Current database state:
-- SELECT COUNT(*) as user_count FROM users; -- Returns ~100
-- SELECT COUNT(*) as listing_count FROM listings; -- Returns ~2400
-- SELECT COUNT(*) as users_with_zero_listings FROM (SELECT u.id FROM users u LEFT JOIN listings l ON u.id = l.posted_by GROUP BY u.id HAVING COUNT(l.id) = 0); -- Returns 0
