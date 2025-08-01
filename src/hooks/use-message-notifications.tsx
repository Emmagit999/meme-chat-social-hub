import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessageAlert, setNewMessageAlert] = useState(false);

  const getUnreadCount = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver_id', user.id)
      .eq('read', false);
      
    if (!error && data) {
      setUnreadCount(data.length);
      // Update document title
      if (data.length > 0) {
        document.title = `(${data.length}) MEMES`;
      } else {
        document.title = 'MEMES';
      }
    }
  }, [user]);

  const markAsRead = useCallback(async (senderId?: string) => {
    if (!user) return;

    let query = supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', user.id);

    if (senderId) {
      query = query.eq('sender_id', senderId);
    }

    const { error } = await query;
    
    if (!error) {
      getUnreadCount();
    }
  }, [user, getUnreadCount]);

  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'message-notification'
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Get initial unread count
    getUnreadCount();

    // Set up real-time listener for new messages
    const messageChannel = supabase
      .channel(`user-messages-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        console.log('New message received:', payload);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        if (payload.new) {
          const senderName = (payload.new as any).sender_name || 'Someone';
          const content = (payload.new as any).content || 'New message';
          showNotification('New Message', `${senderName}: ${content.substring(0, 50)}...`);
        }
        
        // Show in-app alert
        setNewMessageAlert(true);
        setTimeout(() => setNewMessageAlert(false), 3000);
        
        // Update document title
        const newCount = unreadCount + 1;
        document.title = `(${newCount}) MEMES`;
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user, getUnreadCount, showNotification, unreadCount]);

  return {
    unreadCount,
    newMessageAlert,
    markAsRead,
    getUnreadCount
  };
};