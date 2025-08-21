"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    className?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className={cn(
                    "flex flex-col items-center justify-center min-h-[200px] p-8 text-center",
                    this.props.className
                )}>
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => {
                            this.setState({ hasError: false, error: undefined });
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Try Again
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-4 text-left">
                            <summary className="cursor-pointer text-sm text-neutral-500 dark:text-neutral-400">
                                Error Details (Development)
                            </summary>
                            <pre className="mt-2 p-4 bg-neutral-100 dark:bg-neutral-800 rounded text-xs overflow-auto">
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
    return React.useCallback((error: Error, errorInfo?: any) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo);

        // You can add error reporting logic here
        // e.g., send to error tracking service
    }, []);
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode,
    onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback} onError={onError}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
