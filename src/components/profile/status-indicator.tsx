import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusViewer } from './status-viewer';
import { supabase } from '@/integrations/supabase/client';
import { User, Status } from '@/types';

interface StatusIndicatorProps {
  user: User;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showStatusViewer?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  user,
  className = '',
  size = 'md',
  onClick,
  showStatusViewer = true
}) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [hasStatus, setHasStatus] = useState(false);

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  };

  useEffect(() => {
    fetchUserStatuses();
  }, [user.id]);

  const fetchUserStatuses = async () => {
    try {
      const { data: statusData, error } = await supabase
        .from('status' as any)
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (!error && statusData) {
        setStatuses(statusData as unknown as Status[]);
        setHasStatus(statusData.length > 0);
      }
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (hasStatus && showStatusViewer) {
      setShowViewer(true);
    }
  };

  return (
    <>
      <div 
        className={`relative cursor-pointer ${className}`}
        onClick={handleClick}
      >
        <div className={`${sizeClasses[size]} relative`}>
          {hasStatus && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-0.5">
              <div className="w-full h-full rounded-full bg-background p-0.5">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}
          
          {!hasStatus && (
            <Avatar className="w-full h-full">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>

      {showViewer && hasStatus && (
        <StatusViewer
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          statuses={statuses}
          userName={user.displayName || user.username}
          userAvatar={user.avatar}
        />
      )}
    </>
  );
};