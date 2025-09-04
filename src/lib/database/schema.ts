/**
 * Centralized Database Schema Definitions
 * This file contains all database table creation statements to ensure consistency
 */

export const DATABASE_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      sso TEXT,
      verified INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      image TEXT,
      is_admin INTEGER DEFAULT 0,
      banned INTEGER DEFAULT 0,
      thumbs_up INTEGER DEFAULT 0,
      deals INTEGER DEFAULT 0,
      last_active INTEGER DEFAULT 0,
      has_chosen_username INTEGER DEFAULT 0
    )
  `,

  listings: `
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      ad_type TEXT NOT NULL CHECK (ad_type IN ('sell', 'want')),
      location TEXT NOT NULL,
      city TEXT,
      state_province TEXT,
      country TEXT,
      country_code TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      image_url TEXT,
      price_sat INTEGER NOT NULL,
      pricing_type TEXT DEFAULT 'fixed' CHECK (pricing_type IN ('fixed', 'make_offer')),
      posted_by TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'deleted')),
      boosted_until INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      views INTEGER DEFAULT 0,
      FOREIGN KEY (posted_by) REFERENCES users(id)
    )
  `,

  chats: `
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_message_at INTEGER NOT NULL,
      FOREIGN KEY (listing_id) REFERENCES listings(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )
  `,

  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read_at INTEGER,
      type TEXT DEFAULT 'message' CHECK (type IN ('message', 'offer')),
      amount_sat INTEGER,
      expires_at INTEGER,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    )
  `,

  user_blocks: `
    CREATE TABLE IF NOT EXISTS user_blocks (
      id TEXT PRIMARY KEY,
      blocker_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      reason TEXT,
      UNIQUE(blocker_id, blocked_id),
      FOREIGN KEY (blocker_id) REFERENCES users(id),
      FOREIGN KEY (blocked_id) REFERENCES users(id)
    )
  `,

  hidden_conversations: `
    CREATE TABLE IF NOT EXISTS hidden_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, chat_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    )
  `,

  offers: `
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      amount_sat INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked', 'expired')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE (chat_id, from_user_id, status),
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id)
    )
  `
};

/**
 * Initialize all database tables
 * Call this function to ensure all tables exist with the correct schema
 */
export async function initializeDatabase(db: D1Database): Promise<void> {
  const schemas = Object.values(DATABASE_SCHEMAS);
  
  for (const schema of schemas) {
    try {
      await db.prepare(schema).run();
    } catch (error) {
      console.error('Error creating table:', error);
      throw error;
    }
  }
}

/**
 * Get a specific table schema
 */
export function getTableSchema(tableName: keyof typeof DATABASE_SCHEMAS): string {
  return DATABASE_SCHEMAS[tableName];
}
