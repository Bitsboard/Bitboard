"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type OrchestratorCtx = {
  isOfferOpen: boolean;
  openOffer: () => void;
  closeOffer: () => void;
  isDesktop: boolean;
  offerDockRef: React.RefObject<HTMLDivElement>;
  offerWidthPx: number; // used by both the dock and the listing shift
};

const Ctx = createContext<OrchestratorCtx | null>(null);

export function useModalOrchestrator() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    console.log('🎯 useModalOrchestrator: No context found, using default values');
    // Return default values when not within provider (e.g., on messages page)
    return {
      isOfferOpen: false,
      openOffer: () => {
        console.log('🎯 useModalOrchestrator: openOffer() called (default - no context)');
      },
      closeOffer: () => {
        console.log('🎯 useModalOrchestrator: closeOffer() called (default - no context)');
      },
      isDesktop: false,
      offerDockRef: { current: null },
      offerWidthPx: 420
    };
  }
  console.log('🎯 useModalOrchestrator: Context found, returning:', { 
    isOfferOpen: ctx.isOfferOpen, 
    isDesktop: ctx.isDesktop 
  });
  return ctx;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    const listener = () => setMatches(m.matches);
    listener();
    m.addEventListener?.('change', listener);
    return () => m.removeEventListener?.('change', listener);
  }, [query]);
  return matches;
}

export function ModalOrchestratorProvider({
  children,
  offerWidthPx = 420, // tune as desired
}: React.PropsWithChildren<{ offerWidthPx?: number }>) {
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const openOffer = () => {
    console.log('🎯 ModalOrchestrator: openOffer() called');
    setIsOfferOpen(true);
  };
  const closeOffer = () => {
    console.log('🎯 ModalOrchestrator: closeOffer() called');
    setIsOfferOpen(false);
  };

  const isDesktop = useMediaQuery('(min-width: 768px)'); // Tailwind's md breakpoint
  const offerDockRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log('🎯 ModalOrchestrator state:', { isOfferOpen, isDesktop, offerWidthPx });

  const value = useMemo(
    () => ({ isOfferOpen, openOffer, closeOffer, isDesktop, offerDockRef, offerWidthPx }),
    [isOfferOpen, isDesktop, offerWidthPx]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
