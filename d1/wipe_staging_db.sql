-- Wipe Staging Database - Complete Data Cleanup
-- This script removes ALL data from the staging database while preserving the schema
-- Run with: wrangler d1 execute bitsbarter-staging --file=./d1/wipe_staging_db.sql

PRAGMA foreign_keys = OFF;

-- Clear all data from all tables
DELETE FROM messages;
DELETE FROM chats;
DELETE FROM escrow;
DELETE FROM saved_searches;
DELETE FROM listings;
DELETE FROM users;

-- Reset auto-increment counters (if any)
DELETE FROM sqlite_sequence;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Display final status
SELECT 'STAGING DATABASE WIPED SUCCESSFULLY' as status;
