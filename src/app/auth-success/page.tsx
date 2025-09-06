"use client";

import { useEffect } from 'react';

export default function AuthSuccessPage() {
  useEffect(() => {
    // This page is opened after successful Google OAuth
    // Check if we're in a popup or redirect flow
    
    if (window.opener) {
      // Popup flow: send message to parent and close
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
      window.close();
    } else {
      // Redirect flow: redirect to home page
      // Add a small delay to ensure session is set
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
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
