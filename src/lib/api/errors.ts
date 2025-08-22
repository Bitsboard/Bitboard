import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown): NextResponse {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: error.code,
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                success: false,
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
            { status: 400 }
        );
    }

    if (error instanceof Error) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            success: false,
            error: 'Internal server error',
        },
        { status: 500 }
    );
}

export function createApiError(statusCode: number, message: string, code?: string): ApiError {
    return new ApiError(statusCode, message, code);
}

export function createValidationError(message: string): ApiError {
    return createApiError(400, message, 'VALIDATION_ERROR');
}

export function createNotFoundError(message: string): ApiError {
    return createApiError(404, message, 'NOT_FOUND');
}

export function createUnauthorizedError(message: string = 'Unauthorized'): ApiError {
    return createApiError(401, message, 'UNAUTHORIZED');
}

export function createForbiddenError(message: string = 'Forbidden'): ApiError {
    return createApiError(403, message, 'FORBIDDEN');
}
