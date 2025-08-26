"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DataService } from '@/lib/dataService';

interface BtcRateContextType {
  btcCad: number | null;
  isLoading: boolean;
  lastUpdated: number | null;
  nextUpdate: number | null;
}

const BtcRateContext = createContext<BtcRateContextType | undefined>(undefined);

export function BtcRateProvider({ children }: { children: ReactNode }) {
  const [btcCad, setBtcCad] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [nextUpdate, setNextUpdate] = useState<number | null>(null);

  useEffect(() => {
    const loadBtcRate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/btc-rate", { 
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBtcCad(data.cad);
          setLastUpdated(data.lastUpdated);
          setNextUpdate(data.nextUpdate);
        } else {
          // Fallback to DataService if our endpoint fails
          const rate = await DataService.getInstance().getBtcRate();
          setBtcCad(rate);
        }
      } catch (error) {
        console.warn('Failed to load BTC rate:', error);
        // Keep existing rate if available
        if (btcCad === null) {
          setBtcCad(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Load immediately
    loadBtcRate();

    // Set up periodic refresh every 60 seconds to match server update interval
    const interval = setInterval(loadBtcRate, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BtcRateContext.Provider value={{ btcCad, isLoading, lastUpdated, nextUpdate }}>
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
