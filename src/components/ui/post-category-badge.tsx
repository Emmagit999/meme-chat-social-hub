import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smile, Flame, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCategoryBadgeProps {
  type: 'meme' | 'roast' | 'joke' | 'posts';
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'gradient' | 'glow';
  className?: string;
}

const categoryConfig = {
  meme: {
    icon: Smile,
    label: 'Meme',
    colors: {
      default: 'bg-blue-100 text-blue-800 border-blue-200',
      gradient: 'bg-gradient-to-r from-blue-400 to-purple-500 text-white border-0',
      glow: 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-lg shadow-blue-500/25'
    }
  },
  roast: {
    icon: Flame,
    label: 'Roast',
    colors: {
      default: 'bg-red-100 text-red-800 border-red-200',
      gradient: 'bg-gradient-to-r from-red-500 to-orange-500 text-white border-0',
      glow: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/25'
    }
  },
  joke: {
    icon: MessageCircle,
    label: 'Joke',
    colors: {
      default: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0',
      glow: 'bg-green-500/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/25'
    }
  },
  posts: {
    icon: FileText,
    label: 'Post',
    colors: {
      default: 'bg-gray-100 text-gray-800 border-gray-200',
      gradient: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0',
      glow: 'bg-gray-500/20 text-gray-400 border-gray-500/50 shadow-lg shadow-gray-500/25'
    }
  }
};

export const PostCategoryBadge: React.FC<PostCategoryBadgeProps> = ({
  type,
  size = 'default',
  variant = 'glow',
  className
}) => {
  const config = categoryConfig[type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-medium transition-all duration-300',
        'hover:scale-105 hover:shadow-lg',
        config.colors[variant],
        sizeClasses[size],
        variant === 'glow' && 'animate-pulse-slow',
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
};