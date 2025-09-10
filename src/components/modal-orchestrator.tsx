"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

type OrchestratorCtx = {
  isOfferOpen: boolean;
  openOffer: () => void;
  closeOffer: () => void;
  isDesktop: boolean;
  offerDockRef: React.RefObject<HTMLDivElement>;
  offerWidthPx: number; // used by both the dock and the listing shift
  dockReady: boolean;
  setDockReady: (ready: boolean) => void;
};

const Ctx = createContext<OrchestratorCtx | null>(null);

export function useModalOrchestrator() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Return default values when not within provider (e.g., on messages page)
    return {
      isOfferOpen: false,
      openOffer: () => {},
      closeOffer: () => {},
      isDesktop: false,
      offerDockRef: { current: null },
      offerWidthPx: 420,
      dockReady: false,
      setDockReady: () => {}
    };
  }
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
  const [dockReady, setDockReady] = useState(false);
  const openOffer = () => setIsOfferOpen(true);
  const closeOffer = () => {
    setIsOfferOpen(false);
    setDockReady(false);
  };

  const isDesktop = useMediaQuery('(min-width: 768px)'); // Tailwind's md breakpoint
  const offerDockRef = useRef<HTMLDivElement>(null);

  const value = useMemo(
    () => ({ isOfferOpen, openOffer, closeOffer, isDesktop, offerDockRef, offerWidthPx, dockReady, setDockReady }),
    [isOfferOpen, isDesktop, offerWidthPx, dockReady]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
