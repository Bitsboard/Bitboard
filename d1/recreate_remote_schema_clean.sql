-- Recreate Remote Staging Database Schema (Clean)
-- This script drops all existing tables and recreates the correct schema
-- Run with: wrangler d1 execute bitsbarter-staging --remote --file=./d1/recreate_remote_schema_clean.sql

-- Drop all existing tables
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS listing_images;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS saved_searches;
DROP TABLE IF EXISTS view_logs;

-- Create users table with correct schema
CREATE TABLE "users" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  sso TEXT NOT NULL,
  verified INTEGER DEFAULT 0 CHECK (verified IN (0, 1)),
  is_admin INTEGER DEFAULT 0 CHECK (is_admin IN (0, 1)),
  banned INTEGER DEFAULT 0 CHECK (banned IN (0, 1)),
  created_at INTEGER NOT NULL,
  image TEXT,
  thumbs_up INTEGER DEFAULT 0 CHECK (thumbs_up >= 0),
  deals INTEGER DEFAULT 0 CHECK (deals >= 0),
  last_active INTEGER DEFAULT (strftime('%s','now')),
  has_chosen_username INTEGER DEFAULT 0,
  balance BIGINT DEFAULT 0
);

-- Create listings table with correct schema
CREATE TABLE "listings" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 500),
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Misc' CHECK (category IN ('Mining Gear', 'Electronics', 'Services', 'Home & Garden', 'Games & Hobbies', 'Office', 'Sports & Outdoors')),
  ad_type TEXT DEFAULT 'sell' CHECK (ad_type IN ('sell', 'want')),
  location TEXT DEFAULT '',
  lat REAL DEFAULT 0 CHECK (lat >= -90 AND lat <= 90),
  lng REAL DEFAULT 0 CHECK (lng >= -180 AND lng <= 180),
  image_url TEXT DEFAULT '',
  price_sat INTEGER NOT NULL CHECK (price_sat >= -1),
  pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'make_offer')),
  posted_by TEXT NOT NULL,
  boosted_until INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER DEFAULT (strftime('%s','now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted')),
  views INTEGER DEFAULT 0
);

-- Create listing_images table
CREATE TABLE listing_images (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Create chats table
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_message_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Create messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read_at INTEGER
);

-- Create saved_searches table
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  query TEXT,
  category TEXT,
  ad_type TEXT CHECK (ad_type IN ('sell', 'want', 'all')),
  center_lat REAL NOT NULL CHECK (center_lat >= -90 AND center_lat <= 90),
  center_lng REAL NOT NULL CHECK (center_lng >= -180 AND center_lng <= 180),
  radius_km INTEGER NOT NULL CHECK (radius_km >= 0 AND radius_km <= 1000),
  notify BOOLEAN DEFAULT 1 CHECK (notify IN (0, 1)),
  last_opened INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Create view_logs table
CREATE TABLE view_logs (
  id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  viewer_ip TEXT NOT NULL,
  viewer_session TEXT NOT NULL,
  viewed_at INTEGER NOT NULL
);

-- Display schema creation results
SELECT 'SCHEMA RECREATED SUCCESSFULLY' as status;
SELECT 'All tables dropped and recreated with correct structure' as message;
