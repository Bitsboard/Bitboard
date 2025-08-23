import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function useUsernameSelection() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json() as { user?: User };
        const userData = data.user;
        
        if (userData) {
          setUser(userData);
          
          // Show username modal if user hasn't chosen a username
          if (!userData.hasChosenUsername) {
            setShowUsernameModal(true);
          }
        }
      } else {
        // User not authenticated or other error
        setUser(null);
        setShowUsernameModal(false);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      setUser(null);
      setShowUsernameModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSelected = (username: string) => {
    if (user) {
      const updatedUser = {
        ...user,
        handle: username,
        hasChosenUsername: true
      };
      setUser(updatedUser);
      setShowUsernameModal(false);
    }
  };

  const refreshUserStatus = () => {
    checkUserStatus();
  };

  return {
    user,
    isLoading,
    showUsernameModal,
    handleUsernameSelected,
    refreshUserStatus
  };
}
