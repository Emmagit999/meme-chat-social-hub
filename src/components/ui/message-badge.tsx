import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
  showAlert?: boolean;
}

export const MessageBadge: React.FC<MessageBadgeProps> = ({ 
  count, 
  onClick, 
  className,
  showAlert = false 
}) => {
  return (
    <div 
      className={cn(
        "relative inline-block cursor-pointer transition-all duration-200",
        showAlert && "animate-pulse",
        className
      )} 
      onClick={onClick}
    >
      <MessageCircle 
        size={24} 
        className={cn(
          "text-gray-400 hover:text-yellow-500 transition-colors",
          count > 0 && "text-yellow-500"
        )} 
      />
      {count > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse border-2 border-background">
          {count > 99 ? '99+' : count}
        </div>
      )}
      {showAlert && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
      )}
    </div>
  );
};