import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';
import { useConnectionManager } from './use-connection-manager';
import { useSmartCache } from './use-smart-cache';

interface NetworkOptimizer {
  batchRequests: (requests: Array<() => Promise<any>>) => Promise<any[]>;
  prefetchCriticalData: () => Promise<void>;
  optimizeRealTimeChannels: () => void;
  getNetworkStats: () => any;
}

export const useNetworkOptimizer = (): NetworkOptimizer => {
  const { user } = useAuth();
  const { connectionState } = useConnectionManager();
  const queryClient = useQueryClient();
  const { prefetch, invalidate, getStats } = useSmartCache();
  
  const batchQueue = useRef<Array<() => Promise<any>>>([]);
  const batchTimeout = useRef<NodeJS.Timeout>();
  const channelPool = useRef<Map<string, any>>(new Map());

  // Batch multiple requests to reduce network overhead
  const batchRequests = useCallback(async (requests: Array<() => Promise<any>>) => {
    if (connectionState.connectionQuality === 'poor') {
      // Process sequentially for poor connections
      const results = [];
      for (const request of requests) {
        try {
          results.push(await request());
        } catch (error) {
          results.push({ error });
        }
      }
      return results;
    } else {
      // Process in parallel for good connections
      return Promise.allSettled(requests.map(request => request()));
    }
  }, [connectionState.connectionQuality]);

  // Prefetch critical data based on user behavior patterns
  const prefetchCriticalData = useCallback(async () => {
    if (!user || connectionState.connectionQuality === 'poor') return;

    const criticalQueries = [
      // Prefetch user's posts
      async () => {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        return { data, error };
      },
      
      // Prefetch recent messages
      async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(20);
        return { data, error };
      },
      
      // Prefetch notifications
      async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(10);
        return { data, error };
      },
    ];

    try {
      const results = await batchRequests(criticalQueries);
      console.log('Critical data prefetched:', results.length, 'queries');
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [user, connectionState.connectionQuality, batchRequests]);

  // Optimize real-time channels by reusing connections
  const optimizeRealTimeChannels = useCallback(() => {
    if (!user) return;

    // Consolidated real-time channel for all user data
    const channelName = `user_data_${user.id}`;
    
    if (channelPool.current.has(channelName)) {
      return channelPool.current.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      // Posts changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        invalidate('posts');
      })
      // Messages changes for this user
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        invalidate('messages');
      })
      // Notifications for this user
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id.eq.${user.id}`
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        invalidate('notifications');
      })
      // Likes changes
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        invalidate('likes');
      })
      .subscribe();

    channelPool.current.set(channelName, channel);
    
    console.log(`Optimized real-time channel created: ${channelName}`);
    return channel;
  }, [user, queryClient, invalidate]);

  // Network statistics
  const getNetworkStats = useCallback(() => {
    return {
      connection: connectionState,
      cache: getStats(),
      activeChannels: channelPool.current.size,
      batchQueueSize: batchQueue.current.length
    };
  }, [connectionState, getStats]);

  // Initialize optimization on mount
  useEffect(() => {
    if (!user) return;

    console.log('Initializing network optimizer for user:', user.id);
    
    // Set up optimized real-time channels
    const channel = optimizeRealTimeChannels();
    
    // Prefetch critical data if connection is good
    if (connectionState.connectionQuality !== 'poor') {
      prefetchCriticalData();
    }

    return () => {
      // Cleanup channels
      channelPool.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelPool.current.clear();
      
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, [user, optimizeRealTimeChannels, prefetchCriticalData, connectionState.connectionQuality]);

  // Adaptive sync based on connection quality
  useEffect(() => {
    if (!user) return;

    let syncInterval: NodeJS.Timeout;
    
    // Adjust sync frequency based on connection quality
    const getSyncInterval = () => {
      switch (connectionState.connectionQuality) {
        case 'excellent': return 5000;  // 5 seconds
        case 'good': return 10000;      // 10 seconds
        case 'poor': return 30000;      // 30 seconds
        default: return 0;              // No sync when offline
      }
    };

    const interval = getSyncInterval();
    if (interval > 0) {
      syncInterval = setInterval(() => {
        if (!document.hidden && connectionState.isConnected) {
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
      }, interval);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [user, connectionState, queryClient]);

  return {
    batchRequests,
    prefetchCriticalData,
    optimizeRealTimeChannels,
    getNetworkStats
  };
};