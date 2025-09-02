-- Migration 0023: Add unique constraint to prevent multiple pending offers between same users
-- This ensures only one pending offer can exist between two users for a listing at a time

-- First, let's clean up any duplicate pending offers that might exist
-- Keep only the most recent pending offer between each pair of users for each listing
DELETE FROM offers 
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY listing_id, 
                   CASE WHEN from_user_id < to_user_id 
                        THEN from_user_id || '_' || to_user_id 
                        ELSE to_user_id || '_' || from_user_id 
                   END 
                   ORDER BY created_at DESC
               ) as rn
        FROM offers 
        WHERE status = 'pending'
    ) 
    WHERE rn = 1
);

-- Add unique constraint to prevent multiple pending offers between same users
-- We use a composite unique constraint on listing_id and a normalized user pair
-- The constraint ensures no two pending offers can exist between the same users for the same listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_unique_pending 
ON offers (listing_id, 
           CASE WHEN from_user_id < to_user_id 
                THEN from_user_id || '_' || to_user_id 
                ELSE to_user_id || '_' || from_user_id 
           END)
WHERE status = 'pending';
