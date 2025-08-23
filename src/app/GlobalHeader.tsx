"use client";

import { useState, useEffect } from "react";
import { Nav } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { useSettings, useUser, useModals } from "@/lib/settings";

import type { User } from "@/lib/types";

export default function GlobalHeader() {
  const lang = useLang();
  const { theme } = useSettings();
  const { user, setUser } = useUser();
  const { modals, setModal } = useModals();
  const dark = theme === 'dark';

  const handlePost = () => {
    if (user) {
      setModal('showNew', true);
    } else {
      setModal('showAuth', true);
    }
  };

  const handleAuth = () => {
    setModal('showAuth', true);
  };

  const handleAuthed = (u: User) => {
    setUser(u);
    setModal('showAuth', false);
  };

  return (
    <>
      <Nav
        onPost={handlePost}
        user={user}
        onAuth={handleAuth}
        avatarUrl={user?.image}
      />
    </>
  );
}


