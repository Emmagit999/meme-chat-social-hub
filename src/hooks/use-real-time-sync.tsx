import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Enable real-time for all tables
    const enableRealtime = async () => {
      try {
        // Posts table real-time
        await supabase.rpc('enable_realtime_for_table', { table_name: 'posts' });
        
        // Comments table real-time  
        await supabase.rpc('enable_realtime_for_table', { table_name: 'comments' });
        
        // Messages table real-time
        await supabase.rpc('enable_realtime_for_table', { table_name: 'messages' });
        
        // Friends table real-time
        await supabase.rpc('enable_realtime_for_table', { table_name: 'friends' });
        
        // Notifications table real-time
        await supabase.rpc('enable_realtime_for_table', { table_name: 'notifications' });
        
        console.log('Real-time enabled for all tables');
      } catch (error) {
        console.log('Real-time might already be enabled:', error);
      }
    };

    enableRealtime();
  }, [user]);
};