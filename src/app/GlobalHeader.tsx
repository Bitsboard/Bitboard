"use client";

import { useState, useEffect } from "react";
import { Nav, AuthModal } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { useSettings, useUser, useModals } from "@/lib/settings";
import { useTheme } from "@/lib/contexts/ThemeContext";

import type { User } from "@/lib/types";

export default function GlobalHeader() {
  const lang = useLang();
  const { user, setUser } = useUser();
  const { modals, setModal } = useModals();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json() as any;
        if (data.session?.user && !user) {
          // User is authenticated but not in state, restore user
          setUser({
            id: data.session.user.username || 'unknown',
            email: data.session.user.email || 'unknown',
            handle: data.session.user.username || 'unknown'
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();
  }, [user, setUser]);

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
      {modals.showAuth && (
        <AuthModal
          dark={dark}
          onClose={() => setModal('showAuth', false)}
          onAuthed={handleAuthed}
        />
      )}
    </>
  );
}


