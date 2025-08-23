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
            handle: data.session.user.username || 'unknown',
            hasChosenUsername: true, // Assume existing users have chosen usernames
            image: data.session.user.image || undefined
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
    // Ensure the user object includes the image from the session
    if (u && !u.image) {
      // Try to get image from current session
      fetch('/api/auth/session')
        .then(response => response.json())
        .then((data: any) => {
          if (data.session?.user?.image) {
            setUser({ ...u, image: data.session.user.image });
          } else {
            setUser(u);
          }
        })
        .catch(() => setUser(u));
    } else {
      setUser(u);
    }
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


