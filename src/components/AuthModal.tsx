"use client";

import React, { useState } from "react";
import { GoogleSignInOverlay } from "./GoogleSignInOverlay";
import type { User } from "@/lib/types";

interface AuthModalProps {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}

export function AuthModal({ onClose, onAuthed, dark }: AuthModalProps) {
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);

  const handleGoogleSuccess = (userData: any) => {
    // Transform the user data to match the expected User type
    onAuthed({
      id: userData.user.id || 'unknown',
      email: userData.user.email || 'unknown',
      handle: userData.user.username || null,
      hasChosenUsername: userData.user.hasChosenUsername || false
    });
  };

  return (
    <>
      {/* Main Auth Modal */}
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${dark ? 'bg-black/50' : 'bg-white/50'}`}>
        <div className={`rounded-2xl p-6 max-w-sm w-full mx-4 ${dark ? 'bg-neutral-900 border border-neutral-700' : 'bg-white border border-neutral-200'} shadow-2xl`}>
          <div className="text-center space-y-6">
            <div>
              <h2 className={`text-xl font-semibold ${dark ? 'text-white' : 'text-neutral-900'}`}>
                Sign in to bitsbarter
              </h2>
              <p className={`text-sm mt-2 ${dark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                Use your Google account to sign in. We don't share your email publicly.
              </p>
            </div>
            
            <button
              onClick={() => setShowGoogleSignIn(true)}
              className="flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow ring-1 ring-neutral-200 hover:bg-neutral-50 transition-colors w-full"
            >
              <span className="text-xl">G</span>
              <span>Continue with Google</span>
            </button>
            
            <div className="text-[11px] text-neutral-500">
              By continuing, you agree to our Terms.
            </div>
            
            <button
              onClick={onClose}
              className={`text-sm ${dark ? 'text-neutral-400 hover:text-neutral-300' : 'text-neutral-600 hover:text-neutral-800'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Google Sign-In Overlay */}
      <GoogleSignInOverlay
        open={showGoogleSignIn}
        onClose={() => setShowGoogleSignIn(false)}
        onSuccess={handleGoogleSuccess}
        dark={dark}
      />
    </>
  );
}
