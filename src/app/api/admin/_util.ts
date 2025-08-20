import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function getAdminDb(req: Request): Promise<D1Database> {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
  if (!token) throw new Error('unauthorized');
  const payload = await verifyJwtHS256(token, getAuthSecret());
  if (!payload?.email) throw new Error('unauthorized');
  const { env } = getRequestContext();
  const db = (env as any).DB as D1Database | undefined;
  if (!db) throw new Error('no_db');
  await db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, username TEXT UNIQUE, sso TEXT, verified INTEGER DEFAULT 0, is_admin INTEGER DEFAULT 0, banned INTEGER DEFAULT 0, created_at INTEGER NOT NULL, image TEXT)').run();
  try { await db.prepare('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0').run(); } catch {}
  try { await db.prepare('ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0').run(); } catch {}
  const res = await db.prepare('SELECT is_admin FROM users WHERE email = ?').bind(payload.email).all();
  if (!Boolean(res.results?.[0]?.is_admin)) throw new Error('forbidden');
  return db;
}


