"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalCloseButton, ModalBody } from './Modal';

interface GoogleSignInOverlayProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  dark: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleSignInOverlay({ open, onClose, onSuccess, dark }: GoogleSignInOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsGoogleLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsGoogleLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (open && isGoogleLoaded && buttonRef.current && window.google?.accounts) {
      try {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        });
      } catch (err) {
        console.error('Error initializing Google Sign-In:', err);
        setError('Failed to initialize Google Sign-In');
      }
    }
  }, [open, isGoogleLoaded, dark]);

  const handleCredentialResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);

      // Send the credential to your backend
      const result = await fetch('/api/auth/google-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      if (!result.ok) {
        throw new Error('Authentication failed');
      }

      const userData = await result.json();
      onSuccess(userData);
      onClose();
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSignIn = () => {
    if (window.google?.accounts) {
      window.google.accounts.id.prompt();
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} dark={dark} size="sm" ariaLabel="Sign in with Google">
      <ModalHeader dark={dark}>
        <ModalTitle>Sign in with Google</ModalTitle>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      <ModalBody className="space-y-6">
        {error && (
          <div className={`rounded-lg p-3 text-sm ${dark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}
        
        <div className="text-center space-y-4">
          <p className={`text-sm ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
            Choose your preferred sign-in method
          </p>
          
          {/* Google Sign-In Button Container */}
          <div className="flex justify-center">
            <div ref={buttonRef} className="w-full max-w-[280px]" />
          </div>
          
          {/* Manual prompt button as fallback */}
          <button
            onClick={handleManualSignIn}
            disabled={!isGoogleLoaded || isLoading}
            className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              dark 
                ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 disabled:opacity-50' 
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50'
            }`}
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        <div className={`text-xs text-center ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </ModalBody>
    </Modal>
  );
}
