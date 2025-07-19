import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useChat } from '@/hooks/use-chat';
import { usePosts } from '@/hooks/use-posts';

export const useRealTimeSync = () => {
  const { user } = useAuth();
  const { getFriends } = useChat();
  const { refreshPosts } = usePosts();

  useEffect(() => {
    if (!user) return;

    // Set up comprehensive real-time sync for all tables
    const channels: any[] = [];

    // Posts real-time sync
    const postsChannel = supabase
      .channel('posts_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        console.log('Posts change:', payload);
        // Refresh posts when there's a change
        if (refreshPosts) {
          refreshPosts();
        }
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
        // Refresh chats and messages when there's a change
        if (getFriends) {
          getFriends();
        }
      })
      .subscribe();
    channels.push(messagesChannel);

    // Post likes real-time sync
    const postLikesChannel = supabase
      .channel('post_likes_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (payload) => {
        console.log('Post likes change:', payload);
        // Refresh posts when likes change
        if (refreshPosts) {
          refreshPosts();
        }
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