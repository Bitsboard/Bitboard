-- Migration: Add 2 additional images for each listing
-- Each listing currently has 1 image, we'll add 2 more for a total of 3

-- Add 2 additional images for each listing
INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at)
SELECT 
  l.id || '_img_' || (additional_order + 1) as id,
  l.id as listing_id,
  CASE l.category
    WHEN 'Electronics' THEN 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=85'
    WHEN 'Mining Gear' THEN 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=85'
    WHEN 'Home & Garden' THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85'
    WHEN 'Sports & Bikes' THEN 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa4?w=600&q=85'
    WHEN 'Tools' THEN 'https://images.unsplash.com/photo-1581147033411-113a1c0c0b5e?w=600&q=85'
    WHEN 'Games & Hobbies' THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
    WHEN 'Furniture' THEN 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=85'
    WHEN 'Services' THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
    ELSE 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85'
  END as image_url,
  additional_order + 1 as image_order,
  strftime('%s', 'now') as created_at
FROM listings l
CROSS JOIN (
  SELECT 1 as additional_order UNION ALL SELECT 2
) additional_images;

-- Verify the results
SELECT 'After migration:' as info;
SELECT COUNT(*) as total_listing_images FROM listing_images;
SELECT 
  COUNT(DISTINCT listing_id) as listings_with_images,
  AVG(image_count) as avg_images_per_listing,
  MIN(image_count) as min_images_per_listing,
  MAX(image_count) as max_images_per_listing
FROM (
  SELECT listing_id, COUNT(*) as image_count 
  FROM listing_images 
  GROUP BY listing_id
);
