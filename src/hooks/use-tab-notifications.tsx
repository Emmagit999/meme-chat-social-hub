import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useMessaging } from '@/hooks/use-messaging';
import { useNotifications } from '@/hooks/use-notifications';

export const useTabNotifications = () => {
  const { user } = useAuth();
  const { unreadMessages } = useMessaging();
  const { unreadCount } = useNotifications();
  const [originalTitle] = useState(document.title);

  useEffect(() => {
    if (!user) return;

    const totalUnread = unreadMessages + unreadCount;
    
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ${originalTitle}`;
      
      // Add favicon notification if supported
      try {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          const canvas = document.createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Create red notification dot
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(24, 8, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add white text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(totalUnread > 9 ? '9+' : totalUnread.toString(), 24, 12);
            
            favicon.href = canvas.toDataURL();
          }
        }
      } catch (error) {
        console.log('Could not update favicon:', error);
      }
    } else {
      document.title = originalTitle;
      
      // Reset favicon
      try {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = '/favicon.ico';
        }
      } catch (error) {
        console.log('Could not reset favicon:', error);
      }
    }

    return () => {
      document.title = originalTitle;
    };
  }, [unreadMessages, unreadCount, user, originalTitle]);

  return { totalUnread: unreadMessages + unreadCount };
};