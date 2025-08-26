"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataService } from '@/lib/dataService';

interface BtcRateContextType {
  btcCad: number | null;
  isLoading: boolean;
}

const BtcRateContext = createContext<BtcRateContextType | undefined>(undefined);

export function BtcRateProvider({ children }: { children: ReactNode }) {
  const [btcCad, setBtcCad] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBtcRate = async () => {
      try {
        setIsLoading(true);
        const rate = await DataService.getInstance().getBtcRate();
        setBtcCad(rate);
      } catch (error) {
        console.warn('Failed to load BTC rate:', error);
        setBtcCad(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to prevent blocking the initial render
    const timer = setTimeout(loadBtcRate, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <BtcRateContext.Provider value={{ btcCad, isLoading }}>
      {children}
    </BtcRateContext.Provider>
  );
}

export function useBtcRate() {
  const context = useContext(BtcRateContext);
  if (context === undefined) {
    console.warn('useBtcRate used outside of BtcRateProvider, returning null');
    return null;
  }
  return context.btcCad;
}

export function useBtcRateContext() {
  const context = useContext(BtcRateContext);
  if (context === undefined) {
    throw new Error('useBtcRateContext must be used within a BtcRateProvider');
  }
  return context;
}
