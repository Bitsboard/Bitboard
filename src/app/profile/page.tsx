"use client";

import React, { useEffect, useState } from "react";

type Session = { user?: { name?: string; email?: string; image?: string } } | null;

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


