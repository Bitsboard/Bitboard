-- Clear existing data
DELETE FROM listings;
DELETE FROM users;

-- Create users first - Production-ready usernames without @ symbols
INSERT INTO users (id, email, username, sso, verified, created_at, image) VALUES
  ('user_satoshi', 'satoshi@example.com', 'satoshi', 'google', 1, strftime('%s','now') - 365*24*60*60, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('user_luna', 'luna@example.com', 'luna', 'google', 1, strftime('%s','now') - 300*24*60*60, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('user_rob', 'rob@example.com', 'rob', 'google', 0, strftime('%s','now') - 250*24*60*60, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'),
  ('user_mika', 'mika@example.com', 'mika', 'google', 1, strftime('%s','now') - 200*24*60*60, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('user_arya', 'arya@example.com', 'arya', 'google', 0, strftime('%s','now') - 180*24*60*60, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('user_nova', 'nova@example.com', 'nova', 'google', 1, strftime('%s','now') - 150*24*60*60, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'),
  ('user_kai', 'kai@example.com', 'kai', 'google', 0, strftime('%s','now') - 120*24*60*60, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('user_zen', 'zen@example.com', 'zen', 'google', 1, strftime('%s','now') - 100*24*60*60, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
  ('user_olivia', 'olivia@example.com', 'olivia', 'google', 0, strftime('%s','now') - 80*24*60*60, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'),
  ('user_noah', 'noah@example.com', 'noah', 'google', 1, strftime('%s','now') - 60*24*60*60, 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face');

-- Insert listings with proper user relationships
INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
) VALUES
  ('Antminer S19 Pro (110TH)', 'Well‑maintained, pickup preferred. Includes PSU.', 'Mining Gear', 'sell', 'Markham, ON', 43.8561, -79.3370, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop', 14500000, 'user_satoshi', NULL),
  ('Looking for: Ryzen 7 / 3070 build', 'WTB a clean 1440p gaming PC. Prefer pickup downtown. Paying in sats.', 'Electronics', 'want', 'Toronto, ON (Downtown)', 43.6510, -79.3810, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop', 5200000, 'user_luna', NULL),
  ('Bitcoin Node Setup Service', 'Professional Bitcoin node installation and configuration.', 'Services', 'sell', 'Vancouver, BC', 49.2827, -123.1207, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop', 500000, 'user_rob', NULL),
  ('Home Mining Ventilation Kit', 'Ducting, fan, and enclosure to quiet your rig.', 'Home & Garden', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&auto=format&fit=crop', 250000, 'user_mika', NULL), 
  ('Cold Storage Hardware Wallet (New)', 'Sealed box with original receipt.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop', 900000, 'user_arya', NULL),
  ('Trading 1oz Silver Maple for sats', 'Spot price trade. Meet at a public place.', 'Games & Hobbies', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 120000, 'user_nova', NULL),
  ('Mechanical Keyboard (Hot‑swap)', 'Custom build, lubed switches.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 350000, 'user_kai', NULL),
  ('PS5 Disc Edition', 'Like new, includes 2 controllers.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1606813907291-76a3b2143a04?w=1200&auto=format&fit=crop', 2200000, 'user_zen', NULL),
  ('Looking for: MacBook Air M2', 'Prefer 16GB RAM model.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 3500000, 'user_olivia', NULL),
  ('RTX 3080 10GB', 'Good condition GPU. No mining.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1616628188502-4047d2271797?w=1200&auto=format&fit=crop', 2800000, 'user_noah', NULL);

-- Additional sample listings to better populate staging
INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
) VALUES
  ('4TB NVMe SSD', 'Brand new sealed.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop', 6000000, 'user_satoshi', NULL),
  ('ThinkPad T14 Gen 3', 'Excellent battery life, lightly used.', 'Electronics', 'sell', 'Mississauga, ON', 43.5890, -79.6441, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 15000000, 'user_luna', NULL),
  ('27" 4K Monitor', 'IPS panel, great for color work.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 3500000, 'user_rob', NULL),
  ('USB-C Docking Station', 'Multiple ports, 100W PD.', 'Electronics', 'sell', 'Scarborough, ON', 43.7750, -79.2578, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop', 800000, 'user_mika', NULL),
  ('Gaming Chair', 'Ergonomic, adjustable lumbar.', 'Home & Garden', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1515777315835-281b94c9589f?w=1200&auto=format&fit=crop', 1200000, 'user_arya', NULL),
  ('Looking for: Router with WiFi 6', 'Need a reliable WiFi 6 router.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop', 500000, 'user_nova', NULL),
  ('Raspberry Pi 4 (8GB)', 'With case and power supply.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1581093588401-16f8b8c9f7d9?w=1200&auto=format&fit=crop', 900000, 'user_kai', NULL),
  ('Mechanical Switches Set', '90x tactile switches, unused.', 'Electronics', 'sell', 'North York, ON', 43.7615, -79.4111, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 300000, 'user_zen', NULL),
  ('Looking for: 2TB HDD', 'Backup drive needed.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop', 250000, 'user_olivia', NULL),
  ('Nintendo Switch OLED', 'White model, barely used.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&auto=format&fit=crop', 4200000, 'user_noah', NULL);

INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
) VALUES
  ('eBike Conversion Kit', '500W motor, controller, and battery.', 'Sports & Outdoors', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1605710344272-f7e222d1f4a1?w=1200&auto=format&fit=crop', 8000000, 'user_satoshi', NULL),
  ('3D Printer (Ender 3)', 'Tuned and ready to print.', 'Electronics', 'sell', 'Etobicoke, ON', 43.6205, -79.5132, 'https://images.unsplash.com/photo-1581093588401-16f8b8c9f7d9?w=1200&auto=format&fit=crop', 2500000, 'user_luna', NULL),
  ('Looking for: Bike Helmet M', 'Clean and safe, local pickup.', 'Sports & Outdoors', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 100000, 'user_rob', NULL),
  ('Camping Stove', 'Compact and efficient.', 'Sports & Outdoors', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 200000, 'user_mika', NULL),
  ('Home NAS Server', '4-bay with 8TB included.', 'Electronics', 'sell', 'Brampton, ON', 43.7315, -79.7624, 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop', 18000000, 'user_arya', NULL),
  ('Bluetooth Speakers', 'Stereo pair, great sound.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 700000, 'user_nova', NULL),
  ('Looking for: Desk Lamp', 'Warm light preferred.', 'Home & Garden', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&auto=format&fit=crop', 80000, 'user_kai', NULL),
  ('Mechanical Pencil Set', 'Drafting grade.', 'Office', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200&auto=format&fit=crop', 50000, 'user_zen', NULL),
  ('Portable Monitor 15.6"', '1080p IPS, USB-C powered.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 1200000, 'user_olivia', NULL),
  ('Looking for: USB-C Charger 65W', 'Need fast charger.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop', 120000, 'user_noah', NULL);

INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
) VALUES
  ('Smart Thermostat', 'Works with HomeKit and Alexa.', 'Home & Garden', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=1200&auto=format&fit=crop', 900000, 'user_satoshi', NULL),
  ('Cordless Drill Kit', 'Includes 2 batteries.', 'Home & Garden', 'sell', 'Vaughan, ON', 43.8372, -79.5085, 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&auto=format&fit=crop', 700000, 'user_luna', NULL),
  ('Looking for: Garden Hose 50ft', 'Sturdy preferred.', 'Home & Garden', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&auto=format&fit=crop', 50000, 'user_rob', NULL),
  ('Ultrawide 34" Monitor', '3440x1440, 120Hz.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 5500000, 'user_mika', NULL),
  ('Mac Mini M2', '16GB RAM, 512GB SSD.', 'Electronics', 'sell', 'Richmond Hill, ON', 43.8828, -79.4403, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 22000000, 'user_arya', NULL),
  ('Looking for: Standing Desk', '60x30 inch preferred.', 'Office', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200&auto=format&fit=crop', 800000, 'user_nova', NULL),
  ('Laptop Stand', 'Aluminum, fits 13-16 inch.', 'Office', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200&auto=format&fit=crop', 120000, 'user_kai', NULL),
  ('Noise Cancelling Headphones', 'Great condition.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 1800000, 'user_zen', NULL),
  ('Looking for: HDMI 2.1 Cable', '3m length.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop', 30000, 'user_olivia', NULL),
  ('Ergonomic Office Chair', 'Mesh back, adjustable.', 'Office', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200&auto=format&fit=crop', 1500000, 'user_noah', NULL);

INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, posted_by, boosted_until
) VALUES
  ('NAS Hard Drive 8TB', 'Low hours, healthy SMART.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&auto=format&fit=crop', 1600000, 'user_satoshi', NULL),
  ('Web Design Service', 'Landing pages and small sites.', 'Services', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop', 1200000, 'user_luna', NULL),
  ('PC Cable Management Kit', 'Velcro straps and sleeves.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop', 80000, 'user_rob', NULL),
  ('Crypto Tax Consultation', 'One-hour session.', 'Services', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop', 700000, 'user_mika', NULL),
  ('Looking for: 1440p Monitor', '27 inch preferred.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 1200000, 'user_arya', NULL),
  ('Camera Tripod', 'Lightweight aluminum.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 250000, 'user_nova', NULL),
  ('Looking for: Streaming Webcam', '1080p or better.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop', 150000, 'user_kai', NULL),
  ('Home Office Bundle', 'Desk, chair, and lamp.', 'Office', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?w=1200&auto=format&fit=crop', 2500000, 'user_zen', NULL),
  ('Looking for: USB Microphone', 'For podcasting.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 300000, 'user_olivia', NULL),
  ('Portable Power Station', '300Wh capacity.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1581093588401-16f8b8c9f7d9?w=1200&auto=format&fit=crop', 4500000, 'user_noah', NULL);
