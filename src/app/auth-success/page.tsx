"use client";

import { useEffect } from 'react';

export default function AuthSuccessPage() {
  useEffect(() => {
    // This page is opened in a popup after successful Google OAuth
    // We need to close the popup and communicate success to the parent
    
    // Send message to parent window
    if (window.opener) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
      // Close the popup
      window.close();
    } else {
      // Fallback: redirect to home if not opened as popup
      window.location.href = '/';
    }
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
