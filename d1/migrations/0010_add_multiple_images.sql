-- Migration: Add support for multiple images per listing
-- Run with: wrangler d1 execute <DB_NAME> --file=d1/migrations/0010_add_multiple_images.sql

-- Create images table for multiple images per listing
CREATE TABLE IF NOT EXISTS listing_images (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_order ON listing_images(listing_id, image_order);

-- Migrate existing single images to the new images table
INSERT INTO listing_images (id, listing_id, image_url, image_order, created_at)
SELECT 
  listings.id || '_img_0' as id,
  listings.id as listing_id,
  image_url,
  0 as image_order,
  created_at
FROM listings 
WHERE image_url IS NOT NULL AND image_url != '';

-- Add a temporary column to track migration status
ALTER TABLE listings ADD COLUMN images_migrated INTEGER DEFAULT 0;

-- Update migration status for listings that had images
UPDATE listings 
SET images_migrated = 1 
WHERE image_url IS NOT NULL AND image_url != '';

-- Create a view to get listings with their images as JSON array
CREATE VIEW IF NOT EXISTS listings_with_images AS
SELECT 
  l.*,
  COALESCE(
    (SELECT json_group_array(li.image_url) 
     FROM listing_images li 
     WHERE li.listing_id = l.id 
     ORDER BY li.image_order),
    json_array()
  ) as images_json
FROM listings l;
