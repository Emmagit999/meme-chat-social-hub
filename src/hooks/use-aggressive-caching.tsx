import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export const useAggressiveCaching = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Prefetch critical user data on app start
    const prefetchCriticalData = async () => {
      try {
        // Prefetch user's recent posts
        queryClient.prefetchQuery({
          queryKey: ['posts', 'user', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);
            return data;
          },
          staleTime: 1000 * 60 * 5, // 5 minutes
        });

        // Prefetch user's notifications
        queryClient.prefetchQuery({
          queryKey: ['notifications', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .eq('read', false)
              .order('created_at', { ascending: false })
              .limit(20);
            return data;
          },
          staleTime: 1000 * 60 * 2, // 2 minutes
        });

        // Prefetch user profile
        queryClient.prefetchQuery({
          queryKey: ['profile', user.id],
          queryFn: async () => {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            return data;
          },
          staleTime: 1000 * 60 * 10, // 10 minutes
        });

        console.log('Critical data prefetched successfully');
      } catch (error) {
        console.warn('Failed to prefetch critical data:', error);
      }
    };

    // Prefetch immediately and on focus
    prefetchCriticalData();

    const handleFocus = () => {
      if (!document.hidden) {
        prefetchCriticalData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, queryClient]);
};