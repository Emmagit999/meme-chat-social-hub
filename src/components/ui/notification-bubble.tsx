import React, { useState, useEffect } from 'react';
import { MessageCircle, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessaging } from '@/hooks/use-messaging';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

interface NotificationBubbleProps {
  className?: string;
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({ className }) => {
  const navigate = useNavigate();
  const { unreadMessages } = useMessaging();
  const { notifications } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const totalUnread = unreadMessages + unreadNotifications;

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
      {unreadMessages > 0 && (
        <div 
          onClick={() => navigate('/chat')}
          className="notification-bubble bubble-float cursor-pointer 
                     w-16 h-16 rounded-full flex items-center justify-center
                     hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                         rounded-full w-6 h-6 flex items-center justify-center
                         animate-pulse font-bold">
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </div>
        </div>
      )}
      
      {/* Notifications Bubble */}
      {unreadNotifications > 0 && (
        <div 
          onClick={() => navigate('/notifications')}
          className="notification-bubble bubble-float cursor-pointer 
                     w-16 h-16 rounded-full flex items-center justify-center
                     hover:scale-110 transition-all duration-300 group"
          style={{ animationDelay: '0.5s' }}
        >
          <Bell className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                         rounded-full w-6 h-6 flex items-center justify-center
                         animate-pulse font-bold">
            {unreadNotifications > 99 ? '99+' : unreadNotifications}
          </div>
        </div>
      )}
    </div>
  );
};