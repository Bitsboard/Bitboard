-- Complete Wipe of Remote Staging Database
-- This script completely clears all data and tables from the remote staging database
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=./d1/wipe_remote_complete.sql

-- Drop all existing tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS listing_images;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS saved_searches;
DROP TABLE IF EXISTS view_logs;

-- Display wipe results
SELECT 'REMOTE STAGING DATABASE COMPLETELY WIPED' as status;
SELECT 'All tables dropped and ready for fresh schema' as message;
