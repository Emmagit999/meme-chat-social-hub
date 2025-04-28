import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { usePushNotifications } from './use-push-notifications';

export interface Notification {
  id: string;
  type: 'message' | 'like' | 'comment' | 'friend' | 'post';
  from: string;
  fromUserId: string;
  avatar: string;
  content: string;
  time: string;
  read: boolean;
  createdAt: Date;
}

const NOTIFICATIONS_STORAGE_KEY = 'memechat_notifications';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { sendNotification, permissionStatus } = usePushNotifications();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          const formattedNotifications = data.map((notification: any) => ({
            id: notification.id,
            type: notification.type,
            from: notification.from_username,
            fromUserId: notification.from_user_id,
            avatar: notification.avatar || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
            content: notification.content,
            time: getTimeAgo(new Date(notification.created_at)),
            read: notification.read,
            createdAt: new Date(notification.created_at)
          }));
          
          setNotifications(formattedNotifications);
          setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        } else {
          fallbackToLocalStorage();
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        fallbackToLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    const fallbackToLocalStorage = () => {
      const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (savedNotifications) {
        try {
          const parsedNotifications = JSON.parse(savedNotifications);
          
          const userNotifications = parsedNotifications
            .filter((n: any) => !n.userId || n.userId === user.id)
            .map((n: any) => ({
              ...n,
              createdAt: new Date(n.createdAt || Date.now()),
              time: getTimeAgo(new Date(n.createdAt || Date.now()))
            }));
          
          setNotifications(userNotifications);
          setUnreadCount(userNotifications.filter((n: Notification) => !n.read).length);
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    
    loadNotifications();
    
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as any;
        
        if (newNotification && newNotification.user_id === user.id) {
          const formattedNotification: Notification = {
            id: newNotification.id,
            type: newNotification.type,
            from: newNotification.from_username,
            fromUserId: newNotification.from_user_id,
            avatar: newNotification.avatar || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
            content: newNotification.content,
            time: getTimeAgo(new Date(newNotification.created_at)),
            read: newNotification.read,
            createdAt: new Date(newNotification.created_at)
          };
          
          setNotifications(prev => [formattedNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          toast(
            <div className="flex items-center gap-3">
              <span className="font-medium">{formattedNotification.from}:</span>
              <span>{formattedNotification.content}</span>
            </div>
          );
          
          if (permissionStatus === 'granted') {
            sendNotification(
              `MemChat: New ${formattedNotification.type}`, 
              {
                body: `${formattedNotification.from}: ${formattedNotification.content}`,
                icon: formattedNotification.avatar,
              }
            );
          }
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, sendNotification, permissionStatus]);

  useEffect(() => {
    if (!isLoading && user) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    }
  }, [notifications, isLoading, user]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'time' | 'createdAt'>) => {
    if (!user) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      time: 'just now',
      createdAt: new Date()
    };
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          id: newNotification.id,
          user_id: user.id,
          type: newNotification.type,
          from_username: newNotification.from,
          from_user_id: newNotification.fromUserId,
          avatar: newNotification.avatar,
          content: newNotification.content,
          read: newNotification.read,
          created_at: newNotification.createdAt.toISOString()
        });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      if (user) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      
      if (user) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
      }
      
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};
