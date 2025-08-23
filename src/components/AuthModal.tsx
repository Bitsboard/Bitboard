"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalCloseButton } from "./Modal";

type User = { id: string; email: string; handle: string };

interface AuthModalProps {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}

export function AuthModal({ onClose, onAuthed, dark }: AuthModalProps) {
  const [loginUrl, setLoginUrl] = useState<string>('/api/auth/login');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // Get current page URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    setLoginUrl(`/api/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
  }, []);

  // Check for authentication completion
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json() as any;
        if (data.session?.user) {
          // User is authenticated, call onAuthed
          onAuthed({
            id: data.session.user.username || 'unknown',
            email: data.session.user.email || 'unknown',
            handle: data.session.user.username || 'unknown'
          });
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      }
    };

    // Check auth status every 2 seconds while modal is open
    const interval = setInterval(checkAuth, 2000);
    return () => clearInterval(interval);
  }, [onAuthed]);

  return (
    <Modal open={true} onClose={onClose} dark={dark} size="sm" ariaLabel="Sign in to bitsbarter" zIndex={9999}>
      <ModalHeader dark={dark}>
        <ModalTitle>Sign in</ModalTitle>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="text-sm text-neutral-400">Use your Google account to sign in. We don't share your email publicly.</div>
        <a 
          href={loginUrl} 
          onClick={() => setIsAuthenticating(true)}
          className="flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAuthenticating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-900"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span className="text-xl">G</span>
              <span>Continue with Google</span>
            </>
          )}
        </a>
        <div className="text-[11px] text-neutral-500">By continuing, you agree to our Terms.</div>
      </ModalBody>
    </Modal>
  );
}
