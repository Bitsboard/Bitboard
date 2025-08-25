import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function useUsernameSelection(externalUser?: User | null) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [modalClosedByUser, setModalClosedByUser] = useState(false);

  useEffect(() => {
    console.log('useUsernameSelection: externalUser changed:', externalUser);
    // If we have an external user, check if they need to choose a username
    if (externalUser) {
      if (!externalUser.hasChosenUsername && !modalClosedByUser) {
        console.log('useUsernameSelection: showing modal - user has not chosen username and modal not closed by user');
        setShowUsernameModal(true);
      } else {
        console.log('useUsernameSelection: hiding modal - user has chosen username or modal was closed by user');
        setShowUsernameModal(false);
      }
    } else {
      console.log('useUsernameSelection: hiding modal - no user');
      // No user, don't show modal
      setShowUsernameModal(false);
    }
  }, [externalUser, modalClosedByUser]);

  // Reset modalClosedByUser flag when user re-authenticates
  useEffect(() => {
    if (externalUser && !externalUser.hasChosenUsername) {
      // If user re-authenticates and still needs username, reset the closed flag
      console.log('useUsernameSelection: user re-authenticated, resetting modal closed flag');
      setModalClosedByUser(false);
    }
  }, [externalUser?.id]); // Only trigger when user ID changes (re-authentication)

  const closeModal = () => {
    console.log('useUsernameSelection: closeModal called');
    setShowUsernameModal(false);
  };

  const hideModal = () => {
    console.log('useUsernameSelection: hideModal called - modal closed by user');
    setShowUsernameModal(false);
    setModalClosedByUser(true);
  };

  const resetModalClosedFlag = () => {
    console.log('useUsernameSelection: resetModalClosedFlag called');
    setModalClosedByUser(false);
  };

  return {
    showUsernameModal,
    closeModal,
    hideModal,
    resetModalClosedFlag
  };
}
