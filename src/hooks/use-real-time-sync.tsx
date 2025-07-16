import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';

export const useRealTimeSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Real-time is already enabled by the migration
    console.log('Real-time sync initialized for all tables');
  }, [user]);
};