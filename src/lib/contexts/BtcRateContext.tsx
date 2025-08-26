"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dataService } from '@/lib/dataService';

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
        const rate = await dataService.getBtcRate();
        setBtcCad(rate);
      } catch (error) {
        console.warn('Failed to load BTC rate:', error);
        setBtcCad(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBtcRate();
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
    throw new Error('useBtcRate must be used within a BtcRateProvider');
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
