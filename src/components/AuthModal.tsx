"use client";

import React, { useState, useEffect, useRef } from "react";
import type { User } from "@/lib/types";

interface AuthModalProps {
  onClose: () => void;
  onAuthed: (u: User) => void;
  dark: boolean;
}

type OAuthMsg =
  | { type: "OAUTH_READY" }
  | { type: "OAUTH_HEARTBEAT" }
  | { type: "OAUTH_SUCCESS"; code: string; state?: string }
  | { type: "OAUTH_ERROR"; error: string }
  | { type: "OAUTH_CLOSE" };

export function AuthModal({ onClose, onAuthed, dark }: AuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginUrl, setLoginUrl] = useState<string>('/api/auth/login');
  const chanRef = useRef<BroadcastChannel | null>(null);
  const heartbeatTimer = useRef<number | null>(null);
  const heartbeatMisses = useRef(0);
  const HEARTBEAT_INTERVAL_MS = 800;    // how often popup pings
  const HEARTBEAT_GRACE_MISSES = 4;     // ~3–4 missed beats => assume closed

  useEffect(() => {
    // Get current page URL to redirect back after login
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    setLoginUrl(`/api/auth/login?redirect=${encodeURIComponent(currentUrl)}&popup=true`);
    return () => cleanup();
  }, []);

  // Optional: storage-based confirmation (extra safety)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "oauth:last_success") {
        cleanup(); // already done on OAUTH_SUCCESS, but this covers edge cases
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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

  function cleanup() {
    if (heartbeatTimer.current) {
      window.clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
    if (chanRef.current) {
      chanRef.current.close();
      chanRef.current = null;
    }
    setIsAuthenticating(false);
  }

  function beginHeartbeatWatch() {
    // Every interval, if we *didn't* receive a heartbeat since last tick, count a miss.
    heartbeatTimer.current = window.setInterval(() => {
      heartbeatMisses.current += 1;
      if (heartbeatMisses.current >= HEARTBEAT_GRACE_MISSES) {
        // Treat as popup-closed or crashed.
        console.info("OAuth popup presumed closed (missed heartbeats).");
        cleanup();
      }
      // Reset expectation for next beat; receiving a beat sets it back to 0.
    }, HEARTBEAT_INTERVAL_MS + 300); // a little more than popup ping to avoid jitter
  }

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);

    // Use noopener so there is no live reference needed.
    // (We won't touch popup.closed at all.)
    window.open(
      loginUrl,
      "_blank",
      "popup=yes,width=520,height=700,noopener,noreferrer"
    );

    // Create a fresh channel and listeners
    chanRef.current?.close();
    const chan = new BroadcastChannel("oauth-google");
    chanRef.current = chan;

    heartbeatMisses.current = 0;
    beginHeartbeatWatch();

    chan.onmessage = async (ev: MessageEvent<OAuthMsg>) => {
      const msg = ev.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "OAUTH_READY": {
          // popup is alive and on our origin
          heartbeatMisses.current = 0;
          break;
        }
        case "OAUTH_HEARTBEAT": {
          heartbeatMisses.current = 0;
          break;
        }
        case "OAUTH_SUCCESS": {
          // Exchange code for tokens on your backend
          try {
            // The session should already be created by the callback
            // Just refresh the page to show the logged-in state
            window.location.reload();
          } catch (e) {
            console.error(e);
          } finally {
            // Do NOT wait for popup to close or send OAUTH_CLOSE.
            cleanup(); // stops heartbeat + closes BroadcastChannel + setIsAuthenticating(false)
          }
          break;
        }
        case "OAUTH_ERROR": {
          console.error("OAuth error:", (msg as any).error);
          chan.postMessage({ type: "OAUTH_CLOSE" });
          cleanup();
          break;
        }
      }
    };
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm ${dark ? 'bg-black/60' : 'bg-white/60'}`}>
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
