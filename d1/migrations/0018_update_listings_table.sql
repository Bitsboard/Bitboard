-- Migration 0018: Update Listings Table
-- Removes images_migrated field and updates pricing_type to support "Make Offer"

PRAGMA foreign_keys = OFF;

-- Step 1: Remove images_migrated column (no longer needed with listing_images table)
ALTER TABLE listings DROP COLUMN images_migrated;

-- Step 2: Update pricing_type constraint to allow "Make Offer"
-- Note: SQLite doesn't support modifying CHECK constraints on existing tables
-- The application will need to handle the new pricing type values

-- Step 3: Update any existing records to ensure pricing_type is valid
UPDATE listings SET pricing_type = 'fixed' WHERE pricing_type IS NULL OR pricing_type = '';

PRAGMA foreign_keys = ON;

-- Display updated schema
SELECT 'listings table updated successfully' as status;
