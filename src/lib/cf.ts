// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '../shims/async_hooks';

export type CfEnv = {
  DB?: D1Database;
  [key: string]: unknown;
};

export async function getCfEnv(): Promise<CfEnv> {
  const mod = await import('@cloudflare/next-on-pages').catch(() => null as any);
  if (!mod || typeof mod.getRequestContext !== 'function') return {} as CfEnv;
  return (mod.getRequestContext().env ?? {}) as CfEnv;
}

export async function getD1(): Promise<D1Database | null> {
  const env = await getCfEnv();
  return (env.DB as D1Database) ?? null;
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


