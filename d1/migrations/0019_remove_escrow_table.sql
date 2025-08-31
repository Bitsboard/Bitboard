-- Migration 0019: Remove Escrow Table
-- Completely removes the escrow table and all its data

PRAGMA foreign_keys = OFF;

-- Step 1: Drop the escrow table
DROP TABLE IF EXISTS escrow;

-- Step 2: Remove any escrow-related indexes
-- Note: SQLite automatically removes indexes when tables are dropped

PRAGMA foreign_keys = ON;

-- Display updated schema
SELECT 'escrow table removed successfully' as status;
