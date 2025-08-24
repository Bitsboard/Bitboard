import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function useUsernameSelection(externalUser?: User | null) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    // If we have an external user, check if they need to choose a username
    if (externalUser) {
      if (!externalUser.hasChosenUsername) {
        setShowUsernameModal(true);
      } else {
        setShowUsernameModal(false);
      }
    } else {
      // No user, don't show modal
      setShowUsernameModal(false);
    }
  }, [externalUser]);

  const handleUsernameSelected = (username: string) => {
    // Close the modal
    setShowUsernameModal(false);
    
    // The actual user update should be handled by the parent component
    // This hook just manages the modal state
  };

  return {
    showUsernameModal,
    handleUsernameSelected
  };
}
