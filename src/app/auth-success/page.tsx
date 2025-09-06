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

    function notifyParentDone() {
      try { chan.postMessage({ type: "OAUTH_SUCCESS", code, state }); } catch {}
      try { window.opener?.postMessage({ type: "OAUTH_SUCCESS", code, state }, "*"); } catch {}
      try { localStorage.setItem("oauth:last_success", String(Date.now())); } catch {}
    }

    function tryCloseAggressively() {
      // 1) Straight close (works if script-opened)
      window.close();

      // 2) Some browsers close after replacing to about:blank or same-origin
      try { location.replace("about:blank"); } catch {}

      // 3) Self-target then close (older trick; may be ignored but harmless)
      try {
        const w = window.open("", "_self");
        w?.close?.();
      } catch {}

      // 4) As a last resort, show a manual-close link
      setTimeout(() => {
        document.body.innerHTML = `
          <div style="font:14px system-ui; padding:24px; text-align:center">
            <h2>Authentication Successful</h2>
            <p>You can close this window.</p>
            <button id="closeBtn" style="padding:8px 14px; border-radius:8px">Close</button>
          </div>`;
        document.getElementById("closeBtn")?.addEventListener("click", () => {
          tryCloseAggressively(); // retry on user gesture (more likely to succeed)
        });
      }, 150); // give earlier attempts a moment
    }

    // Send outcome then close NOW (don't wait for parent)
    if (error) {
      chan.postMessage({ type: "OAUTH_ERROR", error });
      clearInterval(hb);
      chan.close();
      tryCloseAggressively();
    } else if (code) {
      notifyParentDone();
      clearInterval(hb);
      chan.close();
      tryCloseAggressively();
    }

    // Clean up on navigate-away
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
