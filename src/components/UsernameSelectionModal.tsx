"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalCloseButton } from "./Modal";
import { validateUsername } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UsernameSelectionModalProps {
  dark: boolean;
  onUsernameSelected: (username: string) => void;
  onClose: () => void;
  isClosing?: boolean;
}

export function UsernameSelectionModal({ dark, onUsernameSelected, onClose, isClosing = false }: UsernameSelectionModalProps) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  // Reset state when username changes
  useEffect(() => {
    if (username.length >= 3) {
      setError(null);
      setIsAvailable(null);
      checkUsernameAvailability();
    } else {
      setIsAvailable(null);
      setError(null);
    }
  }, [username]);

  const checkUsernameAvailability = async () => {
    if (username.length < 3) return;

    const validation = validateUsername(username);
    if (!validation.isValid) {
      setError(validation.error || "Invalid username");
      setIsAvailable(false);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch("/api/users/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await response.json() as { available?: boolean; error?: string };
      
      if (response.ok) {
        setIsAvailable(data.available ?? false);
        setError(null);
      } else {
        setError(data.error || "Failed to check username");
        setIsAvailable(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !isAvailable) return;

    setIsSubmitting(true);
    try {
      onUsernameSelected(username);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) return (
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
    );
    if (isAvailable === null) return null;
    if (isAvailable) return (
      <div className="flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
    return (
      <div className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  const getStatusText = () => {
    if (isChecking) return "Checking availability...";
    if (isAvailable === null) return "";
    if (isAvailable) return "Username is available!";
    return "Username is taken";
  };

  const getStatusColor = () => {
    if (isChecking) return "text-blue-600";
    if (isAvailable === null) return "text-gray-500";
    if (isAvailable) return "text-green-600";
    return "text-red-600";
  };

  const getInputBorderColor = () => {
    if (focused) return "ring-2 ring-blue-500 border-blue-500";
    if (isAvailable === true) return "ring-2 ring-green-500 border-green-500";
    if (isAvailable === false) return "ring-2 ring-red-500 border-red-500";
    return "border-gray-300 dark:border-gray-600";
  };

  return (
    <Modal 
      open={true} 
      onClose={onClose}
      dark={dark} 
      size="lg" 
      ariaLabel="Choose your username"
      zIndex={10000}
    >
      <ModalHeader dark={dark}>
        <div className="text-center w-full">
          <div className="mb-3">
            <div className={cn(
              "w-16 h-16 mx-auto rounded-full flex items-center justify-center",
              dark ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
            )}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Bitsbarter!
          </div>
          <p className={cn(
            "text-sm mt-2",
            dark ? "text-gray-300" : "text-gray-600"
          )}>
            Choose your unique username to get started
          </p>
        </div>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      
      <ModalBody className="space-y-8 px-8 pb-8">
        {isClosing && (
          <div className={cn(
            "text-center p-3 rounded-lg border",
            dark ? "bg-blue-900/20 border-blue-700/50 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"
          )}>
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm font-medium">Logging out...</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label 
              htmlFor="username" 
              className={cn(
                "block text-sm font-semibold",
                dark ? "text-gray-200" : "text-gray-700"
              )}
            >
              Username
            </label>
            
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className={cn(
                  "w-full px-4 py-3 text-lg font-medium rounded-xl shadow-sm transition-all duration-200 focus:outline-none",
                  getInputBorderColor(),
                  dark 
                    ? "bg-gray-800 text-white placeholder-gray-400" 
                    : "bg-white text-gray-900 placeholder-gray-500"
                )}
                placeholder="Enter your username"
                maxLength={12}
                disabled={isSubmitting}
                autoFocus
              />
              
              {/* Status indicator overlay */}
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {getStatusIcon()}
                  <span className={cn("text-sm font-medium", getStatusColor())}>
                    {getStatusText()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Username requirements */}
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs",
              dark ? "text-gray-400" : "text-gray-500"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  username.length >= 3 ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>3-12 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  /^[a-zA-Z0-9_-]+$/.test(username) || username.length === 0 ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>Letters, numbers, -_</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  username.length === 0 || !username.includes('admin') && !username.includes('mod') ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>Appropriate content</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={cn(
              "p-4 rounded-xl border text-sm font-medium",
              dark ? "bg-red-900/20 border-red-700/50 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            )}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!username || !isAvailable || isSubmitting}
            className={cn(
              "w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform",
              !username || !isAvailable || isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Setting username...</span>
              </div>
            ) : (
              "Get Started with Bitsbarter"
            )}
          </button>
        </form>

        {/* Additional info */}
        <div className={cn(
          "text-center text-xs",
          dark ? "text-gray-400" : "text-gray-500"
        )}>
          <p>Your username will be visible to other users</p>
          <p>You can change it later in your profile settings</p>
        </div>
      </ModalBody>
    </Modal>
  );
}
