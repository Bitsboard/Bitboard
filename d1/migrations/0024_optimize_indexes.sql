-- Migration 0024: Optimize indexes for better performance
-- This migration adds performance-optimized indexes based on common query patterns

-- Drop existing inefficient indexes
DROP INDEX IF EXISTS idx_users_rating;

-- Create optimized user indexes
CREATE INDEX IF NOT EXISTS idx_users_thumbs_up ON users(thumbs_up DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE banned = 0;
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username) WHERE banned = 0;
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Create optimized listing indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_listings_status_active ON listings(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_location_active ON listings(lat, lng, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_category_active ON listings(category, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_ad_type_active ON listings(ad_type, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_price_active ON listings(price_sat, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_created_at_active ON listings(created_at DESC, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_boosted ON listings(boosted_until) WHERE boosted_until > strftime('%s','now');
CREATE INDEX IF NOT EXISTS idx_listings_posted_by_active ON listings(posted_by, status) WHERE status = 'active';

-- Create optimized chat indexes
CREATE INDEX IF NOT EXISTS idx_chats_buyer_active ON chats(buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_seller_active ON chats(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_listing_active ON chats(listing_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(buyer_id, seller_id, listing_id);

-- Create optimized message indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat_time ON messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_from_time ON messages(from_id, created_at DESC);

-- Create optimized offer indexes
CREATE INDEX IF NOT EXISTS idx_offers_chat_status ON offers(chat_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_listing_status ON offers(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_from_user ON offers(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_to_user ON offers(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_expires ON offers(expires_at) WHERE expires_at IS NOT NULL;

-- Create optimized block indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_pair ON user_blocks(blocker_id, blocked_id);

-- Create optimized hidden conversation indexes
CREATE INDEX IF NOT EXISTS idx_hidden_conversations_user ON hidden_conversations(user_id, hidden_at DESC);
CREATE INDEX IF NOT EXISTS idx_hidden_conversations_chat ON hidden_conversations(chat_id);

-- Create optimized listing images indexes
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id, image_order);

-- Create composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings(status, category, ad_type, price_sat) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_location_search ON listings(status, lat, lng, created_at DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_chats_user_activity ON chats(buyer_id, seller_id, last_message_at DESC);

-- Display completion message
SELECT 'Database indexes optimized successfully' as status;
