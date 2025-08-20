"use client";

import React from "react";
import { Nav } from "@/components";
import { useEffect, useState } from "react";

export default function GlobalHeader() {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
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

  function onPost() { window.location.assign("/#post"); }
  function onToggleTheme() {
    try {
      const el = document.documentElement;
      el.classList.toggle('dark');
      localStorage.setItem('theme', el.classList.contains('dark') ? 'dark' : 'light');
    } catch {}
  }
  function onAuth() { window.location.assign("/en/profile"); }
  return (
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
  );
}


