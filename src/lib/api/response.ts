import { NextResponse } from 'next/server';
import { ErrorHandler, AppError } from '@/lib/error/errorHandler';

/**
 * Standardized API Response Utilities
 * Provides consistent response formats across all API endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status: statusCode }
  );
}

/**
 * Create a successful paginated API response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total
    },
    ...(message && { message })
  });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: AppError
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: error.code,
      message: error.message,
      ...(error.details && { details: error.details })
    },
    { status: error.statusCode }
  );
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  details?: any
): NextResponse<ApiResponse> {
  const error = ErrorHandler.handleValidationError(message, details);
  return createErrorResponse(error);
}

/**
 * Create an authentication error response
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required'
): NextResponse<ApiResponse> {
  const error = ErrorHandler.handleAuthError(message);
  return createErrorResponse(error);
}

/**
 * Create an authorization error response
 */
export function createAuthorizationErrorResponse(
  message: string = 'Insufficient permissions'
): NextResponse<ApiResponse> {
  const error = ErrorHandler.handleAuthorizationError(message);
  return createErrorResponse(error);
}

/**
 * Create a not found error response
 */
export function createNotFoundErrorResponse(
  resource: string,
  id?: string
): NextResponse<ApiResponse> {
  const error = ErrorHandler.handleNotFoundError(resource, id);
  return createErrorResponse(error);
}

/**
 * Create a database error response
 */
export function createDatabaseErrorResponse(
  error: any,
  context: string = 'Database operation'
): NextResponse<ApiResponse> {
  const appError = ErrorHandler.handleDatabaseError(error, context);
  return createErrorResponse(appError);
}

/**
 * Create a generic error response
 */
export function createGenericErrorResponse(
  error: any,
  context: string = 'Operation'
): NextResponse<ApiResponse> {
  const appError = ErrorHandler.handleGenericError(error, context);
  return createErrorResponse(appError);
}

/**
 * Handle API errors consistently
 */
export function handleApiError(
  error: any,
  context: string = 'API'
): NextResponse<ApiResponse> {
  let appError: AppError;
  
  if (error instanceof Error && 'code' in error && 'statusCode' in error) {
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
  return createErrorResponse(appError);
}

/**
 * Utility for handling async operations in API routes
 */
export async function handleAsyncApiOperation<T>(
  operation: () => Promise<T>,
  context: string = 'API operation'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error, context);
  }
}

/**
 * Utility for handling database operations in API routes
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  context: string = 'Database operation'
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return createDatabaseErrorResponse(error, context);
  }
}
