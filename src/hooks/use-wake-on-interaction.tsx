import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

export const useWakeOnInteraction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dormantSince = useRef<number>(Date.now());
  const isActive = useRef<boolean>(true);
  const lastActivity = useRef<number>(Date.now());

  const wakeUp = useCallback(async () => {
    if (!user || isActive.current) return;
    
    const dormantDuration = Date.now() - dormantSince.current;
    
    // If dormant for more than 30 seconds, do a full refresh
    if (dormantDuration > 30000) {
      console.log('Wake-on-interaction: Full refresh after', dormantDuration / 1000, 'seconds');
      
      // Aggressive refresh of all data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['messages'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['chats'] }),
        queryClient.refetchQueries({ queryKey: ['posts'] }),
        queryClient.refetchQueries({ queryKey: ['messages'] })
      ]);
    }
    
    isActive.current = true;
    lastActivity.current = Date.now();
  }, [user, queryClient]);

  const markDormant = useCallback(() => {
    if (!isActive.current) return;
    
    dormantSince.current = Date.now();
    isActive.current = false;
    console.log('App went dormant');
  }, []);

  const handleActivity = useCallback(() => {
    lastActivity.current = Date.now();
    
    if (!isActive.current) {
      wakeUp();
    } else {
      isActive.current = true;
    }
  }, [wakeUp]);

  useEffect(() => {
    if (!user) return;

    // Track user interactions for wake-up
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'focus'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        markDormant();
      } else {
        handleActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check for dormancy every 5 seconds
    const dormancyCheck = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity.current;
      
      if (timeSinceActivity > 60000 && isActive.current) { // 1 minute
        markDormant();
      }
    }, 5000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(dormancyCheck);
    };
  }, [user, handleActivity, markDormant]);

  return { wakeUp, isActive: isActive.current };
};