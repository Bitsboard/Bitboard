import { APP_CONFIG } from '@/lib/config';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

// Request cache interface
interface RequestCache {
  [key: string]: CacheEntry<any>;
}

// Pending request interface
interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

// API cache manager
class APICacheManager {
  private cache: RequestCache = {};
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  // Generate cache key from request parameters
  private generateCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    const headers = options?.headers ? JSON.stringify(options.headers) : '';
    return `${method}:${url}:${body}:${headers}`;
  }

  // Check if cache entry is still valid
  private isCacheValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  // Get cache entry if valid
  private getValidCacheEntry<T>(key: string): T | null {
    const entry = this.cache[key];
    if (entry && this.isCacheValid(entry)) {
      this.cacheHits++;
      return entry.data;
    }
    
    if (entry) {
      // Remove expired entry
      delete this.cache[key];
    }
    
    this.cacheMisses++;
    return null;
  }

  // Set cache entry
  private setCacheEntry<T>(key: string, data: T, ttl: number, etag?: string): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      etag
    };

    // Clean up old entries if cache is too large
    this.cleanupCache();
  }

  // Clean up expired and old cache entries
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const maxEntries = 1000;

    const entries = Object.entries(this.cache);
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        delete this.cache[key];
      }
    });

    // If still too many entries, remove oldest ones
    if (Object.keys(this.cache).length > maxEntries) {
      const sortedEntries = entries
        .filter(([_, entry]) => now <= entry.expiresAt)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, sortedEntries.length - maxEntries);
      toRemove.forEach(([key]) => {
        delete this.cache[key];
      });
    }
  }

  // Get cache statistics
  public getStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      cacheSize: Object.keys(this.cache).length,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests
    };
  }

  // Clear all cache
  public clearCache(): void {
    this.cache = {};
    this.pendingRequests.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Clear cache for specific URL pattern
  public clearCacheForPattern(pattern: string | RegExp): void {
    Object.keys(this.cache).forEach(key => {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        delete this.cache[key];
      }
    });
  }

  // Fetch with caching and deduplication
  public async fetch<T>(
    url: string,
    options?: RequestInit & { 
      ttl?: number;
      skipCache?: boolean;
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    const {
      ttl = APP_CONFIG.LISTINGS_CACHE_DURATION,
      skipCache = false,
      forceRefresh = false,
      ...fetchOptions
    } = options || {};

    const cacheKey = this.generateCacheKey(url, fetchOptions);

    // Check cache first (unless skipping or forcing refresh)
    if (!skipCache && !forceRefresh) {
      const cachedData = this.getValidCacheEntry<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check if there's already a pending request for this URL
    if (this.pendingRequests.has(cacheKey)) {
      const pending = this.pendingRequests.get(cacheKey)!;
      
      // If request is recent (within 5 seconds), return the pending promise
      if (Date.now() - pending.timestamp < 5000) {
        return pending.promise;
      }
    }

    // Create new request
    const requestPromise = this.makeRequest<T>(url, fetchOptions, cacheKey, ttl);
    
    // Store pending request
    this.pendingRequests.set(cacheKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  // Make the actual HTTP request
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const etag = response.headers.get('etag') || undefined;

      // Cache successful responses
      this.setCacheEntry(cacheKey, data, ttl, etag);

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Prefetch data for better performance
  public async prefetch<T>(url: string, options?: RequestInit): Promise<void> {
    try {
      await this.fetch<T>(url, { ...options, skipCache: true });
    } catch (error) {
      // Silently fail for prefetch requests
      console.warn('Prefetch failed:', error);
    }
  }

  // Warm up cache with common requests
  public async warmupCache(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.prefetch(url));
    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const apiCache = new APICacheManager();

// Enhanced fetch function with caching
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { 
    ttl?: number;
    skipCache?: boolean;
    forceRefresh?: boolean;
  }
): Promise<T> {
  return apiCache.fetch<T>(url, options);
}

// Utility functions
export const cacheUtils = {
  clearAll: () => apiCache.clearCache(),
  clearForPattern: (pattern: string | RegExp) => apiCache.clearCacheForPattern(pattern),
  getStats: () => apiCache.getStats(),
  prefetch: (url: string, options?: RequestInit) => apiCache.prefetch(url, options),
  warmup: (urls: string[]) => apiCache.warmupCache(urls),
};

export default apiCache;
