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
  const req = (globalThis as any).request as Request | undefined;
  const payload = req ? await getSession(req) : null;
  const email = (payload as any)?.email as string | undefined;
  const allowed = await isAdmin(email) || email === 'georged1997@gmail.com';
  if (!allowed) {
    return (
      <meta httpEquiv="refresh" content="0; url=/" />
    ) as any;
  }
  return (
    <div className="mx-auto max-w-6xl p-6" suppressHydrationWarning>
      <h1 className="text-2xl font-bold mb-6">Admin dashboard</h1>
      <AdminClient />
    </div>
  );
}

function AdminClient() {
  'use client';
  const [users, setUsers] = React.useState<any[]>([]);
  const [listings, setListings] = React.useState<any[]>([]);
  const [uTotal, setUTotal] = React.useState(0);
  const [lTotal, setLTotal] = React.useState(0);
  const [uPage, setUPage] = React.useState(0);
  const [lPage, setLPage] = React.useState(0);
  const [uQuery, setUQuery] = React.useState('');
  const [lQuery, setLQuery] = React.useState('');
  const limit = 20;

  async function load() {
    const [ur, lr] = await Promise.all([
      fetch(`/api/admin/users/list?limit=${limit}&offset=${uPage * limit}` + (uQuery ? `&q=${encodeURIComponent(uQuery)}` : '')),
      fetch(`/api/admin/listings/list?limit=${limit}&offset=${lPage * limit}` + (lQuery ? `&q=${encodeURIComponent(lQuery)}` : '')),
    ]);
    if (ur.ok) {
      const j = (await ur.json()) as { users?: any[]; total?: number };
      setUsers(j.users || []);
      setUTotal(j.total || 0);
    }
    if (lr.ok) {
      const j = (await lr.json()) as { listings?: any[]; total?: number };
      setListings(j.listings || []);
      setLTotal(j.total || 0);
    }
  }

  React.useEffect(() => { load(); }, [uPage, lPage, uQuery, lQuery]);

  function toast(msg: string) {
    // Simple inline toast
    alert(msg);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Users</h2>
          </div>
          <div className="flex items-center justify-between mb-2">
            <input value={uQuery} onChange={(e) => { setUQuery(e.target.value); setUPage(0); }} placeholder="Search users (email/username)" className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm" />
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
                  <th className="p-2">Actions</th>
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
                    <td className="p-2">
                      <button
                        onClick={async () => {
                          if (!confirm(`${u.verified ? 'Unverify' : 'Verify'} this user?`)) return;
                          const res = await fetch('/api/admin/users/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id, verified: !u.verified }) });
                          if (res.ok) { toast('Updated'); load(); } else toast('Failed');
                        }}
                        className="rounded-md border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-900"
                      >
                        {u.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`${u.banned ? 'Unban' : 'Ban'} this user?`)) return;
                          const res = await fetch('/api/admin/users/ban', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: u.id, banned: !u.banned }) });
                          if (res.ok) { toast('Updated'); load(); } else toast('Failed');
                        }}
                        className="ml-2 rounded-md border border-red-700 text-red-300 px-2 py-1 text-xs hover:bg-red-900/30"
                      >
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-xs">
              <button disabled={uPage === 0} onClick={() => setUPage((p) => Math.max(0, p - 1))} className="rounded-md border border-neutral-700 px-2 py-1 disabled:opacity-50">Prev</button>
              <div>Page {uPage + 1} of {Math.max(1, Math.ceil(uTotal / limit))}</div>
              <button disabled={(uPage + 1) * limit >= uTotal} onClick={() => setUPage((p) => p + 1)} className="rounded-md border border-neutral-700 px-2 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Listings</h2>
          </div>
          <div className="flex items-center justify-between mb-2">
            <input value={lQuery} onChange={(e) => { setLQuery(e.target.value); setLPage(0); }} placeholder="Search listings (title)" className="w-64 rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1 text-sm" />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Price (sats)</th>
                  <th className="p-2">Posted By</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="p-2">{l.title}</td>
                    <td className="p-2">{l.priceSat}</td>
                    <td className="p-2">{l.postedBy ?? '-'}</td>
                    <td className="p-2">{new Date((l.createdAt || 0) * 1000).toLocaleString()}</td>
                    <td className="p-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Delete listing?')) return;
                          const res = await fetch('/api/admin/listings/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: l.id }) });
                          if (res.ok) { toast('Deleted'); load(); } else toast('Failed');
                        }}
                        className="rounded-md border border-red-700 text-red-300 px-2 py-1 text-xs hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-xs">
              <button disabled={lPage === 0} onClick={() => setLPage((p) => Math.max(0, p - 1))} className="rounded-md border border-neutral-700 px-2 py-1 disabled:opacity-50">Prev</button>
              <div>Page {lPage + 1} of {Math.max(1, Math.ceil(lTotal / limit))}</div>
              <button disabled={(lPage + 1) * limit >= lTotal} onClick={() => setLPage((p) => p + 1)} className="rounded-md border border-neutral-700 px-2 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
      </div>
      <p className="text-xs text-neutral-500 mt-6">Search engines: noindex</p>
    </>
  );
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};


