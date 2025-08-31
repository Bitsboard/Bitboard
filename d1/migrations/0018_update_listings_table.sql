-- Migration 0018: Update Listings Table
-- Removes images_migrated field and adds pricing_type to support "Make Offer"

PRAGMA foreign_keys = OFF;

-- Step 1: Remove images_migrated column (no longer needed with listing_images table)
ALTER TABLE listings DROP COLUMN images_migrated;

-- Step 2: Add pricing_type column if it doesn't exist
ALTER TABLE listings ADD COLUMN pricing_type TEXT DEFAULT 'fixed';

-- Step 3: Update any existing records to ensure pricing_type is valid
UPDATE listings SET pricing_type = 'fixed' WHERE pricing_type IS NULL OR pricing_type = '';

PRAGMA foreign_keys = ON;

-- Display updated schema
SELECT 'listings table updated successfully' as status;
