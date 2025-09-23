import { useEffect, useCallback, useRef } from 'react';
import { useConnectionManager } from './use-connection-manager';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionOptimizer = () => {
  const { connectionState, forceReconnect } = useConnectionManager();
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Intelligent reconnection strategy
  const intelligentReconnect = useCallback(async () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current++;
    console.log(`Attempting intelligent reconnection #${reconnectAttempts.current}`);

    try {
      // Test connection with a simple query
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (!error) {
        console.log('Connection restored successfully');
        reconnectAttempts.current = 0;
        
        // Aggressive data refresh after reconnection
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['posts'] }),
          queryClient.refetchQueries({ queryKey: ['messages'] }),
          queryClient.refetchQueries({ queryKey: ['notifications'] })
        ]);
      } else {
        throw error;
      }
    } catch (error) {
      console.warn('Reconnection failed:', error);
      
      // Exponential backoff for next attempt
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
      setTimeout(intelligentReconnect, delay);
    }
  }, [queryClient]);

  // Monitor connection and trigger reconnection when needed
  useEffect(() => {
    if (!connectionState.isConnected && connectionState.isOnline) {
      const timer = setTimeout(() => {
        intelligentReconnect();
      }, 2000); // Wait 2 seconds before attempting reconnection

      return () => clearTimeout(timer);
    } else if (connectionState.isConnected) {
      // Reset attempts when connection is restored
      reconnectAttempts.current = 0;
    }
  }, [connectionState.isConnected, connectionState.isOnline, intelligentReconnect]);

  // Optimize query caching based on connection quality
  useEffect(() => {
    const defaultOptions = queryClient.getDefaultOptions();
    
    let staleTime = 1000 * 60 * 5; // 5 minutes default
    let cacheTime = 1000 * 60 * 10; // 10 minutes default
    
    switch (connectionState.connectionQuality) {
      case 'excellent':
        staleTime = 1000 * 60 * 2; // 2 minutes
        cacheTime = 1000 * 60 * 5; // 5 minutes
        break;
      case 'good':
        staleTime = 1000 * 60 * 5; // 5 minutes
        cacheTime = 1000 * 60 * 10; // 10 minutes
        break;
      case 'poor':
        staleTime = 1000 * 60 * 10; // 10 minutes
        cacheTime = 1000 * 60 * 30; // 30 minutes
        break;
      case 'offline':
        staleTime = 1000 * 60 * 60; // 1 hour
        cacheTime = 1000 * 60 * 120; // 2 hours
        break;
    }

    queryClient.setDefaultOptions({
      queries: {
        ...defaultOptions.queries,
        staleTime,
        gcTime: cacheTime,
        retry: connectionState.connectionQuality === 'poor' ? 1 : 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    });
  }, [connectionState.connectionQuality, queryClient]);

  return {
    connectionState,
    intelligentReconnect,
    forceReconnect
  };
};