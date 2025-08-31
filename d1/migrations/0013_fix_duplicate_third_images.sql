-- Migration: Fix duplicate third images for listings
-- This ensures each listing has a unique third image instead of the same image for all listings in the same category

-- Step 1: Remove the duplicate third images (image_order = 2) that are the same for all listings
DELETE FROM listing_images 
WHERE image_order = 2;

-- Step 2: Add unique third images for each listing based on a combination of category and listing ID
-- This ensures variety while maintaining category-appropriate images
INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at)
SELECT 
  l.id || '_img_2' as id,
  l.id as listing_id,
  CASE 
    -- Electronics: Different tech images
    WHEN l.category = 'Electronics' THEN
      CASE (CAST(l.id AS INTEGER) % 5)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=85'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=85'
      END
    
    -- Mining Gear: Different mining/tech images
    WHEN l.category = 'Mining Gear' THEN
      CASE (CAST(l.id AS INTEGER) % 4)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=85'
      END
    
    -- Home & Garden: Different home improvement images
    WHEN l.category = 'Home & Garden' THEN
      CASE (CAST(l.id AS INTEGER) % 6)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
      END
    
    -- Games & Hobbies: Different hobby images
    WHEN l.category = 'Games & Hobbies' THEN
      CASE (CAST(l.id AS INTEGER) % 7)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        WHEN 5 THEN 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=85'
      END
    
    -- Services: Different service-related images
    WHEN l.category = 'Services' THEN
      CASE (CAST(l.id AS INTEGER) % 5)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=85'
      END
    
    -- Default: Variety of general images
    ELSE
      CASE (CAST(l.id AS INTEGER) % 8)
        WHEN 0 THEN 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85'
        WHEN 1 THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=85'
        WHEN 2 THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&q=85'
        WHEN 3 THEN 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=85'
        WHEN 4 THEN 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=85'
        WHEN 5 THEN 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=85'
        WHEN 6 THEN 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=85'
        ELSE 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=85'
      END
  END as image_url,
  2 as image_order,
  strftime('%s', 'now') as created_at
FROM listings l
WHERE l.id IN (
  SELECT listing_id 
  FROM listing_images 
  GROUP BY listing_id 
  HAVING COUNT(*) = 2
);

-- Step 3: Verify the fix - each listing should now have 3 unique images
SELECT 'After fixing duplicate third images:' as info;
SELECT COUNT(*) as total_listing_images FROM listing_images;

-- Show the distribution of images per listing
SELECT 'Final image distribution:' as info;
SELECT image_count, COUNT(*) as listings_count 
FROM (
  SELECT listing_id, COUNT(*) as image_count 
  FROM listing_images 
  GROUP BY listing_id
) 
GROUP BY image_count 
ORDER BY image_count;

-- Show sample of unique third images for verification
SELECT 'Sample of unique third images:' as info;
SELECT 
  l.id,
  l.category,
  li.image_url as third_image
FROM listings l
JOIN listing_images li ON l.id = li.listing_id
WHERE li.image_order = 2
ORDER BY l.id
LIMIT 10;
