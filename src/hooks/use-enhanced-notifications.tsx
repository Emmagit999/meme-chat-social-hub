import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

// Notification sounds
const playNotificationSound = (type: 'message' | 'notification' | 'mention') => {
  try {
    const audio = new Audio();
    
    // Different sounds for different types
    switch (type) {
      case 'message':
        // WhatsApp-like message sound
        audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5EAAAAHQAAAWF1ZGlvL21wZWcAAAAAAAAAAAAAAAD/+xDEAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzMzOZmZmZmZmZmZmZmZmZmZmZmZmZmZm6urq6urq6urq6urq6urq6urq6urq6v////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAALAA==';
        break;
      case 'mention':
        // Higher pitch for mentions
        audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5EAAAAHQAAAWF1ZGlvL21wZWcAAAAAAAAAAAAAAAD/+xDEAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzMzOZmZmZmZmZmZmZmZmZmZmZmZmZmZm6urq6urq6urq6urq6urq6urq6urq6v////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAALBA==';
        break;
      default:
        // Default notification sound
        audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5EAAAAHQAAAWF1ZGlvL21wZWcAAAAAAAAAAAAAAAD/+xDEAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAESAAzMzMzMzMzMzMzMzMzMzMzMzMzMzOZmZmZmZmZmZmZmZmZmZmZmZmZmZm6urq6urq6urq6urq6urq6urq6urq6v////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAALAAA==';
    }
    
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Could not play notification sound:', e));
  } catch (error) {
    console.log('Audio not supported or failed:', error);
  }
};

export const useEnhancedNotifications = () => {
  const { user } = useAuth();
  const [notificationCounts, setNotificationCounts] = useState({
    messages: 0,
    notifications: 0,
    posts: 0
  });
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Enhanced permission request with better UX
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }
    
    try {
      // Show a pre-permission toast to explain why we need permission
      toast.info('Enable notifications to stay updated with messages and activity!', {
        duration: 3000,
      });
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('🔔 Notifications enabled! You\'ll now receive real-time updates.', {
          duration: 4000,
        });
        
        // Send a test notification
        setTimeout(() => {
          sendNotification('Welcome!', {
            body: 'You\'ll now receive notifications for messages and updates.',
            icon: '/favicon.ico'
          });
        }, 1000);
        
        return true;
      } else {
        toast.warning('Notifications disabled. You can enable them later in settings.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, []);

  const sendNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: true,
          ...options,
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
          
          // Navigate to appropriate section if possible
          if (options.tag) {
            const path = options.tag.includes('message') ? '/chat' : 
                        options.tag.includes('notification') ? '/notifications' : '/home';
            window.location.hash = path;
          }
        };
        
        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
        
        return notification;
      } catch (error) {
        console.error('Error creating notification:', error);
        toast(title);
      }
    } else {
      toast(title);
    }
  }, []);

  // Enhanced notification handlers with sounds and bubble updates
  const handleNewMessage = useCallback((message: any) => {
    setNotificationCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
    playNotificationSound('message');
    
    if (!document.hasFocus()) {
      sendNotification('New Message', {
        body: `${message.sender_name}: ${message.content.slice(0, 50)}...`,
        tag: 'message',
        icon: message.sender_avatar || '/favicon.ico'
      });
    }
    
    toast(`💬 New message from ${message.sender_name}`, {
      duration: 3000,
      action: {
        label: 'View',
        onClick: () => window.location.hash = '/chat'
      }
    });
  }, [sendNotification]);

  const handleNewNotification = useCallback((notification: any) => {
    setNotificationCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }));
    
    const soundType = notification.type === 'mention' ? 'mention' : 'notification';
    playNotificationSound(soundType);
    
    if (!document.hasFocus()) {
      sendNotification('New Notification', {
        body: notification.content,
        tag: 'notification',
        icon: notification.avatar || '/favicon.ico'
      });
    }
    
    const emoji = notification.type === 'like' ? '❤️' : 
                  notification.type === 'comment' ? '💬' : 
                  notification.type === 'mention' ? '📢' : '🔔';
    
    toast(`${emoji} ${notification.content}`, {
      duration: 4000,
      action: {
        label: 'View',
        onClick: () => window.location.hash = '/notifications'
      }
    });
  }, [sendNotification]);

  const handleNewPost = useCallback((post: any) => {
    setNotificationCounts(prev => ({ ...prev, posts: prev.posts + 1 }));
    
    if (!document.hasFocus()) {
      sendNotification('New Post', {
        body: `${post.username} shared a new ${post.type}`,
        tag: 'post',
        icon: post.userAvatar || '/favicon.ico'
      });
    }
  }, [sendNotification]);

  // Clear notification counts
  const clearNotificationCount = useCallback((type: 'messages' | 'notifications' | 'posts') => {
    setNotificationCounts(prev => ({ ...prev, [type]: 0 }));
  }, []);

  // Auto-request permission on user interaction
  useEffect(() => {
    if (!user || permissionRequested) return;
    
    const handleUserInteraction = () => {
      if (!permissionRequested && Notification.permission === 'default') {
        setPermissionRequested(true);
        setTimeout(() => {
          requestNotificationPermission();
        }, 2000); // Wait 2 seconds after first interaction
      }
    };

    // Listen for user interactions
    const events = ['click', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [user, permissionRequested, requestNotificationPermission]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // Messages subscription
    const messagesChannel = supabase
      .channel('new-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, handleNewMessage)
      .subscribe();
    channels.push(messagesChannel);

    // Notifications subscription
    const notificationsChannel = supabase
      .channel('new-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, handleNewNotification)
      .subscribe();
    channels.push(notificationsChannel);

    // Posts subscription (for general feed updates)
    const postsChannel = supabase
      .channel('new-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        if (payload.new.user_id !== user.id) {
          handleNewPost(payload.new);
        }
      })
      .subscribe();
    channels.push(postsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, handleNewMessage, handleNewNotification, handleNewPost]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden
      } else {
        // Page became visible - you might want to refresh counts or mark as read
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    requestPermission: requestNotificationPermission,
    sendNotification,
    notificationCounts,
    clearNotificationCount,
    isSupported: 'Notification' in window,
    permissionStatus: 'Notification' in window ? Notification.permission : 'unavailable'
  };
};