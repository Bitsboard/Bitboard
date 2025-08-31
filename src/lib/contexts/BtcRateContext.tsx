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
          const data = await response.json() as { cad: number; lastUpdated: number; nextUpdate: number };
          if (data.cad && Number.isFinite(data.cad)) {
            setBtcCad(data.cad);
            setLastUpdated(data.lastUpdated);
            setNextUpdate(data.nextUpdate);
    
          } else {
            throw new Error('Invalid BTC rate data received');
          }
        } else {
          // Fallback to DataService if our endpoint fails
          console.warn('BTC rate API failed, trying DataService fallback');
          const rate = await DataService.getInstance().getBtcRate();
          if (rate && Number.isFinite(rate)) {
            setBtcCad(rate);
    
          } else {
            throw new Error('DataService fallback also failed');
          }
        }
      } catch (error) {
        console.warn('Failed to load BTC rate:', error);
        
        // If we have no rate at all, use a reasonable fallback
        if (btcCad === null) {
          const fallbackRate = 157432; // Reasonable fallback rate
          setBtcCad(fallbackRate);
  
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
