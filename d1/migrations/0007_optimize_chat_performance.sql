-- Migration 0007: Optimize Chat Performance
-- Pre-create all chat-related tables and indexes to eliminate schema checks on every request

-- Ensure chats table exists with optimal structure
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  listing_id INTEGER NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  last_message_at INTEGER DEFAULT (strftime('%s','now'))
);

-- Ensure messages table exists with optimal structure
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  from_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  read_at INTEGER
);

-- Create all performance indexes (these were previously created on every request)
CREATE INDEX IF NOT EXISTS idx_chats_listing_id ON chats(listing_id);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ✅ NEW: Additional performance indexes for the optimized queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(chat_id, from_id, read_at);

-- ✅ NEW: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_chats_user_listing ON chats(buyer_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_listing_alt ON chats(seller_id, listing_id);

-- ✅ NEW: Covering indexes for the optimized chat list query
CREATE INDEX IF NOT EXISTS idx_chats_covering ON chats(id, listing_id, buyer_id, seller_id, created_at, last_message_at);

-- Set database optimization pragmas
PRAGMA journal_mode = WAL;
PRAGMA page_size = 4096;
PRAGMA mmap_size = 268435456; -- 256MB
PRAGMA cache_size = -64000; -- 64MB
PRAGMA synchronous = NORMAL;

-- Verify indexes were created
SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%';
