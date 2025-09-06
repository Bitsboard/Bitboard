"use client";

import { useEffect } from 'react';

export default function AuthSuccessPage() {
  useEffect(() => {
    // Parse search params from Google's redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    const chan = new BroadcastChannel("oauth-google");
    chan.postMessage({ type: "OAUTH_READY" });

    // Heartbeat so parent can detect if we suddenly go away.
    const HEARTBEAT_INTERVAL_MS = 800;
    const hb = setInterval(() => {
      chan.postMessage({ type: "OAUTH_HEARTBEAT" });
    }, HEARTBEAT_INTERVAL_MS);

    // Send outcome
    if (error) {
      chan.postMessage({ type: "OAUTH_ERROR", error });
    } else if (code) {
      chan.postMessage({ type: "OAUTH_SUCCESS", code, state });
    }

    // If parent acknowledges, close the popup
    chan.onmessage = (ev) => {
      if (ev.data && ev.data.type === "OAUTH_CLOSE") {
        clearInterval(hb);
        chan.close();
        // Best-effort close; if blocked by browser, user can still close manually.
        window.close();
      }
    };

    // Fallback: if user navigates away or closes
    // (Not guaranteed to fire, but harmless to include)
    window.addEventListener("pagehide", () => {
      clearInterval(hb);
      chan.close();
    });

    // Cleanup on unmount
    return () => {
      clearInterval(hb);
      chan.close();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h1>
        <p className="text-gray-600">Closing popup and redirecting...</p>
      </div>
    </div>
  );
}
