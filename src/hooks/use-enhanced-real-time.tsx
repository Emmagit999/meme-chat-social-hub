import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

// Singleton guard to avoid duplicate subscriptions
let enhancedRealtimeInitialized = false;

export const useEnhancedRealTime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    if (enhancedRealtimeInitialized) return;
    enhancedRealtimeInitialized = true;
    console.log('Setting up enhanced real-time sync for user:', user.id);

    // Enhanced posts real-time with immediate UI updates
    const postsChannel = supabase
      .channel('enhanced-posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        console.log('Post change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.refetchQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    // Enhanced likes real-time
    const likesChannel = supabase
      .channel('enhanced-likes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, (payload) => {
        console.log('Like change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['post_likes'] });
      })
      .subscribe();

    // Enhanced comments real-time
    const commentsChannel = supabase
      .channel('enhanced-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments'
      }, (payload) => {
        console.log('Comment change detected:', payload);
        queryClient.invalidateQueries({ queryKey: ['comments'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      enhancedRealtimeInitialized = false;
    };
  }, [user, queryClient]);
};