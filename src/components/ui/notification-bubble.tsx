import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedNotifications } from '@/hooks/use-enhanced-notifications';
import { cn } from '@/lib/utils';

interface NotificationBubbleProps {
  className?: string;
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({ className }) => {
  const navigate = useNavigate();
  const { notificationCounts, clearNotificationCount } = useEnhancedNotifications();
  const [isVisible, setIsVisible] = useState(false);
  
  const totalUnread = notificationCounts.messages + notificationCounts.notifications;

  useEffect(() => {
    setIsVisible(totalUnread > 0);
  }, [totalUnread]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex flex-col gap-3",
      className
    )}>
      {/* Messages Bubble */}
      {notificationCounts.messages > 0 && (
        <div 
          onClick={() => {
            clearNotificationCount('messages');
            navigate('/chat');
          }}
          className="notification-bubble bubble-float cursor-pointer 
                     w-16 h-16 rounded-full flex items-center justify-center
                     hover:scale-110 transition-all duration-300 group
                     bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50"
        >
          <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                         rounded-full w-6 h-6 flex items-center justify-center
                         animate-pulse font-bold border-2 border-white">
            {notificationCounts.messages > 99 ? '99+' : notificationCounts.messages}
          </div>
        </div>
      )}
      
      {/* Notifications Bubble */}
      {notificationCounts.notifications > 0 && (
        <div 
          onClick={() => {
            clearNotificationCount('notifications');
            navigate('/notifications');
          }}
          className="notification-bubble bubble-float cursor-pointer 
                     w-16 h-16 rounded-full flex items-center justify-center
                     hover:scale-110 transition-all duration-300 group
                     bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50"
          style={{ animationDelay: '0.5s' }}
        >
          <Bell className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                         rounded-full w-6 h-6 flex items-center justify-center
                         animate-pulse font-bold border-2 border-white">
            {notificationCounts.notifications > 99 ? '99+' : notificationCounts.notifications}
          </div>
        </div>
      )}
    </div>
  );
};