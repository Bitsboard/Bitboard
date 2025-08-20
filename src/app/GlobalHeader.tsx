"use client";

import React from "react";
import { Nav, NewListingModal } from "@/components";
import { useEffect, useState } from "react";

export default function GlobalHeader() {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [showNew, setShowNew] = useState(false);
  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(r => r.json() as Promise<{ session?: any }>)
      .then((d) => {
        const s = d?.session;
        setAuthed(Boolean(s));
        setAvatar(s?.user?.image || s?.account?.profilePhoto || undefined);
      })
      .catch(() => setAuthed(false));
  }, []);

  // Initialize modal open state from URL on mount
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      setShowNew(sp.get('new') === '1');
    } catch {}
  }, []);

  function setQueryOpen(isOpen: boolean) {
    try {
      const url = new URL(window.location.href);
      if (isOpen) url.searchParams.set('new', '1');
      else url.searchParams.delete('new');
      window.history.replaceState(null, "", url.toString());
      setShowNew(isOpen);
    } catch {}
  }

  function onPost() {
    setQueryOpen(true);
  }
  function onToggleTheme() {
    try {
      const el = document.documentElement;
      el.classList.toggle('dark');
      localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
    } catch {}
  }
  function onAuth() { window.location.assign("/en/profile"); }
  return (
    <>
      <Nav
        onPost={onPost}
        onToggleTheme={onToggleTheme}
        dark={true}
        user={authed ? { id: 'me', email: '', handle: '' } : null}
        onAuth={onAuth}
        unit={"sats"}
        setUnit={() => {}}
        layout={"grid"}
        setLayout={() => {}}
        avatarUrl={avatar}
      />
      {showNew && (
        <NewListingModal
          dark={true}
          onClose={() => setQueryOpen(false)}
          onPublish={() => setQueryOpen(false)}
        />
      )}
    </>
  );
}


