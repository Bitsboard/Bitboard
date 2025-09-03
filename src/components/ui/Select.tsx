"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  helperText?: string;
  errorText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const selectVariants = {
  default: 'border border-neutral-300 bg-white text-neutral-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
  filled: 'border-0 bg-neutral-100 text-neutral-900 focus:bg-white focus:ring-2 focus:ring-orange-500 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-700',
  outlined: 'border-2 border-neutral-300 bg-transparent text-neutral-900 focus:border-orange-500 dark:border-neutral-700 dark:text-neutral-100'
};

const selectSizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl'
};

export function Select({
  variant = 'default',
  size = 'md',
  error = false,
  label,
  helperText,
  errorText,
  className,
  id,
  options,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
            selectVariants[variant],
            selectSizes[size],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            'bg-no-repeat bg-right pr-10',
            className
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '1.25em 1.25em'
          }}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
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
