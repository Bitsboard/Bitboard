import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 text-xs',
  md: 'w-5 h-5 text-xs', 
  lg: 'w-12 h-12 text-sm',
  xl: 'w-28 h-32 text-4xl'
};

export function Avatar({ size = 'md', children, className }: AvatarProps) {
  return (
    <div 
      className={cn(
        'rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center font-bold text-white',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}
