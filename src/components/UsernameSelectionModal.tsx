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
      // Just call the callback - let the parent handle the API call
      onUsernameSelected(username);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    if (isAvailable === null) return "text-gray-500";
    if (isAvailable) return "text-green-600";
    return "text-red-600";
  };

  const getStatusText = () => {
    if (isChecking) return "Checking...";
    if (isAvailable === null) return "";
    if (isAvailable) return "✓ Available";
    return "✗ Not available";
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
        <ModalTitle>Welcome to Bitsbarter!</ModalTitle>
        <ModalCloseButton onClose={onClose} dark={dark} />
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="text-center space-y-4">
          {isClosing && (
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Logging out...
            </div>
          )}
          <p className={cn(
            "text-lg",
            dark ? "text-gray-200" : "text-gray-700"
          )}>
            To get started, please choose a username for your account.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className={cn(
                  "block text-sm font-medium",
                  dark ? "text-gray-200" : "text-gray-700"
                )}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  dark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                )}
                placeholder="Enter username (3-12 characters)"
                maxLength={12}
                disabled={isSubmitting}
                autoFocus
              />
              
              {/* Username requirements */}
              <div className={cn(
                "text-xs",
                dark ? "text-gray-400" : "text-gray-500"
              )}>
                <p>• 3-12 characters long</p>
                <p>• Only letters, numbers, hyphens, and underscores</p>
                <p>• No inappropriate content</p>
              </div>
            </div>

            {/* Status indicator */}
            {username.length >= 3 && (
              <div className={cn("text-sm font-medium", getStatusColor())}>
                {getStatusText()}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={!username || !isAvailable || isSubmitting}
              className={cn(
                "w-full px-4 py-2 rounded-md font-medium transition-colors",
                !username || !isAvailable || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isSubmitting ? "Setting username..." : "Confirm Username"}
            </button>
          </form>
        </div>
      </ModalBody>
    </Modal>
  );
}
