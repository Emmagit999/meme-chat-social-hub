import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up comprehensive real-time sync for all tables
    const channels: any[] = [];

    // Posts real-time sync
    const postsChannel = supabase
      .channel('posts_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        console.log('Posts change:', payload);
      })
      .subscribe();
    channels.push(postsChannel);

    // Comments real-time sync
    const commentsChannel = supabase
      .channel('comments_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        console.log('Comments change:', payload);
      })
      .subscribe();
    channels.push(commentsChannel);

    // Messages real-time sync
    const messagesChannel = supabase
      .channel('messages_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        console.log('Messages change:', payload);
      })
      .subscribe();
    channels.push(messagesChannel);

    // Post likes real-time sync
    const postLikesChannel = supabase
      .channel('post_likes_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (payload) => {
        console.log('Post likes change:', payload);
      })
      .subscribe();
    channels.push(postLikesChannel);

    // Notifications real-time sync
    const notificationsChannel = supabase
      .channel('notifications_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('Notifications change:', payload);
      })
      .subscribe();
    channels.push(notificationsChannel);

    console.log('Real-time sync initialized for all tables');

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user]);
};