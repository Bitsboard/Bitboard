"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const cardVariants = {
  default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800',
  elevated: 'bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800',
  outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-700',
  filled: 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
};

const cardPadding = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export function Card({
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl transition-colors',
        cardVariants[variant],
        cardPadding[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card header component
 */
export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card title component
 */
export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card description component
 */
export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Card content component
 */
export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card footer component
 */
export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
