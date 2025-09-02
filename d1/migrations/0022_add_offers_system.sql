-- Migration 0022: Add Offers System
CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    amount_sat INTEGER NOT NULL,
    expires_at INTEGER, -- NULL means no expiration
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'revoked', 'expired'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_offers_chat_id ON offers (chat_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers (listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_from_user_id ON offers (from_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_to_user_id ON offers (to_user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers (status);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON offers (expires_at);
