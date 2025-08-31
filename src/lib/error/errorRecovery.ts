import { APP_CONFIG } from '@/lib/config';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error information interface
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  retryable: boolean;
  maxRetries: number;
  fallbackStrategy?: string;
  userMessage: string;
  technicalDetails?: any;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.SERVER]
};

// Error recovery strategies
export class ErrorRecovery {
  private retryConfig: RetryConfig;
  private errorCounts: Map<string, number> = new Map();
  private recoveryStrategies: Map<ErrorType, (error: ErrorInfo) => Promise<any>> = new Map();

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.initializeRecoveryStrategies();
  }

  // Initialize default recovery strategies
  private initializeRecoveryStrategies(): void {
    // Network error recovery
    this.recoveryStrategies.set(ErrorType.NETWORK, async (error: ErrorInfo) => {
      // Try to reconnect or use offline mode
      if (navigator.onLine) {
        // Wait a bit and retry
        await this.delay(2000);
        return { action: 'retry', message: 'Network connection restored' };
      } else {
        // Show offline mode
        return { action: 'offline_mode', message: 'Working in offline mode' };
      }
    });

    // Authentication error recovery
    this.recoveryStrategies.set(ErrorType.AUTHENTICATION, async (error: ErrorInfo) => {
      // Redirect to login or refresh token
      if (this.shouldRefreshToken()) {
        return { action: 'refresh_token', message: 'Refreshing authentication' };
      } else {
        return { action: 'redirect_login', message: 'Please log in again' };
      }
    });

    // Server error recovery
    this.recoveryStrategies.set(ErrorType.SERVER, async (error: ErrorInfo) => {
      // Wait and retry, or show maintenance message
      await this.delay(5000);
      return { action: 'retry', message: 'Server issue resolved, retrying' };
    });
  }

  // Check if token should be refreshed
  private shouldRefreshToken(): boolean {
    // Check if we have a refresh token and it's not expired
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const tokenData = JSON.parse(atob(refreshToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return tokenData.exp > now;
    } catch {
      return false;
    }
  }

  // Delay utility function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Calculate exponential backoff delay
  private calculateBackoffDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  // Retry operation with exponential backoff
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    errorInfo: ErrorInfo,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!config.retryableErrors.includes(errorInfo.type) || attempt === config.maxRetries) {
          throw error;
        }

        // Calculate delay and wait
        const delay = this.calculateBackoffDelay(attempt);
        console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  // Execute operation with automatic error recovery
  public async executeWithRecovery<T>(
    operation: () => Promise<T>,
    errorInfo: ErrorInfo
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Try to recover using recovery strategy
      const recoveryStrategy = this.recoveryStrategies.get(errorInfo.type);
      if (recoveryStrategy) {
        try {
          const recoveryResult = await recoveryStrategy(errorInfo);
          
          // Execute recovery action
          switch (recoveryResult.action) {
            case 'retry':
              return await this.retryWithBackoff(operation, errorInfo);
            case 'refresh_token':
              await this.refreshAuthentication();
              return await operation();
            case 'offline_mode':
              return await this.executeOfflineFallback(operation, errorInfo);
            case 'redirect_login':
              this.redirectToLogin();
              throw new Error('Authentication required');
            default:
              throw error;
          }
        } catch (recoveryError) {
          // Recovery failed, throw original error
          throw error;
        }
      }

      // No recovery strategy, throw original error
      throw error;
    }
  }

  // Refresh authentication token
  private async refreshAuthentication(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json() as { accessToken: string; refreshToken: string };
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
    } catch (error) {
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  // Execute offline fallback
  private async executeOfflineFallback<T>(
    operation: () => Promise<T>,
    errorInfo: ErrorInfo
  ): Promise<T> {
    // Check if we have cached data
    const cachedData = this.getCachedData(operation.name);
    if (cachedData) {
      return cachedData as T;
    }

    // Show offline message and throw error
    throw new Error('Operation not available offline');
  }

  // Get cached data for operation
  private getCachedData(operationName: string): any {
    try {
      const cached = localStorage.getItem(`cache_${operationName}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (now - timestamp < maxAge) {
          return data;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }

  // Redirect to login page
  private redirectToLogin(): void {
    const currentPath = window.location.pathname;
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }

  // Track error occurrence
  public trackError(errorInfo: ErrorInfo): void {
    const key = `${errorInfo.type}_${errorInfo.code || 'unknown'}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Log error for monitoring
    if (APP_CONFIG.ENABLE_ERROR_REPORTING) {
      this.reportError(errorInfo);
    }
  }

  // Report error to monitoring service
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      await fetch(APP_CONFIG.ERROR_REPORTING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch {
      // Silently fail error reporting
    }
  }

  // Get error statistics
  public getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorCounts.forEach((count, key) => {
      stats[key] = count;
    });
    return stats;
  }

  // Reset error counts
  public resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  // Add custom recovery strategy
  public addRecoveryStrategy(
    errorType: ErrorType,
    strategy: (error: ErrorInfo) => Promise<any>
  ): void {
    this.recoveryStrategies.set(errorType, strategy);
  }
}

// Export singleton instance
export const errorRecovery = new ErrorRecovery();

// Utility functions
export const errorUtils = {
  // Create error info object
  createErrorInfo(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    options?: Partial<ErrorInfo>
  ): ErrorInfo {
    return {
      type,
      severity,
      message,
      retryable: type === ErrorType.NETWORK || type === ErrorType.SERVER,
      maxRetries: 3,
      userMessage: options?.userMessage || 'Something went wrong. Please try again.',
      ...options
    };
  },

  // Get user-friendly error message
  getUserMessage(error: Error, errorInfo?: ErrorInfo): string {
    if (errorInfo?.userMessage) {
      return errorInfo.userMessage;
    }

    // Default user-friendly messages
    switch (error.name) {
      case 'NetworkError':
        return 'Network connection issue. Please check your internet connection.';
      case 'TimeoutError':
        return 'Request timed out. Please try again.';
      case 'AuthenticationError':
        return 'Please log in to continue.';
      case 'AuthorizationError':
        return 'You don\'t have permission to perform this action.';
      default:
        return 'Something went wrong. Please try again.';
    }
  },

  // Check if error is retryable
  isRetryable(error: Error, errorInfo?: ErrorInfo): boolean {
    if (errorInfo?.retryable !== undefined) {
      return errorInfo.retryable;
    }

    // Default retryable errors
    const retryableErrors = ['NetworkError', 'TimeoutError', 'ServerError'];
    return retryableErrors.includes(error.name);
  }
};

export default errorRecovery;
