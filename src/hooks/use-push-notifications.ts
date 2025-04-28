
import { useEffect } from 'react';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  };
  
  const sendNotification = (title: string, options: NotificationOptions = {}) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          ...options,
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
        // Fallback to toast
        toast(title);
      }
    } else {
      // Fallback to toast
      toast(title);
    }
  };
  
  useEffect(() => {
    requestNotificationPermission();
  }, []);
  
  return {
    requestPermission: requestNotificationPermission,
    sendNotification,
    isSupported: 'Notification' in window,
    permissionStatus: 'Notification' in window ? Notification.permission : 'unavailable'
  };
};
