"use client";

import React from "react";
import { Nav, NewListingModal } from "@/components";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function GlobalHeader() {
  const [authed, setAuthed] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const isNew = searchParams?.get("new") === "1";
    setShowNew(isNew);
  }, [searchParams]);

  function setQueryOpen(isOpen: boolean) {
    try {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (isOpen) params.set("new", "1");
      else params.delete("new");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } catch {
      // no-op
    }
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


