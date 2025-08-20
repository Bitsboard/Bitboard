"use client";

import React from "react";
import { Nav, NewListingModal, AuthModal } from "@/components";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";

export default function GlobalHeader() {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Use centralized settings
  const { theme, unit, layout, setUnit, setLayout, toggleTheme } = useSettings();

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
    } catch { }
  }, []);

  function setQueryOpen(isOpen: boolean) {
    try {
      const url = new URL(window.location.href);
      if (isOpen) url.searchParams.set('new', '1');
      else url.searchParams.delete('new');
      window.history.replaceState(null, "", url.toString());
      setShowNew(isOpen);
    } catch { }
  }

  function onPost() {
    setQueryOpen(true);
  }

  function onToggleTheme() {
    toggleTheme();
  }

  function onAuth() { setShowAuth(true); }

  return (
    <>
      <Nav
        onPost={onPost}
        user={authed ? { id: 'me', email: '', handle: '' } : null}
        onAuth={onAuth}
        avatarUrl={avatar}
      />
      {showNew && (
        <NewListingModal
          dark={theme === 'dark'}
          onClose={() => setQueryOpen(false)}
          onPublish={() => setQueryOpen(false)}
        />
      )}
      {showAuth && (
        <AuthModal dark={theme === 'dark'} onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />
      )}
    </>
  );
}


