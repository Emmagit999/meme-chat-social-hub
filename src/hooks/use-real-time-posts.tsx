import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

export const useRealTimePosts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const refreshData = useCallback(() => {
    // Force refresh all post-related queries
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    queryClient.invalidateQueries({ queryKey: ['post_likes'] });
    queryClient.invalidateQueries({ queryKey: ['comment_likes'] });
    console.log('Post data refreshed via real-time sync');
  }, [queryClient]);

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time posts sync for user:', user.id);

    // Posts real-time listener
    const postsChannel = supabase
      .channel('posts_realtime_enhanced')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'posts'
      }, (payload) => {
        console.log('Posts real-time update:', payload);
        refreshData();
      })
      .subscribe();

    // Post likes real-time listener
    const postLikesChannel = supabase
      .channel('post_likes_realtime_enhanced')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'post_likes'
      }, (payload) => {
        console.log('Post likes real-time update:', payload);
        refreshData();
      })
      .subscribe();

    // Comments real-time listener
    const commentsChannel = supabase
      .channel('comments_realtime_enhanced')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments'
      }, (payload) => {
        console.log('Comments real-time update:', payload);
        refreshData();
      })
      .subscribe();

    // Comment likes real-time listener
    const commentLikesChannel = supabase
      .channel('comment_likes_realtime_enhanced')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comment_likes'
      }, (payload) => {
        console.log('Comment likes real-time update:', payload);
        refreshData();
      })
      .subscribe();

    // Continuous polling for extra reliability
    const pollInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log('Polling for posts updates');
        refreshData();
      }
    }, 15000); // Every 15 seconds

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(postLikesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(commentLikesChannel);
      clearInterval(pollInterval);
    };
  }, [user, refreshData]);

  return { refreshData };
};