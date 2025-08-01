import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';

export const useBackgroundSync = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  const syncAllData = useCallback(async () => {
    if (!user || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['post_likes'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      setLastSync(Date.now());
      console.log('Background sync completed');
    } catch (error) {
      console.error('Background sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, queryClient, isSyncing]);

  useEffect(() => {
    if (!user) return;

    let syncInterval: NodeJS.Timeout;
    let visibilityTimer: NodeJS.Timeout;

    // Handle visibility changes (app becomes active)
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        // Delayed sync when app becomes visible
        clearTimeout(visibilityTimer);
        visibilityTimer = setTimeout(syncAllData, 500);
      }
    };

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncAllData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set up background sync interval (every 30 seconds when active)
    const startBackgroundSync = () => {
      syncInterval = setInterval(() => {
        if (!document.hidden && navigator.onLine) {
          syncAllData();
        }
      }, 30000); // 30 seconds
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Start background sync
    startBackgroundSync();
    
    // Initial sync
    if (navigator.onLine) {
      syncAllData();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
      clearTimeout(visibilityTimer);
    };
  }, [user, syncAllData]);

  return {
    isOnline,
    lastSync,
    isSyncing,
    syncNow: syncAllData
  };
};