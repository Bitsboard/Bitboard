import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for combining class names with Tailwind CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export performance utilities
export * from './utils/performance';

// Format currency with proper locale support
export function formatCurrency(amount: number, currency = "CAD", locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format numbers with proper locale support
export function formatNumber(num: number, locale?: string): string {
  return new Intl.NumberFormat(locale).format(num);
}

// Format BTC from sats
export function formatBTCFromSats(sats: number, locale?: string): string {
  const btc = sats / 1e8;
  return btc.toLocaleString(locale, { maximumFractionDigits: 8 });
}

// Convert sats to fiat
export function satsToFiat(sats: number, btcFiat: number): number {
  return (sats / 1e8) * btcFiat;
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Safe localStorage operations
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? safeJsonParse(item, fallback) : fallback;
  } catch {
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(timestamp: number, locale?: string): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  return 'Just now';
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Check if value is empty (null, undefined, empty string, empty array, empty object)
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Deep clone object (simple implementation)
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T;
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

// Sleep function for async operations
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function with exponential backoff
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Generate a profile picture URL using Dicebear's open-source avatar service
 * @param username - The username to generate avatar for
 * @param seed - Optional seed for consistent avatar generation
 * @returns URL to the generated avatar
 */
export function generateProfilePicture(username: string, seed?: string): string {
  const avatarSeed = seed || username;
  // Using Dicebear's "thumbs" style with "gradientlinear" - abstract, on-brand
  // Brand colors: orange, red, yellow palette
  const brandColors = [
    'ff6b35', // Orange
    'f7931e', // Yellow
    'ff4757', // Red
    'ff3838', // Bright Red
    'ffa502', // Dark Orange
    'ff6348', // Tomato Red
    'ff7f50', // Coral
    'ff8c00', // Dark Orange
    'ffa500', // Orange
    'ff4500', // Orange Red
    'ff6b6b', // Light Red
    'ff8e53', // Light Orange
    'ffb347', // Light Yellow
    'ffcc02', // Bright Yellow
    'ffdd59'  // Pale Yellow
  ];
  
  // Select two colors for the gradient based on username
  const colorIndex1 = Math.abs(avatarSeed.charCodeAt(0)) % brandColors.length;
  const colorIndex2 = Math.abs(avatarSeed.charCodeAt(1)) % brandColors.length;
  
  const color1 = brandColors[colorIndex1];
  const color2 = brandColors[colorIndex2];
  
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(avatarSeed)}&style=gradientlinear&backgroundColor=${color1},${color2}`;
}

/**
 * Get initials from a username or full name
 * @param name - The name to extract initials from
 * @returns The initials (first letter of each word, up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return name.charAt(0).toUpperCase();
  }
  
  return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
}
