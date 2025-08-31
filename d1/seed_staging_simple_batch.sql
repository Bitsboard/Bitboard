-- Simple Batch Seed Staging Database
-- Generates users and listings using simple INSERT statements
-- Run with: wrangler d1 execute bitsbarter-staging --file=./d1/seed_staging_simple_batch.sql

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- GENERATE 50 MORE USERS (Simple approach)
-- ============================================================================

-- Generate users one by one to avoid complex SQL
INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Kl3u9w2h', 'jessica.art@email.com', 'JessicaArt', 'google', 1, 0, 0, strftime('%s','now') - 86400*60, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 28, 15, strftime('%s','now') - 86400*5, 1, 750000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Lm4v0x3i', 'kevin.music@email.com', 'KevinMusic', 'apple', 1, 0, 0, strftime('%s','now') - 86400*50, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 25, 14, strftime('%s','now') - 86400*3, 1, 950000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Mn5w1y4j', 'sophia.fitness@email.com', 'SophiaFitness', 'facebook', 1, 0, 0, strftime('%s','now') - 86400*40, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 22, 12, strftime('%s','now') - 86400*2, 1, 650000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('No6x2z5k', 'brandon.tech@email.com', 'BrandonTech', 'google', 1, 0, 0, strftime('%s','now') - 86400*30, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 19, 11, strftime('%s','now') - 86400*4, 1, 1800000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Op7y3a6l', 'amanda.cooking@email.com', 'AmandaCooking', 'apple', 1, 0, 0, strftime('%s','now') - 86400*20, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 16, 9, strftime('%s','now') - 86400*1, 1, 450000);

-- ============================================================================
-- GENERATE 50 MORE LISTINGS (Simple approach)
-- ============================================================================

-- Generate listings one by one
INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('iPad Pro 12.9" M2 256GB', 'Latest iPad Pro with M2 chip. Perfect for artists and professionals.', 'Electronics', 'sell', 'Portland, OR', 45.5152, -122.6784, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 1800000, 'make_offer', 'Kl3u9w2h', NULL, strftime('%s','now') - 86400*50, strftime('%s','now') - 86400*4, 'active', 89);

INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('Sony A7 IV Camera Kit', 'Professional mirrorless camera with 33MP sensor and 4K video. Includes lenses and accessories.', 'Electronics', 'sell', 'Nashville, TN', 36.1627, -86.7816, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop', 3500000, 'fixed', 'Lm4v0x3i', NULL, strftime('%s','now') - 86400*55, strftime('%s','now') - 86400*1, 'active', 156);

INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('Graphic Design Services', 'Professional graphic design for logos, websites, and marketing materials. Fast turnaround guaranteed.', 'Services', 'sell', 'Las Vegas, NV', 36.1699, -115.1398, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop', 400000, 'make_offer', 'Mn5w1y4j', NULL, strftime('%s','now') - 86400*60, strftime('%s','now') - 86400*3, 'active', 123);

INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('Social Media Management', 'Complete social media management for businesses. Content creation, posting, and engagement.', 'Services', 'sell', 'Orlando, FL', 28.5383, -81.3792, 'https://images.unsplash.com/photo-1611162617213-9d7c0d1c0f1c?w=400&h=300&fit=crop', 350000, 'fixed', 'No6x2z5k', NULL, strftime('%s','now') - 86400*65, strftime('%s','now') - 86400*2, 'active', 98);

INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
('Office Furniture Set', 'Modern office furniture including desk, chair, and storage. Ergonomic design for productivity.', 'Office', 'sell', 'Dallas, TX', 32.7767, -96.7970, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop', 800000, 'make_offer', 'Op7y3a6l', NULL, strftime('%s','now') - 86400*70, strftime('%s','now') - 86400*1, 'active', 167);

PRAGMA foreign_keys = ON;

-- Display batch results
SELECT 'SIMPLE BATCH COMPLETED' as status;
SELECT 'Users added: 5' as users_added;
SELECT 'Listings added: 5' as listings_added;
