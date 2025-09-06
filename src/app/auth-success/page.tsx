"use client";

import { useEffect } from 'react';

export default function AuthSuccessPage() {
  useEffect(() => {
    console.log("🔔 AuthSuccess: useEffect running");
    
    // Parse search params from Google's redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    
    console.log("🔔 AuthSuccess: params", { code: !!code, state: !!state, error });

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
      console.log("🔔 AuthSuccess: tryCloseAggressively called");
      
      // Try multiple close strategies immediately
      try { 
        console.log("🔔 AuthSuccess: trying window.close()");
        window.close(); 
      } catch (e) {
        console.log("🔔 AuthSuccess: window.close() failed", e);
      }
      
      try { 
        console.log("🔔 AuthSuccess: trying location.replace()");
        location.replace("about:blank"); 
      } catch (e) {
        console.log("🔔 AuthSuccess: location.replace() failed", e);
      }
      
      try { 
        console.log("🔔 AuthSuccess: trying location.href");
        location.href = "about:blank"; 
      } catch (e) {
        console.log("🔔 AuthSuccess: location.href failed", e);
      }
      
      try { 
        console.log("🔔 AuthSuccess: trying location.assign()");
        location.assign("about:blank"); 
      } catch (e) {
        console.log("🔔 AuthSuccess: location.assign() failed", e);
      }
      
      // Self-target then close (older trick)
      try {
        const w = window.open("", "_self");
        w?.close?.();
      } catch {}

      // Show manual close button immediately (no delay)
      document.body.innerHTML = `
        <div style="font:14px system-ui; padding:24px; text-align:center; background: #f0f9ff; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
          <h2 style="color: #059669; margin-bottom: 16px;">✅ Authentication Successful!</h2>
          <p style="margin-bottom: 20px; color: #374151;">You can now close this window.</p>
          <button id="closeBtn" style="padding:12px 24px; border-radius:8px; background: #3b82f6; color: white; border: none; cursor: pointer; font-size: 16px; font-weight: 600;">
            Close Window
          </button>
        </div>`;
      
      document.getElementById("closeBtn")?.addEventListener("click", () => {
        // Retry all close methods on user gesture
        try { window.close(); } catch {}
        try { location.replace("about:blank"); } catch {}
        try { location.href = "about:blank"; } catch {}
        try { location.assign("about:blank"); } catch {}
      });
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
      
      // Additional aggressive close attempts with timing
      setTimeout(() => {
        try { window.close(); } catch {}
        try { location.replace("about:blank"); } catch {}
      }, 100);
      
      setTimeout(() => {
        try { window.close(); } catch {}
        try { location.href = "about:blank"; } catch {}
      }, 500);
      
      setTimeout(() => {
        try { window.close(); } catch {}
        try { location.assign("about:blank"); } catch {}
      }, 1000);
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
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing authentication...</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}
