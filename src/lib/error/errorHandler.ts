/**
 * Centralized Error Handling Utility
 * Provides consistent error handling patterns across the application
 */

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class ErrorHandler {
  /**
   * Standard error codes used throughout the application
   */
  static readonly ERROR_CODES = {
    // Authentication & Authorization
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_TOKEN: 'INVALID_TOKEN',
    
    // User Management
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_USERNAME: 'INVALID_USERNAME',
    
    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',
    DATABASE_NOT_AVAILABLE: 'DATABASE_NOT_AVAILABLE',
    QUERY_FAILED: 'QUERY_FAILED',
    
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Business Logic
    LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
    CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
    OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    
    // External Services
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  } as const;

  /**
   * Create a standardized error object
   */
  static createError(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): AppError {
    return {
      code,
      message,
      statusCode,
      details
    };
  }

  /**
   * Handle database errors consistently
   */
  static handleDatabaseError(error: any, context: string = 'Database operation'): AppError {
    console.error(`🔍 ${context} failed:`, error);
    
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return this.createError(
        this.ERROR_CODES.USER_ALREADY_EXISTS,
        'A record with this information already exists',
        409
      );
    }
    
    if (error?.message?.includes('FOREIGN KEY constraint failed')) {
      return this.createError(
        this.ERROR_CODES.VALIDATION_ERROR,
        'Referenced record does not exist',
        400
      );
    }
    
    if (error?.message?.includes('NOT NULL constraint failed')) {
      return this.createError(
        this.ERROR_CODES.MISSING_REQUIRED_FIELD,
        'Required field is missing',
        400
      );
    }
    
    return this.createError(
      this.ERROR_CODES.DATABASE_ERROR,
      'Database operation failed',
      500,
      { context, originalError: error?.message }
    );
  }

  /**
   * Handle validation errors consistently
   */
  static handleValidationError(message: string, details?: any): AppError {
    return this.createError(
      this.ERROR_CODES.VALIDATION_ERROR,
      message,
      400,
      details
    );
  }

  /**
   * Handle authentication errors consistently
   */
  static handleAuthError(message: string = 'Authentication required'): AppError {
    return this.createError(
      this.ERROR_CODES.UNAUTHORIZED,
      message,
      401
    );
  }

  /**
   * Handle authorization errors consistently
   */
  static handleAuthorizationError(message: string = 'Insufficient permissions'): AppError {
    return this.createError(
      this.ERROR_CODES.FORBIDDEN,
      message,
      403
    );
  }

  /**
   * Handle not found errors consistently
   */
  static handleNotFoundError(resource: string, id?: string): AppError {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    return this.createError(
      this.ERROR_CODES.LISTING_NOT_FOUND,
      message,
      404
    );
  }

  /**
   * Handle external API errors consistently
   */
  static handleExternalApiError(service: string, error: any): AppError {
    console.error(`🔍 External API error (${service}):`, error);
    
    return this.createError(
      this.ERROR_CODES.EXTERNAL_API_ERROR,
      `External service error: ${service}`,
      502,
      { service, originalError: error?.message }
    );
  }

  /**
   * Handle generic errors consistently
   */
  static handleGenericError(error: any, context: string = 'Operation'): AppError {
    console.error(`🔍 ${context} failed:`, error);
    
    return this.createError(
      this.ERROR_CODES.INTERNAL_ERROR,
      `${context} failed`,
      500,
      { context, originalError: error?.message }
    );
  }

  /**
   * Convert AppError to NextResponse
   */
  static toResponse(error: AppError): Response {
    return new Response(
      JSON.stringify({
        error: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      }),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  /**
   * Log error consistently
   */
  static logError(error: AppError, context?: string): void {
    const prefix = context ? `🔍 ${context}:` : '🔍 Error:';
    console.error(`${prefix} [${error.code}] ${error.message}`, error.details);
  }
}

/**
 * Utility function for consistent error handling in API routes
 */
export function handleApiError(error: any, context: string = 'API'): Response {
  let appError: AppError;
  
  if (error instanceof Error && 'code' in error) {
    // Already an AppError
    appError = error as AppError;
  } else if (error?.message?.includes('Unauthorized')) {
    appError = ErrorHandler.handleAuthError();
  } else if (error?.message?.includes('not found')) {
    appError = ErrorHandler.handleNotFoundError('Resource');
  } else if (error?.message?.includes('validation')) {
    appError = ErrorHandler.handleValidationError(error.message);
  } else {
    appError = ErrorHandler.handleGenericError(error, context);
  }
  
  ErrorHandler.logError(appError, context);
  return ErrorHandler.toResponse(appError);
}

/**
 * Utility function for consistent error handling in React components
 */
export function handleComponentError(error: any, context: string = 'Component'): void {
  console.error(`🔍 ${context} error:`, error);
  
  // In a real app, you might want to send this to an error reporting service
  // For now, we'll just log it consistently
}

/**
 * Utility function for consistent error handling in async operations
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  context: string = 'Async operation'
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleComponentError(error, context);
    return null;
  }
}
