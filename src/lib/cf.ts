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
  // Minimal schema for chats and messages
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER,
      buyer_id TEXT,
      seller_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )`)
    .run();

  await db
    .prepare(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      from_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )`)
    .run();

  await db.prepare('CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON messages(chat_id, created_at DESC)').run();
}


