export const runtime = 'edge';

import React from 'react';
import { getAuthSecret, verifyJwtHS256 } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

async function getSession(req: Request) {
  const cookieHeader = (req.headers as any).get?.('cookie') || '';
  const token = /(?:^|; )session=([^;]+)/.exec(cookieHeader)?.[1];
  if (!token) return null as any;
  const payload = await verifyJwtHS256(token, getAuthSecret());
  return payload;
}

async function isAdmin(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    if (!db) return false;
    await db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      sso TEXT,
      verified INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      image TEXT
    )`).run();
    const res = await db.prepare('SELECT is_admin FROM users WHERE email = ?').bind(email).all();
    return Boolean(res.results?.[0]?.is_admin);
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  // Using dynamic rendering to read cookies
  const req = (globalThis as any).request as Request | undefined;
  const payload = req ? await getSession(req) : null;
  const allowed = await isAdmin((payload as any)?.email ?? null);
  if (!allowed) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-bold mb-2">Admin</h1>
        <p className="text-neutral-500">You do not have access.</p>
      </div>
    );
  }

  // Fetch sample tables
  let users: any[] = [];
  let listings: any[] = [];
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB as D1Database | undefined;
    if (db) {
      const u = await db.prepare('SELECT id, email, username, verified, is_admin AS isAdmin, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 50').all();
      users = u.results ?? [];
      const l = await db.prepare('SELECT id, title, price_sat AS priceSat, posted_by AS postedBy, created_at AS createdAt FROM listings ORDER BY created_at DESC LIMIT 50').all();
      listings = l.results ?? [];
    }
  } catch {}

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold mb-6">Admin dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Users</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="p-2">Email</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Verified</th>
                  <th className="p-2">Admin</th>
                  <th className="p-2">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.username ?? '-'}</td>
                    <td className="p-2">{u.verified ? 'Yes' : 'No'}</td>
                    <td className="p-2">{u.isAdmin ? 'Yes' : 'No'}</td>
                    <td className="p-2">{new Date((u.createdAt || 0) * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Listings</h2>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Price (sats)</th>
                  <th className="p-2">Posted By</th>
                  <th className="p-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2">{l.title}</td>
                    <td className="p-2">{l.priceSat}</td>
                    <td className="p-2">{l.postedBy ?? '-'}</td>
                    <td className="p-2">{new Date((l.createdAt || 0) * 1000).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <p className="text-xs text-neutral-500 mt-6">Search engines: noindex</p>
    </div>
  );
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};


