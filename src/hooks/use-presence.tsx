import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth-context';

export interface UserPresence {
  user_id: string;
  username: string;
  avatar: string;
  online_at: string;
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  
  useEffect(() => {
    if (!user) return;

    const roomOne = supabase.channel('room_01');

    // Listen to presence events
    roomOne
      .on('presence', { event: 'sync' }, () => {
        const newState = roomOne.presenceState();
        const users = Object.values(newState).flat() as UserPresence[];
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        // Send current user's presence
        const userStatus: UserPresence = {
          user_id: user.id,
          username: user.username,
          avatar: user.avatar || '',
          online_at: new Date().toISOString(),
        };

        await roomOne.track(userStatus);
      });

    return () => {
      supabase.removeChannel(roomOne);
    };
  }, [user]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.some(u => u.user_id === userId);
  };

  return {
    onlineUsers,
    isUserOnline
  };
};