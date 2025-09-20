import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export interface OptimizedUserPresence {
  user_id: string;
  username: string;
  avatar: string;
  online_at: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastActivity?: string;
}

export const useOptimizedPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OptimizedUserPresence[]>([]);
  const [myStatus, setMyStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  const channelRef = useRef<any>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const activityTimeout = useRef<NodeJS.Timeout>();

  // Efficient presence state management
  const updatePresenceState = useCallback((newState: any) => {
    const users: OptimizedUserPresence[] = [];
    
    Object.values(newState).forEach((presences: any) => {
      presences.forEach((presence: any) => {
        if (presence.user_id && presence.username) {
          // Avoid duplicates and update existing users
          const existingIndex = users.findIndex(u => u.user_id === presence.user_id);
          if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...presence };
          } else {
            users.push(presence as OptimizedUserPresence);
          }
        }
      });
    });
    
    setOnlineUsers(users);
  }, []);

  // Activity tracking for auto away status
  const resetActivityTimer = useCallback(() => {
    if (activityTimeout.current) {
      clearTimeout(activityTimeout.current);
    }
    
    // Set to away after 5 minutes of inactivity
    activityTimeout.current = setTimeout(() => {
      if (myStatus === 'online') {
        setMyStatus('away');
      }
    }, 5 * 60 * 1000);
  }, [myStatus]);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (myStatus !== 'online') {
        setMyStatus('online');
      }
      resetActivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetActivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (activityTimeout.current) {
        clearTimeout(activityTimeout.current);
      }
    };
  }, [myStatus, resetActivityTimer]);

  // Send presence updates efficiently
  const updateMyPresence = useCallback(async (status?: 'online' | 'away' | 'busy' | 'offline') => {
    if (!user || !channelRef.current) return;

    const userStatus: OptimizedUserPresence = {
      user_id: user.id,
      username: user.username || 'Anonymous',
      avatar: user.avatar || '',
      online_at: new Date().toISOString(),
      status: status || myStatus,
      lastActivity: new Date().toISOString()
    };

    try {
      await channelRef.current.track(userStatus);
    } catch (error) {
      console.warn('Failed to update presence:', error);
    }
  }, [user, myStatus]);

  // Initialize presence channel with optimization
  useEffect(() => {
    if (!user) return;

    const channelName = 'optimized_presence';
    channelRef.current = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id // Use user ID as unique key
        }
      }
    });

    channelRef.current
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        updatePresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('User joined presence:', key);
        const newState = channelRef.current.presenceState();
        updatePresenceState(newState);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('User left presence:', key);
        const newState = channelRef.current.presenceState();
        updatePresenceState(newState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updateMyPresence();
          
          // Set up heartbeat to maintain presence
          heartbeatInterval.current = setInterval(() => {
            updateMyPresence();
          }, 30000); // Every 30 seconds
        }
      });

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, updatePresenceState, updateMyPresence]);

  // Update presence when status changes
  useEffect(() => {
    updateMyPresence(myStatus);
  }, [myStatus, updateMyPresence]);

  const isUserOnline = useCallback((userId: string): boolean => {
    const user = onlineUsers.find(u => u.user_id === userId);
    return user?.status === 'online' || user?.status === 'away' || user?.status === 'busy';
  }, [onlineUsers]);

  const getUserStatus = useCallback((userId: string) => {
    return onlineUsers.find(u => u.user_id === userId)?.status || 'offline';
  }, [onlineUsers]);

  return {
    onlineUsers,
    myStatus,
    setMyStatus,
    isUserOnline,
    getUserStatus,
    totalOnline: onlineUsers.filter(u => u.status !== 'offline').length
  };
};