'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const COLORS = [
  'bg-gradient-to-br from-purple-600 to-blue-500',
  'bg-gradient-to-br from-green-500 to-teal-500',
  'bg-gradient-to-br from-pink-500 to-rose-500',
  'bg-gradient-to-br from-amber-500 to-orange-500',
  'bg-gradient-to-br from-indigo-500 to-purple-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-rose-500 to-pink-500',
  'bg-gradient-to-br from-cyan-500 to-blue-500',
];

function getInitials(name: string): string {
  if (!name) return '?';
  
  const nameParts = name.trim().split(/\s+/);
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
}

function stringToColor(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % COLORS.length;
}

type AvatarProps = {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string | null;
};

export function Avatar({ name, className, size = 'md', src }: AvatarProps) {
  const colorIndex = stringToColor(name || 'user');
  const initials = getInitials(name || '?');
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizeClasses[size], className)}>
        <img 
          src={src} 
          alt={name || 'User avatar'} 
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div 
          className={cn(
            'absolute inset-0 flex items-center justify-center text-white font-medium',
            COLORS[colorIndex],
            'hidden'
          )}
        >
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium',
        COLORS[colorIndex],
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
