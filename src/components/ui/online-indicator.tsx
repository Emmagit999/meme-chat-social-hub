import React from 'react';
import { useOptimizedPresence } from '@/hooks/use-optimized-presence';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  userId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  userId, 
  className,
  size = 'sm' 
}) => {
  const { isUserOnline } = useOptimizedPresence();
  const online = isUserOnline(userId);
  
  if (!online) return null;
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3', 
    lg: 'w-4 h-4'
  };
  
  return (
    <div 
      className={cn(
        'absolute rounded-full bg-blue-500 border-2 border-white shadow-sm',
        sizeClasses[size],
        className
      )}
      title="Online"
    />
  );
};