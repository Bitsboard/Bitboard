import React from 'react';

interface ExternalLinkIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = ({ 
  size = 'sm', 
  className = '', 
  color = 'currentColor' 
}) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke={color}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
      />
    </svg>
  );
};


