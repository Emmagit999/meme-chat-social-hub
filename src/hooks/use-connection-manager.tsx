import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export interface ConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  lastPing: number;
}

export const useConnectionManager = () => {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isConnected: false,
    latency: 0,
    connectionQuality: 'offline',
    lastPing: 0
  });

  const pingInterval = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Ping function to measure latency and connection quality
  const pingConnection = useCallback(async () => {
    if (!user) return;

    const startTime = performance.now();
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .limit(1);

      const endTime = performance.now();
      const latency = endTime - startTime;

      if (!error) {
        reconnectAttempts.current = 0;
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          latency,
          connectionQuality: latency < 100 ? 'excellent' : latency < 300 ? 'good' : 'poor',
          lastPing: Date.now()
        }));
      } else {
        throw error;
      }
    } catch (error) {
      console.warn('Connection ping failed:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        connectionQuality: 'offline',
        lastPing: Date.now()
      }));
      
      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(pingConnection, Math.pow(2, reconnectAttempts.current) * 1000);
      }
    }
  }, [user]);

  // Force reconnection
  const forceReconnect = useCallback(async () => {
    reconnectAttempts.current = 0;
    console.log('Force reconnecting...');
    await pingConnection();
  }, [pingConnection]);

  // Initialize connection monitoring
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, isOnline: true }));
      forceReconnect();
    };

    const handleOffline = () => {
      setConnectionState(prev => ({ 
        ...prev, 
        isOnline: false, 
        isConnected: false,
        connectionQuality: 'offline' 
      }));
    };

    // Set up network status listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Start periodic pinging
    pingConnection();
    pingInterval.current = setInterval(pingConnection, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
    };
  }, [user, pingConnection, forceReconnect]);

  return {
    connectionState,
    forceReconnect,
    isHealthy: connectionState.isOnline && connectionState.isConnected && connectionState.latency < 500
  };
};