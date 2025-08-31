// Central configuration file for all constants and configuration values

export const APP_CONFIG = {
  // App-wide settings
  APP_NAME: 'bitsbarter',
  APP_VERSION: '1.0.0',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache durations (in milliseconds)
  BTC_RATE_CACHE_DURATION: 60 * 1000, // 60 seconds
  LISTINGS_CACHE_DURATION: 30 * 1000, // 30 seconds
  CHAT_CACHE_DURATION: 15 * 1000, // 15 seconds
  USER_SESSION_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // API endpoints
  API_BASE_URL: '/api',
  BTC_RATE_ENDPOINT: '/api/btc-rate',
  LISTINGS_ENDPOINT: '/api/listings',
  CHAT_ENDPOINT: '/api/chat',
  AUTH_ENDPOINT: '/api/auth',
  USERS_ENDPOINT: '/api/users',
  ADMIN_ENDPOINT: '/api/admin',
  
  // Timeouts (in milliseconds)
  REQUEST_TIMEOUT: 10000, // 10 seconds
  AUTH_TIMEOUT: 30000, // 30 seconds
  
  // UI constants
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 8,
  
  // File upload limits
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGES_PER_LISTING: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Location defaults
  DEFAULT_RADIUS_KM: 50,
  MAX_RADIUS_KM: 1000,
  WORLDWIDE_RADIUS_KM: 0,
  
  // Price limits
  MIN_PRICE_SATS: 0,
  MAX_PRICE_SATS: 1000000000, // 1 BTC in sats
  
  // Reputation thresholds
  MIN_THUMBS_UP_FOR_VERIFICATION: 10,
  MIN_DEALS_FOR_VERIFICATION: 5,
  
  // Admin settings
  ADMIN_SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  MAX_ADMIN_ACTIONS_PER_HOUR: 100,
  
  // Security settings
  PASSWORD_HASH_ROUNDS: 12,
  JWT_EXPIRY: '7d',
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  
  // Feature flags
  ENABLE_ESCROW: true,
  ENABLE_VERIFICATION: true,
  ENABLE_ADMIN_PANEL: true,
  ENABLE_CHAT: true,
  ENABLE_NOTIFICATIONS: true,
  
  // External services
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
  FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
  
  // Analytics
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
  
  // Development settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_STAGING: process.env.NODE_ENV === 'staging' || process.env.VERCEL_ENV === 'preview',
  
  // Error reporting
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
  ERROR_REPORTING_URL: process.env.NEXT_PUBLIC_ERROR_REPORTING_URL || '',
  
  // Performance
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  LAZY_LOAD_THRESHOLD: 0.1,
  
  // Accessibility
  ENABLE_KEYBOARD_NAVIGATION: true,
  ENABLE_SCREEN_READER_SUPPORT: true,
  FOCUS_VISIBLE_CLASS: 'focus-visible',
  
  // Internationalization
  DEFAULT_LOCALE: 'en',
  SUPPORTED_LOCALES: ['en', 'fr', 'de', 'es'],
  FALLBACK_LOCALE: 'en',
  
  // Database
  MAX_DB_CONNECTIONS: 10,
  DB_QUERY_TIMEOUT: 30000, // 30 seconds
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
} as const;

// Type for the config object
export type AppConfig = typeof APP_CONFIG;

// Helper function to get config value with type safety
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return APP_CONFIG[key];
}

// Environment-specific overrides
export const ENV_CONFIG = {
  development: {
    ENABLE_DEBUG_LOGGING: true,
    ENABLE_MOCK_DATA: false,
    API_BASE_URL: 'http://localhost:3000/api',
  },
  staging: {
    ENABLE_DEBUG_LOGGING: false,
    ENABLE_MOCK_DATA: false,
    API_BASE_URL: '/api',
  },
  production: {
    ENABLE_DEBUG_LOGGING: false,
    ENABLE_MOCK_DATA: false,
    API_BASE_URL: '/api',
  },
} as const;

// Get current environment config
export function getEnvConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
}

export default APP_CONFIG;
