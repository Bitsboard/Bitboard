import { useState, useCallback } from 'react';
import type { Listing, User } from '@/lib/types';

export function useModals() {
    const [active, setActive] = useState<Listing | null>(null);
    const [chatFor, setChatFor] = useState<Listing | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);

    const closeAllModals = useCallback(() => {
        setActive(null);
        setChatFor(null);
        setShowNew(false);
        setShowAuth(false);
        setShowLocationModal(false);
    }, []);

    const requireAuth = useCallback((fn: () => void) => {
        // This will be implemented when auth is added
        fn();
    }, []);

    return {
        active,
        setActive,
        chatFor,
        setChatFor,
        showNew,
        setShowNew,
        showAuth,
        setShowAuth,
        showLocationModal,
        setShowLocationModal,
        closeAllModals,
        requireAuth,
    };
}
