"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalCloseButton } from "./Modal";
import { validateUsername } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

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

    // Check for inappropriate content first
    if (username.includes('admin') || username.includes('mod')) {
      setError("Username cannot contain 'admin' or 'mod'");
      setIsAvailable(false);
      return;
    }

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
        if (!data.available) {
          setError("Username is already taken");
        } else {
          setError(null);
        }
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

  const getInputBorderColor = () => {
    if (focused) return "ring-2 ring-orange-500 border-orange-500";
    if (isAvailable === true) return "ring-2 ring-green-500 border-green-500";
    if (isAvailable === false) return "ring-2 ring-red-500 border-red-500";
    return "border-gray-300 dark:border-gray-600";
  };

  const getErrorMessage = () => {
    if (!username || username.length < 3) return null;
    
    if (username.length < 3) return "Username must be at least 3 characters long";
    if (username.length > 12) return "Username must be 12 characters or less";
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username can only contain letters, numbers, hyphens, and underscores";
    if (username.includes('admin') || username.includes('mod')) return "Username cannot contain 'admin' or 'mod'";
    if (isAvailable === false) return "Username is already taken";
    
    return null;
  };

  return (
    <Modal 
      open={true} 
      onClose={onClose}
      dark={dark} 
      size="md" 
      ariaLabel="Choose your username"
      zIndex={10000}
    >
      <ModalHeader dark={dark}>
        <div className="flex items-start justify-between w-full">
          {/* Left side - Logo */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16">
              <Image
                src="/Bitsbarterlogo.svg"
                alt="Bitsbarter Logo"
                width={64}
                height={64}
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Right side - Welcome text */}
          <div className="flex-1 ml-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Bitsbarter
            </h2>
            <p className={cn(
              "text-base",
              dark ? "text-gray-300" : "text-gray-600"
            )}>
              Please choose a username
            </p>
          </div>
        </div>
        
        {/* Close button */}
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      
      <ModalBody className="space-y-6 px-6 pb-6">
        {isClosing && (
          <div className={cn(
            "text-center p-3 rounded-lg border",
            dark ? "bg-orange-900/20 border-orange-700/50 text-orange-300" : "bg-orange-50 border-orange-200 text-orange-700"
          )}>
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
              <span className="text-sm font-medium">Logging out...</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field */}
          <div className="space-y-3">
            <label 
              htmlFor="username" 
              className={cn(
                "block text-sm font-medium",
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
                  "w-full px-4 py-3 text-base rounded-lg border transition-all duration-200 focus:outline-none",
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
              
              {/* Status indicator */}
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
                  ) : isAvailable === true ? (
                    <div className="flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : isAvailable === false ? (
                    <div className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            
            {/* Username requirements */}
            <div className="space-y-2">
              <div className={cn(
                "flex items-center gap-2 text-xs",
                username.length >= 3 ? "text-green-600" : "text-gray-500"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  username.length >= 3 ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>3-12 characters long</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 text-xs",
                /^[a-zA-Z0-9_-]+$/.test(username) || username.length === 0 ? "text-green-600" : "text-gray-500"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  /^[a-zA-Z0-9_-]+$/.test(username) || username.length === 0 ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>Only letters, numbers, hyphens, and underscores</span>
              </div>
              <div className={cn(
                "flex items-center gap-2 text-xs",
                username.length === 0 || !username.includes('admin') && !username.includes('mod') ? "text-green-600" : "text-gray-500"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  username.length === 0 || !username.includes('admin') && !username.includes('mod') ? "bg-green-500" : "bg-gray-400"
                )} />
                <span>No inappropriate content</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {getErrorMessage() && (
            <div className={cn(
              "p-3 rounded-lg border text-sm",
              dark ? "bg-red-900/20 border-red-700/50 text-red-300" : "bg-red-50 border-red-200 text-red-700"
            )}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {getErrorMessage()}
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            type="submit"
            disabled={!username || !isAvailable || isSubmitting}
            className={cn(
              "w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-200",
              !username || !isAvailable || isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Setting username...</span>
              </div>
            ) : (
              "Confirm"
            )}
          </button>
        </form>
      </ModalBody>
    </Modal>
  );
}
