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

export function AuthModal({ onClose, onAuthed: _onAuthed, dark }: AuthModalProps) {
  const [loginUrl, setLoginUrl] = useState<string>('/api/auth/login');

  useEffect(() => {
    // Get current page URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    setLoginUrl(`/api/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
  }, []);

  return (
    <Modal open={true} onClose={onClose} dark={dark} size="sm" ariaLabel="Sign in to bitsbarter">
      <ModalHeader dark={dark}>
        <ModalTitle>Sign in</ModalTitle>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="text-sm text-neutral-400">Use your Google account to sign in. We don't share your email publicly.</div>
        <a href={loginUrl} className="flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow ring-1 ring-neutral-200 hover:bg-neutral-50">
          <span className="text-xl">G</span>
          <span>Continue with Google</span>
        </a>
        <div className="text-[11px] text-neutral-500">By continuing, you agree to our Terms.</div>
      </ModalBody>
    </Modal>
  );
}
