"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { useSettings } from "@/lib/settings";
import type { User } from "@/lib/types";

export default function GlobalHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const lang = useLang();
  const { theme } = useSettings();

  // Initialize theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [theme]);

  const handlePost = () => {
    if (user) {
      setShowNew(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuth = () => {
    setShowAuth(true);
  };

  const handleAuthed = (u: User) => {
    setUser(u);
    setShowAuth(false);
  };

  return (
    <>
      <Nav
        onPost={handlePost}
        user={user}
        onAuth={handleAuth}
        avatarUrl={user?.image}
      />
      {/* Modals would be rendered here if needed */}
    </>
  );
}


