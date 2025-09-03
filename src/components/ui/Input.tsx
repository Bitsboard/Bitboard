"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
}

const inputVariants = {
  default: 'border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400',
  filled: 'border-0 bg-neutral-100 text-neutral-900 placeholder-neutral-500 focus:bg-white focus:ring-2 focus:ring-orange-500 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-400 dark:focus:bg-neutral-700',
  outlined: 'border-2 border-neutral-300 bg-transparent text-neutral-900 placeholder-neutral-500 focus:border-orange-500 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-400'
};

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl'
};

export function Input({
  variant = 'default',
  size = 'md',
  error = false,
  label,
  helperText,
  errorText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          inputVariants[variant],
          inputSizes[size],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && errorText && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {errorText}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Search input with search icon
 */
export function SearchInput({
  className,
  ...props
}: Omit<InputProps, 'variant'>) {
  return (
    <div className="relative">
      <Input
        variant="default"
        className={cn('pr-10', className)}
        {...props}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          className="h-4 w-4 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
}
