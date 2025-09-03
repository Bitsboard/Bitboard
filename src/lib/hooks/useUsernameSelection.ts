import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';

export function useUsernameSelection(externalUser?: User | null) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [modalClosedByUser, setModalClosedByUser] = useState(false);

  useEffect(() => {
    // If we have an external user, check if they need to choose a username
    if (externalUser) {
      if (!externalUser.hasChosenUsername && !modalClosedByUser) {
        setShowUsernameModal(true);
      } else {
        setShowUsernameModal(false);
      }
    } else {
      // No user, don't show modal
      setShowUsernameModal(false);
    }
  }, [externalUser, modalClosedByUser]);

  // Reset modalClosedByUser flag when user re-authenticates
  useEffect(() => {
    if (externalUser && !externalUser.hasChosenUsername) {
      // If user re-authenticates and still needs username, reset the closed flag
      setModalClosedByUser(false);
    }
  }, [externalUser?.id]); // Only trigger when user ID changes (re-authentication)

  const closeModal = () => {
    setShowUsernameModal(false);
  };

  const hideModal = () => {
    setShowUsernameModal(false);
    setModalClosedByUser(true);
  };

  const resetModalClosedFlag = () => {
    setModalClosedByUser(false);
  };

  return {
    showUsernameModal,
    closeModal,
    hideModal,
    resetModalClosedFlag
  };
}
