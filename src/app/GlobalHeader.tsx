"use client";

import React from "react";
import { Nav, NewListingModal, AuthModal } from "@/components";
import { useEffect, useState } from "react";

export default function GlobalHeader() {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [showNew, setShowNew] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [unit, setUnit] = useState<"sats" | "BTC">("sats");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [dark, setDark] = useState(true);
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

  // Initialize UI prefs
  useEffect(() => {
    try {
      const savedUnit = (localStorage.getItem('priceUnit') as "sats" | "BTC" | null) || "sats";
      setUnit(savedUnit === 'BTC' ? 'BTC' : 'sats');
      const savedLayout = (localStorage.getItem('layoutPref') as "grid" | "list" | null) || "grid";
      setLayout(savedLayout === 'list' ? 'list' : 'grid');
      const isDark = document.documentElement.classList.contains('dark');
      setDark(isDark);
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
      setDark(el.classList.contains('dark'));
    } catch {}
  }
  function onAuth() { setShowAuth(true); }
  return (
    <>
      <Nav
        onPost={onPost}
        onToggleTheme={onToggleTheme}
        dark={dark}
        user={authed ? { id: 'me', email: '', handle: '' } : null}
        onAuth={onAuth}
        unit={unit}
        setUnit={(u) => { try { localStorage.setItem('priceUnit', u); } catch {}; setUnit(u); }}
        layout={layout}
        setLayout={(l) => { try { localStorage.setItem('layoutPref', l); } catch {}; setLayout(l); }}
        avatarUrl={avatar}
      />
      {showNew && (
        <NewListingModal
          dark={dark}
          onClose={() => setQueryOpen(false)}
          onPublish={() => setQueryOpen(false)}
        />
      )}
      {showAuth && (
        <AuthModal dark={dark} onClose={() => setShowAuth(false)} onAuthed={() => setShowAuth(false)} />
      )}
    </>
  );
}


