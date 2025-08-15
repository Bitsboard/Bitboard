DELETE FROM listings;

INSERT INTO listings (
  title, description, category, ad_type, location, lat, lng, image_url, price_sat, boosted_until
) VALUES
  ('Antminer S19 Pro (110TH)', 'Well‑maintained, pickup preferred. Includes PSU.', 'Mining Gear', 'sell', 'Markham, ON', 43.8561, -79.3370, 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop', 14500000, NULL),
  ('Looking for: Ryzen 7 / 3070 build', 'WTB a clean 1440p gaming PC. Prefer pickup downtown. Paying in sats.', 'Electronics', 'want', 'Toronto, ON (Downtown)', 43.6510, -79.3810, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop', 5200000, NULL),
  ('Bitcoin Node Setup Service', 'Professional Bitcoin node installation and configuration.', 'Services', 'sell', 'Vancouver, BC', 49.2827, -123.1207, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop', 500000, NULL),
  ('Home Mining Ventilation Kit', 'Ducting, fan, and enclosure to quiet your rig.', 'Home & Garden', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=1200&auto=format&fit=crop', 250000, NULL), 
  ('Cold Storage Hardware Wallet (New)', 'Sealed box with original receipt.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&auto=format&fit=crop', 900000, NULL),
  ('Trading 1oz Silver Maple for sats', 'Spot price trade. Meet at a public place.', 'Games & Hobbies', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&auto=format&fit=crop', 120000, NULL),
  ('Mechanical Keyboard (Hot‑swap)', 'Custom build, lubed switches.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 350000, NULL),
  ('PS5 Disc Edition', 'Like new, includes 2 controllers.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1606813907291-76a3b2143a04?w=1200&auto=format&fit=crop', 2200000, NULL),
  ('Looking for: MacBook Air M2', 'Prefer 16GB RAM model.', 'Electronics', 'want', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop', 3500000, NULL),
  ('RTX 3080 10GB', 'Good condition GPU. No mining.', 'Electronics', 'sell', 'Toronto, ON', 43.6532, -79.3832, 'https://images.unsplash.com/photo-1616628188502-4047d2271797?w=1200&auto=format&fit=crop', 2800000, NULL);


