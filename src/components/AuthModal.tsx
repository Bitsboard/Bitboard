"use client";

import React, { useState, useEffect } from "react";
import type { User } from "@/lib/types";

interface AuthModalProps {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}

export function AuthModal({ onClose, onAuthed, dark }: AuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginUrl, setLoginUrl] = useState<string>('/api/auth/login');

  useEffect(() => {
    // Get current page URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    setLoginUrl(`/api/auth/login?redirect=${encodeURIComponent(currentUrl)}&popup=true`);
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
            handle: data.session.user.username || null,
            hasChosenUsername: data.session.user.hasChosenUsername || false
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

  const handleGoogleSignIn = () => {
    setIsAuthenticating(true);
    
    // Open OAuth flow in a popup window
    const popup = window.open(
      loginUrl,
      'googleSignIn',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    if (popup) {
      // Listen for success message from popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          setIsAuthenticating(false);
          // The popup will close itself, and we'll detect the session change
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setIsAuthenticating(false);
          }
        } catch (error) {
          // Cross-Origin-Opener-Policy blocks window.closed check
          // This is expected behavior, so we'll rely on the message listener
          console.log('Popup closed check blocked by CORS policy (expected)');
        }
      }, 1000);

      // Timeout after 30 seconds if no response
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        setIsAuthenticating(false);
        if (popup && !popup.closed) {
          popup.close();
        }
      }, 30000);
    } else {
      // Fallback to redirect if popup blocked
      window.location.href = loginUrl;
    }
  };

  return (
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
            onClick={handleGoogleSignIn}
            disabled={isAuthenticating}
            className="flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow ring-1 ring-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
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
          </button>
          
          <div className="text-[11px] text-neutral-500">
            By continuing, you agree to our{' '}
            <a 
              href="/terms" 
              className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms
            </a>.
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
  );
}
