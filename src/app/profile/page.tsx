"use client";

import React, { useEffect, useState } from "react";
import UsernamePicker from "./UsernamePicker";

type Session = {
  user?: { name?: string; email?: string; image?: string };
  account?: {
    sso: string;
    email: string;
    username: string | null;
    verified: boolean;
    registeredAt: number;
    profilePhoto?: string | null;
    listings: Array<{ id: number; title: string; priceSat: number; createdAt: number }>;
  } | null;
} | null;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = (await res.json()) as { session: Session };
        setSession(data?.session ?? null);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      {loading && <p>Loading...</p>}
      {!loading && !session && (
        <div className="space-y-4">
          <p>You are not signed in.</p>
          <a href="/api/auth/login" className="inline-block rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-neutral-950">
            Sign in with Google
          </a>
        </div>
      )}
      {!loading && session && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" className="h-12 w-12 rounded-full" />
            )}
            <div>
              <p className="font-medium">{session.user?.name ?? session.user?.email}</p>
              <p className="text-sm text-neutral-500">{session.user?.email}</p>
            </div>
          </div>
          {/* Onboarding: pick username if missing */}
          {session.account && !session.account.username && (
            <UsernamePicker />
          )}
          {session.account && (
            <div className="rounded-2xl border border-neutral-800 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-neutral-400">SSO</div>
                  <div className="font-medium capitalize">{session.account.sso}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Verified</div>
                  <div className="font-medium">{session.account.verified ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-neutral-400">Registered</div>
                  <div>{new Date(session.account.registeredAt * 1000).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          {/* Listings */}
          {!!session?.account?.listings?.length && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Your listings</h2>
              <div className="divide-y divide-neutral-800 rounded-2xl border border-neutral-800">
                {session.account.listings.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium">{l.title}</div>
                      <div className="text-xs text-neutral-500">{new Date(l.createdAt * 1000).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-neutral-400">{l.priceSat} sats</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="rounded-xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}


