import { useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useChat } from '@/hooks/use-chat';
import { usePosts } from '@/hooks/use-posts';
import { useQueryClient } from '@tanstack/react-query';

// Guard to avoid duplicate subscriptions from multiple mounts
let realTimeSyncInitialized = false;

export const useRealTimeSync = () => {
  const { user } = useAuth();
  const { getFriends } = useChat();
  const { refreshPosts } = usePosts();
  const queryClient = useQueryClient();

  // Enhanced refresh functions with query client invalidation
  const refreshAllData = useCallback(() => {
    // Invalidate all relevant queries
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    
    // Also trigger manual refreshes
    if (refreshPosts) {
      refreshPosts();
    }
    if (getFriends) {
      getFriends();
    }
  }, [queryClient, refreshPosts, getFriends]);

  useEffect(() => {
    if (!user) return;
    if (realTimeSyncInitialized) return;
    realTimeSyncInitialized = true;
    console.log('Setting up enhanced real-time sync for user:', user.id);

    // Set up comprehensive real-time sync for all tables
    const channels: any[] = [];

    // Posts real-time sync with immediate UI update
    const postsChannel = supabase
      .channel('posts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        console.log('Posts change detected:', payload);
        // Immediate refresh
        refreshAllData();
      })
      .subscribe();
    channels.push(postsChannel);

    // Comments real-time sync with immediate UI update
    const commentsChannel = supabase
      .channel('comments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        console.log('Comments change detected:', payload);
        refreshAllData();
      })
      .subscribe();
    channels.push(commentsChannel);

    // Messages real-time sync with immediate UI update
    const messagesChannel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${user.id}`
      }, (payload) => {
        console.log('Messages change detected:', payload);
        if (getFriends) {
          getFriends();
        }
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        console.log('Messages change detected:', payload);
        if (getFriends) {
          getFriends();
        }
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      })
      .subscribe();
    channels.push(messagesChannel);

    // Post likes real-time sync with immediate UI update
    const postLikesChannel = supabase
      .channel('post_likes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, (payload) => {
        console.log('Post likes change detected:', payload);
        refreshAllData();
      })
      .subscribe();
    channels.push(postLikesChannel);

    // Comment likes real-time sync
    const commentLikesChannel = supabase
      .channel('comment_likes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comment_likes' }, (payload) => {
        console.log('Comment likes change detected:', payload);
        refreshAllData();
      })
      .subscribe();
    channels.push(commentLikesChannel);

    // Notifications real-time sync with immediate UI update
    const notificationsChannel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id.eq.${user.id}`
      }, (payload) => {
        console.log('Notifications change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    channels.push(notificationsChannel);

    // Continuous background sync every 10 seconds for better real-time experience
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        console.log('Background sync triggered');
        refreshAllData();
      }
    }, 10000);

    console.log('Enhanced real-time sync initialized with background refresh');

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      clearInterval(intervalId);
    };
  }, [user, refreshAllData, getFriends, queryClient]);
};