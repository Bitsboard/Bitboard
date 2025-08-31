-- Batch Seed Staging Database - Part 1
-- Generates users and listings in manageable chunks
-- Run with: wrangler d1 execute bitsbarter-staging --file=./d1/seed_staging_batch_1.sql

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- GENERATE 50 MORE USERS (Batch 1 of 4)
-- ============================================================================

-- Generate 50 users with realistic data
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance)
SELECT 
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) ||
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', abs(random()) % 62 + 1, 1) as id,
    'user' || (rowid + 11) || '@example.com' as email,
    'User' || (rowid + 11) as username,
    CASE (rowid % 3) WHEN 0 THEN 'google' WHEN 1 THEN 'apple' ELSE 'facebook' END as sso,
    CASE WHEN rowid < 45 THEN 1 ELSE 0 END as verified,
    0 as is_admin,
    0 as banned,
    strftime('%s','now') - (random() % 365) * 86400 as created_at,
    'https://images.unsplash.com/photo-' || (1500000000 + random() % 100000000) || '?w=150&h=150&fit=crop&crop=face' as image,
    random() % 100 as thumbs_up,
    random() % 50 as deals,
    strftime('%s','now') - (random() % 30) * 86400 as last_active,
    1 as has_chosen_username,
    random() % 10000000 as balance
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t1,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t2,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t3,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t4,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t5
WHERE rowid < 50;

-- ============================================================================
-- GENERATE 500 MORE LISTINGS (Batch 1 of 4)
-- ============================================================================

-- Generate 500 listings with realistic data
INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views)
SELECT 
    CASE (rowid % 8)
        WHEN 0 THEN 'Antminer S' || (19 + random() % 3) || ' Pro ' || (100 + random() % 50) || 'TH/s Bitcoin Miner'
        WHEN 1 THEN 'GPU Mining Rig - ' || (4 + random() % 6) || 'x RTX ' || (3060 + random() % 5 * 10)
        WHEN 2 THEN 'MacBook Pro M' || (1 + random() % 3) || ' ' || (13 + random() % 4) || '" ' || (256 + random() % 3 * 128) || 'GB'
        WHEN 3 THEN 'iPhone ' || (13 + random() % 3) || ' Pro Max ' || (128 + random() % 4 * 128) || 'GB'
        WHEN 4 THEN 'Gaming PC RTX ' || (3060 + random() % 5 * 10) || ' ' || CASE (random() % 3) WHEN 0 THEN 'Intel' WHEN 1 THEN 'AMD' ELSE 'Ryzen' END
        WHEN 5 THEN 'Web Development Services - ' || CASE (random() % 3) WHEN 0 THEN 'React' WHEN 1 THEN 'Node.js' ELSE 'Python' END
        WHEN 6 THEN 'Smart Home Security System - ' || CASE (random() % 3) WHEN 0 THEN '4K Cameras' WHEN 1 THEN 'Motion Sensors' ELSE 'Mobile App' END
        ELSE 'Garden Tools Collection - Professional Grade'
    END as title,
    'High-quality item in excellent condition. Perfect for ' || CASE (rowid % 3) WHEN 0 THEN 'beginners' WHEN 1 THEN 'professionals' ELSE 'enthusiasts' END || '. Includes all accessories and documentation.' as description,
    CASE (rowid % 7)
        WHEN 0 THEN 'Mining Gear'
        WHEN 1 THEN 'Electronics'
        WHEN 2 THEN 'Services'
        WHEN 3 THEN 'Home & Garden'
        WHEN 4 THEN 'Office'
        WHEN 5 THEN 'Sports & Outdoors'
        ELSE 'Games & Hobbies'
    END as category,
    CASE (rowid % 3) WHEN 0 THEN 'sell' WHEN 1 THEN 'want' ELSE 'sell' END as ad_type,
    CASE (rowid % 20)
        WHEN 0 THEN 'Austin, TX' WHEN 1 THEN 'Miami, FL' WHEN 2 THEN 'Denver, CO' WHEN 3 THEN 'Seattle, WA' WHEN 4 THEN 'New York, NY'
        WHEN 5 THEN 'Los Angeles, CA' WHEN 6 THEN 'San Francisco, CA' WHEN 7 THEN 'Chicago, IL' WHEN 8 THEN 'Boston, MA' WHEN 9 THEN 'Phoenix, AZ'
        WHEN 10 THEN 'Portland, OR' WHEN 11 THEN 'Nashville, TN' WHEN 12 THEN 'Las Vegas, NV' WHEN 13 THEN 'Orlando, FL' WHEN 14 THEN 'Dallas, TX'
        WHEN 15 THEN 'Houston, TX' WHEN 16 THEN 'Atlanta, GA' WHEN 17 THEN 'Philadelphia, PA' WHEN 18 THEN 'Detroit, MI' WHEN 19 THEN 'Minneapolis, MN'
    END as location,
    CASE (rowid % 20)
        WHEN 0 THEN 30.2672 WHEN 1 THEN 25.7617 WHEN 2 THEN 39.7392 WHEN 3 THEN 47.6062 WHEN 4 THEN 40.7128
        WHEN 5 THEN 34.0522 WHEN 6 THEN 37.7749 WHEN 7 THEN 41.8781 WHEN 8 THEN 42.3601 WHEN 9 THEN 33.4484
        WHEN 10 THEN 45.5152 WHEN 11 THEN 36.1627 WHEN 12 THEN 36.1699 WHEN 13 THEN 28.5383 WHEN 14 THEN 32.7767
        WHEN 15 THEN 29.7604 WHEN 16 THEN 33.7490 WHEN 17 THEN 39.9526 WHEN 18 THEN 42.3314 WHEN 19 THEN 44.9778
    END as lat,
    CASE (rowid % 20)
        WHEN 0 THEN -97.7431 WHEN 1 THEN -80.1918 WHEN 2 THEN -104.9903 WHEN 3 THEN -122.3321 WHEN 4 THEN -74.0060
        WHEN 5 THEN -118.2437 WHEN 6 THEN -122.4194 WHEN 7 THEN -87.6298 WHEN 8 THEN -71.0589 WHEN 9 THEN -112.0740
        WHEN 10 THEN -122.6784 WHEN 11 THEN -86.7816 WHEN 12 THEN -115.1398 WHEN 13 THEN -81.3792 WHEN 14 THEN -96.7970
        WHEN 15 THEN -95.3698 WHEN 16 THEN -84.3880 WHEN 17 THEN -75.1652 WHEN 18 THEN -83.0458 WHEN 19 THEN -93.2650
    END as lng,
    'https://images.unsplash.com/photo-' || (1500000000 + random() % 100000000) || '?w=400&h=300&fit=crop' as image_url,
    (100000 + random() % 10000000) as price_sat,
    CASE (rowid % 2) WHEN 0 THEN 'fixed' ELSE 'make_offer' END as pricing_type,
    (SELECT id FROM users ORDER BY random() LIMIT 1) as posted_by,
    CASE WHEN random() % 10 = 0 THEN strftime('%s','now') + (random() % 14) * 86400 ELSE NULL END as boosted_until,
    strftime('%s','now') - (random() % 90) * 86400 as created_at,
    strftime('%s','now') - (random() % 30) * 86400 as updated_at,
    CASE WHEN random() % 20 = 0 THEN 'sold' WHEN random() % 20 = 1 THEN 'expired' ELSE 'active' END as status,
    random() % 500 as views
FROM (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t1,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t2,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t3,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t4,
     (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) t5
WHERE rowid < 500;

PRAGMA foreign_keys = ON;

-- Display batch results
SELECT 'BATCH 1 COMPLETED' as status;
SELECT 'Users added: 50' as users_added;
SELECT 'Listings added: 500' as listings_added;
