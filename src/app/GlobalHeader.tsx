"use client";

import { useState, useEffect } from "react";
import { Nav, AuthModal, UsernameSelectionModal } from "@/components";
import { useLang } from "@/lib/i18n-client";
import { useSettings, useUser, useModals } from "@/lib/settings";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { useUsernameSelection } from "@/lib/hooks";

import type { User } from "@/lib/types";

export default function GlobalHeader() {
  const lang = useLang();
  const { user, setUser } = useUser();
  const { modals, setModal } = useModals();
  const { theme } = useTheme();
  const dark = theme === 'dark';
  
  // Username selection hook
  const { showUsernameModal, closeModal, hideModal, resetModalClosedFlag } = useUsernameSelection(user);

  // Handle modal being closed by user (not by successful username selection)
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleModalClosedByUser = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    
    setIsLoggingOut(true);
    
    try {
      // Actually log out the user to clear the session
      await fetch('/api/auth/logout', { method: 'POST' });
      
      
      // Reset user state to show the Sign in button
      setUser(null);
      hideModal();
    } catch (error) {
      console.error('Error logging out user:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json() as any;
        if (data.session?.user && !user) {
          // Only restore user if they actually exist in the database
          if (data.session.account) {
            // User exists in database, restore user
            setUser({
              id: data.session.user.id || 'unknown',
              email: data.session.user.email || 'unknown',
              handle: data.session.user.username || null,
              hasChosenUsername: data.session.user.hasChosenUsername || false,
              image: data.session.user.image || undefined
            });
          } else {
            // Session exists but user not in database, clear the invalid session
    
            await fetch('/api/auth/logout', { method: 'POST' });
            // Force page reload to clear any cached state
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();
  }, [user, setUser]);

  const handlePost = () => {
    if (user) {
      setModal('showNew', true);
    } else {
      setModal('showAuth', true);
    }
  };

  const handleAuth = () => {
    setModal('showAuth', true);
  };

  const handleAuthed = (u: User) => {
    // Ensure the user object includes the image from the session
    if (u && !u.image) {
      // Try to get image from current session
      fetch('/api/auth/session')
        .then(response => response.json())
        .then((data: any) => {
          if (data.session?.user?.image) {
            setUser({ ...u, image: data.session.user.image });
          } else {
            setUser(u);
          }
        })
        .catch(() => setUser(u));
    } else {
      setUser(u);
    }
    setModal('showAuth', false);
  };

  const handleUsernameSelected = async (username: string) => {
    
    if (user) {
      try {
        
        // Call the API to set the username
        const response = await fetch('/api/users/set-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        if (response.ok) {

          
          // IMMEDIATELY update the local user state with the new username
          const updatedUser = {
            ...user,
            handle: username,
            hasChosenUsername: true
          };
          
          setUser(updatedUser);
          
          // Reset the modal closed flag since this is a successful selection
          resetModalClosedFlag();
          // Close the modal
          closeModal();
          
          
        } else {
          console.error('Failed to set username');
        }
      } catch (error) {
        console.error('Error setting username:', error);
      }
    } else {
      
    }
  };

  return (
    <>
      <Nav
        onPost={handlePost}
        // When username modal is open, show background as if user is not signed in
        user={showUsernameModal ? null : user}
        onAuth={handleAuth}
        avatarUrl={showUsernameModal ? undefined : user?.image}
      />
      {modals.showAuth && (
        <AuthModal
          dark={dark}
          onClose={() => setModal('showAuth', false)}
          onAuthed={handleAuthed}
        />
      )}
      
      {/* Username selection modal - shows on every page if user hasn't chosen username */}
      {showUsernameModal && (
        <UsernameSelectionModal
          dark={dark}
          onUsernameSelected={handleUsernameSelected}
          onClose={handleModalClosedByUser}
          isClosing={isLoggingOut}
        />
      )}
    </>
  );
}


