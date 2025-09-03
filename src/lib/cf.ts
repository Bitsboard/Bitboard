export type CfEnv = {
  DB?: D1Database;
  [key: string]: unknown;
};

export async function getCfEnv(): Promise<CfEnv> {
  try {
    // Try the standard Cloudflare Pages approach first
    const mod = await import('@cloudflare/next-on-pages').catch(() => null as any);
    if (mod && typeof mod.getRequestContext === 'function') {
      const context = mod.getRequestContext();
      if (context?.env?.DB) {
        return context.env as CfEnv;
      }
    }
    
    // Try alternative approach for edge runtime
    if (typeof globalThis !== 'undefined' && (globalThis as any).__env__) {
      return (globalThis as any).__env__ as CfEnv;
    }
    
    // Try accessing process.env (fallback)
    if (typeof process !== 'undefined' && process.env) {
      return process.env as any;
    }
    
    return {} as CfEnv;
  } catch (error) {
    console.error('Error in getCfEnv:', error);
    return {} as CfEnv;
  }
}

export async function getD1(): Promise<D1Database | null> {
  try {
    const env = await getCfEnv();
    
    if (env.DB) {
      
      // ✅ OPTIMIZATION: Set database optimization hints
      try {
        const db = env.DB as D1Database;
        
        // Enable WAL mode for better concurrent performance
        await db.prepare('PRAGMA journal_mode = WAL').run();
        
        // Set page size for optimal performance
        await db.prepare('PRAGMA page_size = 4096').run();
        
        // Enable memory-mapped I/O for better performance
        await db.prepare('PRAGMA mmap_size = 268435456').run(); // 256MB
        
        // Set cache size for better performance
        await db.prepare('PRAGMA cache_size = -64000').run(); // 64MB
        
        // Enable synchronous mode for better performance (NORMAL is a good balance)
        await db.prepare('PRAGMA synchronous = NORMAL').run();
        
        return db;
      } catch (optimizationError) {
        return env.DB as D1Database;
      }
    }
    
    
    return null;
  } catch (error) {
    console.error('Error in getD1:', error);
    return null;
  }
}

export async function ensureChatSchema(db: D1Database): Promise<void> {
  // Create chats table with TEXT PRIMARY KEY to match the actual schema
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      listing_id INTEGER NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      last_message_at INTEGER DEFAULT (strftime('%s','now'))
    )`)
    .run();

  // Create messages table with TEXT PRIMARY KEY to match the actual schema
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      text TEXT NOT NULL CHECK (length(text) > 0 AND length(text) <= 1000),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      read_at INTEGER
    )`)
    .run();

  // Create indexes for performance
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_chats_listing_id ON chats(listing_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at DESC)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_messages_from_id ON messages(from_id)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)').run();
}


