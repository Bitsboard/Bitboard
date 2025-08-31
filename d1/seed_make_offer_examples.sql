-- Seed file with example "make offer" listings
-- This demonstrates the new flexible pricing system with real examples

PRAGMA foreign_keys = OFF;

-- Add some new listings with "make offer" pricing
INSERT INTO listings (title, description, category, ad_type, location, lat, lng, image_url, price_sat, pricing_type, posted_by, boosted_until, created_at, updated_at, status) VALUES
-- Services that benefit from negotiation
('Custom Bitcoin Mining Setup Design', 'Professional mining facility design and consultation. Each project is unique and pricing depends on scale and requirements. Contact me to discuss your specific needs.', 'Services', 'sell', 'Austin, TX, USA', 30.2672, -97.7431, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400', -1, 'make_offer', 'na-user-001', NULL, strftime('%s','now') - (5 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Vintage Bitcoin Art Collection', 'Rare collection of early Bitcoin artwork and memorabilia. Includes original pieces from 2010-2013. Each piece has unique historical value. Serious collectors only.', 'Games & Hobbies', 'sell', 'San Francisco, CA, USA', 37.7749, -122.4194, 'https://images.unsplash.com/photo-1541961017774-1262?w=400', -1, 'make_offer', 'na-user-002', NULL, strftime('%s','now') - (12 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Luxury Mountain Retreat', 'Exclusive mountain property with stunning views. Perfect for Bitcoin enthusiasts seeking privacy and security. Property includes advanced security systems and mining infrastructure.', 'Home & Garden', 'sell', 'Denver, CO, USA', 39.7392, -104.9903, 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400', -1, 'make_offer', 'na-user-003', NULL, strftime('%s','now') - (8 * 24 * 60 * 60), strftime('%s','now'), 'active'),

-- Want ads that are perfect for make offer
('Looking for Rare Mining Equipment', 'Seeking vintage Antminer S1 or S3 models in working condition. Also interested in early ASIC prototypes. Willing to pay premium for well-maintained items.', 'Mining Gear', 'want', 'Houston, TX, USA', 29.7604, -95.3698, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400', -1, 'make_offer', 'na-user-004', NULL, strftime('%s','now') - (3 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Seeking Bitcoin Startup Office Space', 'Looking for office space in crypto-friendly building. Need 2000-5000 sq ft. Prefer locations with good internet infrastructure and security. Flexible on location within major cities.', 'Office', 'want', 'New York, NY, USA', 40.7128, -74.0060, 'https://images.unsplash.com/photo-1497366754035-f2009686e72?w=400', -1, 'make_offer', 'na-user-005', NULL, strftime('%s','now') - (7 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Wanted: Professional Legal Services', 'Need experienced attorney specializing in cryptocurrency and blockchain law. Looking for ongoing consultation and representation. Must have proven track record in crypto space.', 'Services', 'want', 'Miami, FL, USA', 25.7617, -80.1918, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400', -1, 'make_offer', 'na-user-006', NULL, strftime('%s','now') - (2 * 24 * 60 * 60), strftime('%s','now'), 'active'),

-- High-value items that could benefit from negotiation
('Industrial Mining Farm', 'Complete mining operation with 1000+ ASIC miners. Includes cooling systems, electrical infrastructure, and monitoring software. Turnkey operation ready for immediate use.', 'Mining Gear', 'sell', 'Phoenix, AZ, USA', 33.4484, -112.0740, 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400', -1, 'make_offer', 'na-user-007', NULL, strftime('%s','now') - (15 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Premium Tesla Model X with Bitcoin Mining Setup', '2023 Tesla Model X with integrated mining equipment in trunk. Custom cooling system and power management. Perfect for mobile mining operations.', 'Electronics', 'sell', 'Los Angeles, CA, USA', 34.0522, -118.2437, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', -1, 'make_offer', 'na-user-008', NULL, strftime('%s','now') - (10 * 24 * 60 * 60), strftime('%s','now'), 'active'),

('Exclusive Bitcoin Conference Venue', 'Historic venue perfect for Bitcoin conferences and events. Seats 500+ people with modern AV equipment. Includes catering kitchen and outdoor space.', 'Office', 'sell', 'Nashville, TN, USA', 36.1627, -86.7816, 'https://images.unsplash.com/photo-1497366754035-f2009686e72?w=400', -1, 'make_offer', 'na-user-009', NULL, strftime('%s','now') - (20 * 24 * 60 * 60), strftime('%s','now'), 'active');

-- Verify the new make offer listings
SELECT 
  'New make offer listings added:' as info,
  COUNT(*) as total_new_make_offer
FROM listings 
WHERE pricing_type = 'make_offer' 
AND created_at > strftime('%s','now') - (25 * 24 * 60 * 60); -- Recent listings

-- Show examples of the new make offer listings
SELECT 
  title,
  category,
  ad_type,
  pricing_type,
  price_sat,
  location,
  created_at
FROM listings 
WHERE pricing_type = 'make_offer' 
AND created_at > strftime('%s','now') - (25 * 24 * 60 * 60)
ORDER BY created_at DESC;

PRAGMA foreign_keys = ON;
