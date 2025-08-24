import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function useUsernameSelection(externalUser?: User | null) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  useEffect(() => {
    console.log('useUsernameSelection: externalUser changed:', externalUser);
    // If we have an external user, check if they need to choose a username
    if (externalUser) {
      if (!externalUser.hasChosenUsername) {
        console.log('useUsernameSelection: showing modal - user has not chosen username');
        setShowUsernameModal(true);
      } else {
        console.log('useUsernameSelection: hiding modal - user has chosen username');
        setShowUsernameModal(false);
      }
    } else {
      console.log('useUsernameSelection: hiding modal - no user');
      // No user, don't show modal
      setShowUsernameModal(false);
    }
  }, [externalUser]);

  const closeModal = () => {
    console.log('useUsernameSelection: closeModal called');
    setShowUsernameModal(false);
  };

  return {
    showUsernameModal,
    closeModal
  };
}
