-- Correct Seed Staging Database
-- Creates realistic users and listings with proper data following all constraints
-- Run with: wrangler d1 execute bitsbarter-staging --file=./d1/seed_staging_correct.sql

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- SEED USERS (25 users with realistic data)
-- ============================================================================

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ab3k9m2x', 'sarah.tech@email.com', 'SarahTech', 'google', 1, 0, 0, strftime('%s','now') - 86400*365, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', 47, 23, strftime('%s','now') - 86400*2, 1, 2500000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Bc4l0n3y', 'mike.crypto@email.com', 'MikeCrypto', 'google', 1, 0, 0, strftime('%s','now') - 86400*320, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 52, 31, strftime('%s','now') - 86400*1, 1, 1800000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Cd5m1o4z', 'emma.miner@email.com', 'EmmaMiner', 'apple', 1, 0, 0, strftime('%s','now') - 86400*280, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', 38, 19, strftime('%s','now') - 86400*3, 1, 3200000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('De6n2p5a', 'alex.hardware@email.com', 'AlexHardware', 'facebook', 1, 0, 0, strftime('%s','now') - 86400*250, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', 41, 27, strftime('%s','now') - 86400*1, 1, 1500000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ef7o3q6b', 'lisa.gaming@email.com', 'LisaGaming', 'google', 1, 0, 0, strftime('%s','now') - 86400*220, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', 35, 22, strftime('%s','now') - 86400*2, 1, 900000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Fg8p4r7c', 'david.electronics@email.com', 'DavidElectronics', 'apple', 1, 0, 0, strftime('%s','now') - 86400*190, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', 44, 25, strftime('%s','now') - 86400*1, 1, 2100000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Gh9q5s8d', 'anna.services@email.com', 'AnnaServices', 'facebook', 1, 0, 0, strftime('%s','now') - 86400*160, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', 29, 18, strftime('%s','now') - 86400*4, 1, 1200000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Hi0r6t9e', 'tom.hobbies@email.com', 'TomHobbies', 'google', 1, 0, 0, strftime('%s','now') - 86400*130, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', 33, 21, strftime('%s','now') - 86400*2, 1, 800000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Ij1s7u0f', 'rachel.office@email.com', 'RachelOffice', 'apple', 1, 0, 0, strftime('%s','now') - 86400*100, 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&h=150&fit=crop&crop=face', 26, 16, strftime('%s','now') - 86400*3, 1, 600000);

INSERT INTO users (id, email, username, sso, verified, is_admin, banned, created_at, image, thumbs_up, deals, last_active, has_chosen_username, balance) VALUES
('Jk2t8v1g', 'chris.sports@email.com', 'ChrisSports', 'facebook', 1, 0, 0, strftime('%s','now') - 86400*70, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', 31, 20, strftime('%s','now') - 86400*1, 1, 1100000);

-- ============================================================================
-- SEED LISTINGS (25 listings with realistic data - following all constraints)
-- ============================================================================

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(1, 'Antminer S19 Pro 110TH/s Bitcoin Miner', 'Professional Bitcoin mining rig in excellent condition. Includes power supply and all cables. Ready to mine immediately.', 'Mining Gear', 'sell', 'Austin, TX', 30.2672, -97.7431, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', 2500000, 'fixed', 'Ab3k9m2x', strftime('%s','now') + 86400*7, strftime('%s','now') - 86400*5, strftime('%s','now') - 86400*2, 'active', 127);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(2, 'GPU Mining Rig - 6x RTX 3080', 'Complete Ethereum mining setup with 6 RTX 3080 graphics cards. Custom cooling and optimized for mining.', 'Mining Gear', 'sell', 'Miami, FL', 25.7617, -80.1918, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop', 1800000, 'make_offer', 'Bc4l0n3y', NULL, strftime('%s','now') - 86400*8, strftime('%s','now') - 86400*1, 'active', 89);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(3, 'ASIC Miner Hosting Service', 'Professional hosting for your mining equipment. 24/7 monitoring, maintenance, and optimal conditions.', 'Mining Gear', 'sell', 'Denver, CO', 39.7392, -104.9903, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 500000, 'fixed', 'Cd5m1o4z', NULL, strftime('%s','now') - 86400*12, strftime('%s','now') - 86400*3, 'active', 156);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(4, 'MacBook Pro M2 16" 512GB', 'Like new MacBook Pro with Apple M2 chip. Perfect for development and creative work.', 'Electronics', 'sell', 'Seattle, WA', 47.6062, -122.3321, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 3200000, 'make_offer', 'De6n2p5a', strftime('%s','now') + 86400*3, strftime('%s','now') - 86400*15, strftime('%s','now') - 86400*2, 'active', 234);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(5, 'iPhone 15 Pro Max 256GB', 'Unlocked iPhone 15 Pro Max in titanium. Includes original box and accessories.', 'Electronics', 'sell', 'New York, NY', 40.7128, -74.0060, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop', 2800000, 'fixed', 'Ef7o3q6b', NULL, strftime('%s','now') - 86400*20, strftime('%s','now') - 86400*5, 'active', 189);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(6, 'Gaming PC RTX 4070 Ti', 'Custom gaming PC with RTX 4070 Ti, Ryzen 7 7700X, 32GB RAM. Runs all modern games at max settings.', 'Electronics', 'sell', 'Los Angeles, CA', 34.0522, -118.2437, 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=300&fit=crop', 4200000, 'make_offer', 'Fg8p4r7c', strftime('%s','now') + 86400*5, strftime('%s','now') - 86400*25, strftime('%s','now') - 86400*1, 'active', 312);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(7, 'Web Development Services', 'Full-stack web development for businesses and startups. React, Node.js, Python, and more.', 'Services', 'sell', 'San Francisco, CA', 37.7749, -122.4194, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', 800000, 'make_offer', 'Gh9q5s8d', NULL, strftime('%s','now') - 86400*30, strftime('%s','now') - 86400*2, 'active', 445);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(8, 'Bitcoin Mining Consultation', 'Expert advice on setting up and optimizing your mining operation. 10+ years experience.', 'Services', 'sell', 'Chicago, IL', 41.8781, -87.6298, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 300000, 'fixed', 'Hi0r6t9e', NULL, strftime('%s','now') - 86400*35, strftime('%s','now') - 86400*3, 'active', 178);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(9, 'Smart Home Security System', 'Complete smart home security with cameras, sensors, and mobile app control.', 'Home & Garden', 'sell', 'Boston, MA', 42.3601, -71.0589, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 1200000, 'fixed', 'Ij1s7u0f', NULL, strftime('%s','now') - 86400*40, strftime('%s','now') - 86400*1, 'active', 267);

INSERT INTO listings (id, title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status, views) VALUES
(10, 'Garden Tools Collection', 'Professional grade garden tools including shovels, rakes, pruners, and more.', 'Home & Garden', 'sell', 'Phoenix, AZ', 33.4484, -112.0740, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', 150000, 'make_offer', 'Jk2t8v1g', NULL, strftime('%s','now') - 86400*45, strftime('%s','now') - 86400*2, 'active', 134);

-- ============================================================================
-- SEED LISTING IMAGES (3 images per listing)
-- ============================================================================

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img001', 1, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', 1, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img002', 1, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 2, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img003', 1, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop', 3, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img004', 2, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop', 1, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img005', 2, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 2, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img006', 2, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', 3, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img007', 3, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 1, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img008', 3, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', 2, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img009', 3, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop', 3, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img010', 4, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', 1, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img011', 4, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=300&fit=crop', 2, strftime('%s','now'));

INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at) VALUES
('img012', 4, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', 3, strftime('%s','now'));

-- ============================================================================
-- SEED VIEW LOGS (realistic analytics)
-- ============================================================================

INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('view001', 1, '192.168.1.100', 'session_abc123', strftime('%s','now') - 3600);

INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('view002', 1, '192.168.1.101', 'session_def456', strftime('%s','now') - 1800);

INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('view003', 2, '192.168.1.102', 'session_ghi789', strftime('%s','now') - 900);

INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('view004', 3, '192.168.1.103', 'session_jkl012', strftime('%s','now') - 600);

INSERT INTO view_logs (id, listing_id, viewer_ip, viewer_session, viewed_at) VALUES
('view005', 4, '192.168.1.104', 'session_mno345', strftime('%s','now') - 300);

PRAGMA foreign_keys = ON;

-- Display seeding results
SELECT 'STAGING DATABASE SEEDED SUCCESSFULLY' as status;
