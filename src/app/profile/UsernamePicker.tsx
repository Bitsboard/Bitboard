"use client";

import React, { useState } from 'react';

export default function UsernamePicker() {
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/username', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data?.error || !data?.ok) {
        setError(data?.error || 'Could not save');
      } else {
        window.location.reload();
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSave} className="rounded-2xl border border-neutral-800 p-4 space-y-3">
      <div>
        <div className="text-sm text-neutral-400 mb-1">Choose a username</div>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. satoshi_21"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <div className="text-xs text-neutral-500 mt-1">3-20 chars, letters, numbers, _, -, .</div>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <button
        disabled={saving}
        className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
      >
        {saving ? 'Saving…' : 'Save username'}
      </button>
    </form>
  );
}


