
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          toast.success('Notifications enabled!');
        } else {
          toast.info('Notifications permission was not granted.');
        }
        
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    
    return false;
  }, []);
  
  const sendNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
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
  }, []);
  
  useEffect(() => {
    // We don't auto-request here to avoid unwanted prompts
    // The component should call requestPermission at an appropriate time
    if ('Notification' in window && Notification.permission === 'default') {
      console.log("Notification permission not yet requested, component should call requestPermission");
    }
  }, []);
  
  return {
    requestPermission: requestNotificationPermission,
    sendNotification,
    isSupported: 'Notification' in window,
    permissionStatus: 'Notification' in window ? Notification.permission : 'unavailable'
  };
};
