import '@/shims/async_hooks';
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

// Server-side cache for BTC rate
let serverBtcRateCache: { rate: number | null; timestamp: number; lastUpdate: number } = {
  rate: 157432, // Start with a reasonable default rate instead of null
  timestamp: Date.now(),
  lastUpdate: Date.now()
};

// Update interval: 60 seconds
const UPDATE_INTERVAL = 60 * 1000;

async function fetchBtcRateFromProviders(): Promise<number | null> {
  // Try multiple providers to improve reliability
  const providers = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=cad',
      parser: async (response: Response) => {
        const data = await response.json() as { bitcoin?: { cad?: number } };
        return data?.bitcoin?.cad ?? null;
      }
    },
    {
      name: 'Coinbase',
      url: 'https://api.coinbase.com/v2/prices/BTC-CAD/spot',
      parser: async (response: Response) => {
        const data = await response.json() as { data?: { amount?: string } };
        return data?.data?.amount ? Number(data.data.amount) : null;
      }
    },
    {
      name: 'Coindesk',
      url: 'https://api.coindesk.com/v1/bpi/currentprice/CAD.json',
      parser: async (response: Response) => {
        const data = await response.json() as { bpi?: { CAD?: { rate_float?: number } } };
        return data?.bpi?.CAD?.rate_float ?? null;
      }
    }
  ];

  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, { 
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 0 } // Disable Next.js caching
      });
      
      if (response.ok) {
        const rate = await provider.parser(response);
        if (rate && Number.isFinite(rate)) {
          return rate;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${provider.name}:`, error);
    }
  }

  return null;
}

export async function GET() {
  const now = Date.now();

  // Check if we need to update the rate
  if (now - serverBtcRateCache.lastUpdate >= UPDATE_INTERVAL) {
    try {
      const newRate = await fetchBtcRateFromProviders();
      
      if (newRate && Number.isFinite(newRate)) {
        serverBtcRateCache = {
          rate: newRate,
          timestamp: now,
          lastUpdate: now
        };
      } else if (serverBtcRateCache.rate) {
        // If we couldn't get a new rate but have a cached one, keep using it
        serverBtcRateCache.lastUpdate = now;
      } else {
        console.warn('No valid rate available, using default fallback');
      }
    } catch (error) {
      console.error('Failed to update BTC rate:', error);
      // Continue using cached rate if available
    }
  } else {
  }

  // Return the cached rate (even if expired, it's better than nothing)
  const currentRate = serverBtcRateCache.rate || 157432; // Fallback to default if somehow null
  
  return NextResponse.json({ 
    cad: currentRate,
    lastUpdated: serverBtcRateCache.timestamp,
    nextUpdate: serverBtcRateCache.lastUpdate + UPDATE_INTERVAL
  });
}
