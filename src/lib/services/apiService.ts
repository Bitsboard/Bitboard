/**
 * Centralized API Service
 * Provides consistent data fetching patterns across the application
 */

import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/api/response';
import { ErrorHandler } from '@/lib/error/errorHandler';

export interface ApiServiceConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ApiService {
  private config: Required<ApiServiceConfig>;

  constructor(config: ApiServiceConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    };
  }

  /**
   * Generic GET request with error handling
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Generic POST request with error handling
   */
  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * Generic PUT request with error handling
   */
  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * Generic DELETE request with error handling
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Generic request method with retry logic and error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw ErrorHandler.handleGenericError(lastError!, `API request to ${endpoint}`);
  }
}

/**
 * Default API service instance
 */
export const apiService = new ApiService();

/**
 * Utility functions for common API operations
 */
export const apiUtils = {
  /**
   * Fetch with automatic error handling
   */
  async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw ErrorHandler.handleGenericError(error, `Fetch request to ${url}`);
    }
  },

  /**
   * Handle API response consistently
   */
  handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      return response.json().then((errorData: { message?: string }) => {
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      });
    }
    
    return response.json();
  },

  /**
   * Create query string from parameters
   */
  createQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }
};
