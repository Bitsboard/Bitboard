-- db/seed_listings.sql
-- Seeds 200 listings with plausible data for a local Bitcoin classifieds app.

-- OPTIONAL: uncomment if you want a clean slate each time
-- DELETE FROM listings;

WITH RECURSIVE
  seq(n) AS (
    VALUES (1)
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 200
  ),
  cities(id, name, lat, lng) AS (
    VALUES
      (1,'Toronto, ON',43.6532,-79.3832),
      (2,'Montreal, QC',45.5017,-73.5673),
      (3,'Vancouver, BC',49.2827,-123.1207),
      (4,'Calgary, AB',51.0447,-114.0719),
      (5,'Ottawa, ON',45.4215,-75.6972),
      (6,'Edmonton, AB',53.5461,-113.4938),
      (7,'Winnipeg, MB',49.8951,-97.1384),
      (8,'Halifax, NS',44.6488,-63.5752),
      (9,'Victoria, BC',48.4284,-123.3656),
      (10,'Quebec City, QC',46.8139,-71.2080)
  ),
  -- label, base price in sats, mapped category
  items(id, label, base_sat, category) AS (
    VALUES
      (1,'iPhone 12',7000000,'Electronics'),
      (2,'MacBook Air M1',12000000,'Computers'),
      (3,'Gaming PC',15000000,'Computers'),
      (4,'RTX 3080 GPU',9000000,'Computers'),
      (5,'PS5 Console',8000000,'Gaming'),
      (6,'Nintendo Switch',4000000,'Gaming'),
      (7,'E-Bike',20000000,'Vehicles'),
      (8,'Road Bike',8000000,'Sports & Outdoors'),
      (9,'Electric Scooter',6000000,'Vehicles'),
      (10,'27'' 4K Monitor',3000000,'Electronics'),
      (11,'Canon EOS M50',5000000,'Photography & Audio'),
      (12,'Sony A7 III',10000000,'Photography & Audio'),
      (13,'Shure SM7B Mic',2500000,'Photography & Audio'),
      (14,'AirPods Pro',1500000,'Electronics'),
      (15,'Mechanical Keyboard',800000,'Computers'),
      (16,'Standing Desk',2000000,'Home & Garden'),
      (17,'Ergonomic Chair',1800000,'Home & Garden'),
      (18,'Sofa',3000000,'Home & Garden'),
      (19,'Washer & Dryer Set',7500000,'Home & Garden'),
      (20,'Camping Tent',900000,'Sports & Outdoors')
  ),
  adjectives(id, a) AS (
    VALUES
      (1,'Mint'),(2,'Excellent'),(3,'Like New'),(4,'Good'),
      (5,'Used'),(6,'Refurbished'),(7,'Budget'),(8,'Premium'),
      (9,'Vintage'),(10,'Compact'),(11,'Wireless'),(12,'4K'),
      (13,'Pro'),(14,'Lightweight'),(15,'Portable'),(16,'Clean')
  ),
  seed AS (
    SELECT
      n,
      -- deterministically pick from lists using modulo; ensures variety per row
      ((n * 13) % (SELECT MAX(id) FROM cities)) + 1            AS city_id,
      ((n * 5)  % (SELECT MAX(id) FROM items)) + 1             AS item_id,
      ((n * 7)  % (SELECT MAX(id) FROM adjectives)) + 1        AS adj_id
    FROM seq
  )
INSERT INTO listings (
  title,
  price_sat,
  created_at,
  description,
  category,
  ad_type,
  location,
  lat,
  lng,
  image_url,
  boosted_until
)
SELECT
  -- title: "<Adjective> <Item>"
  (SELECT a FROM adjectives WHERE id = seed.adj_id) || ' ' ||
  (SELECT label FROM items WHERE id = seed.item_id)                                        AS title,

  -- price in sats: base ± up to ~50% jitter + a little extra random
  CAST((
    (SELECT base_sat FROM items WHERE id = seed.item_id) +
    (ABS(RANDOM()) % ( (SELECT base_sat FROM items WHERE id = seed.item_id)/2 + 500000 ))
  ) AS INTEGER)                                                                            AS price_sat,

  -- created sometime within the last 30 days
  CAST(strftime('%s','now') - (ABS(RANDOM()) % (60*60*24*30)) AS INTEGER)                  AS created_at,

  -- simple, varied description
  CASE seed.n % 3
    WHEN 0 THEN 'Local pickup preferred. Bitcoin via escrow.'
    WHEN 1 THEN 'Works great, lightly used. BTC only.'
    ELSE 'Price firm. Meet in public place. BTC preferred.'
  END                                                                                       AS description,

  -- category follows the chosen item
  (SELECT category FROM items WHERE id = seed.item_id)                                      AS category,

  -- 80% sell, 20% buy
  CASE WHEN (seed.n % 5) = 0 THEN 'buy' ELSE 'sell' END                                     AS ad_type,

  -- location + coordinates come from the same city row
  (SELECT name FROM cities WHERE id = seed.city_id)                                         AS location,
  (SELECT lat  FROM cities WHERE id = seed.city_id)                                         AS lat,
  (SELECT lng  FROM cities WHERE id = seed.city_id)                                         AS lng,

  -- no images for seed data
  ''                                                                                        AS image_url,

  -- ~10% boosted, within the next 14 days
  CASE WHEN (seed.n % 10) = 0
       THEN CAST(strftime('%s','now') + (ABS(RANDOM()) % (60*60*24*14)) AS INTEGER)
       ELSE NULL
  END                                                                                       AS boosted_until
FROM seed;
