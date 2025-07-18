import { useEffect, useCallback } from 'react';
import { usePushNotifications } from './use-push-notifications';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeNotifications = () => {
  const { sendNotification, requestPermission, permissionStatus } = usePushNotifications();
  const { user } = useAuth();

  // Request permission on first use
  useEffect(() => {
    if (permissionStatus === 'default') {
      requestPermission();
    }
  }, [permissionStatus, requestPermission]);

  // Listen for new posts
  useEffect(() => {
    if (!user) return;

    const postsChannel = supabase
      .channel('posts-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new;
          if (newPost.user_id !== user.id) {
            sendNotification(`${newPost.username} posted something new!`, {
              body: newPost.content.substring(0, 100) + '...',
              icon: '/favicon.ico',
              tag: 'new-post'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [user, sendNotification]);

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    const messagesChannel = supabase
      .channel('messages-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        async (payload) => {
          const newMessage = payload.new;
          
          // Get sender profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.username || 'Someone';
          
          sendNotification(`New message from ${senderName}`, {
            body: newMessage.content,
            icon: senderProfile?.avatar_url || '/favicon.ico',
            tag: 'new-message'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, sendNotification]);

  // Listen for notifications
  useEffect(() => {
    if (!user) return;

    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const notification = payload.new;
          
          sendNotification(notification.content, {
            body: `From ${notification.from_username}`,
            icon: notification.avatar || '/favicon.ico',
            tag: notification.type
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [user, sendNotification]);

  return {
    requestPermission,
    permissionStatus
  };
};