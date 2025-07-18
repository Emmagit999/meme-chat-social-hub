
import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge = ({ count, className }: NotificationBadgeProps) => {
  if (count <= 0) return null;
  
  return (
    <div className={cn(
      "absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center",
      className
    )}>
      {count > 9 ? '9+' : count}
    </div>
  );
};

export default NotificationBadge;
