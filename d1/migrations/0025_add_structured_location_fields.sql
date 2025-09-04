-- Add structured location fields to listings table
-- This migration adds city, state_province, country, and country_code columns
-- to enable better location-based analytics and filtering

ALTER TABLE listings ADD COLUMN city TEXT;
ALTER TABLE listings ADD COLUMN state_province TEXT;
ALTER TABLE listings ADD COLUMN country TEXT;
ALTER TABLE listings ADD COLUMN country_code TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_state_province ON listings(state_province);
CREATE INDEX IF NOT EXISTS idx_listings_country ON listings(country);
CREATE INDEX IF NOT EXISTS idx_listings_country_code ON listings(country_code);

-- Update existing records with parsed location data
-- This will be handled by the application logic, not in the migration
-- to avoid complex parsing logic in SQL
