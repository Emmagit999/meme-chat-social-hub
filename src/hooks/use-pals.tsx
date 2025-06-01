
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';

export function usePals() {
  const { user } = useAuth();
  const [pals, setPals] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPals = async () => {
    if (!user) {
      setPals([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading pals for user:", user.id);
      
      // Get all friends where current user is either the sender or receiver
      const { data: outgoingFriends, error: outgoingError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
      
      if (outgoingError) {
        console.error("Error fetching outgoing friends:", outgoingError);
        throw outgoingError;
      }
      
      const { data: incomingFriends, error: incomingError } = await supabase
        .from('friends')
        .select('user_id')
        .eq('friend_id', user.id);
      
      if (incomingError) {
        console.error("Error fetching incoming friends:", incomingError);
        throw incomingError;
      }
      
      // Combine both directions of friendship
      const palIds = [
        ...(outgoingFriends?.map(f => f.friend_id) || []),
        ...(incomingFriends?.map(f => f.user_id) || [])
      ];
      
      console.log("Found pal IDs:", palIds);
      
      if (palIds.length === 0) {
        setPals([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', palIds);
      
      if (profilesError) {
        console.error("Error fetching pal profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Found pal profiles:", profiles);
      
      // Transform profiles to User format
      const formattedPals: User[] = profiles?.map(profile => ({
        id: profile.id,
        username: profile.username || '',
        displayName: profile.username || 'User',
        avatar: profile.avatar_url || '',
        bio: profile.bio || '',
        isPro: profile.is_pro || false,
        createdAt: new Date(profile.updated_at || new Date())
      })) || [];
      
      setPals(formattedPals);
      console.log("Formatted pals:", formattedPals);
      
    } catch (error) {
      console.error("Error loading pals:", error);
      setError(error instanceof Error ? error.message : 'Failed to load pals');
      toast.error('Failed to load pals');
    } finally {
      setIsLoading(false);
    }
  };

  // Load pals when user changes
  useEffect(() => {
    loadPals();
  }, [user]);

  // Set up real-time listener for friends table
  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time listener for friends table");
    
    const friendsChannel = supabase
      .channel('friends-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friends',
          filter: `or(user_id=eq.${user.id},friend_id=eq.${user.id})`
        },
        (payload) => {
          console.log('Friends table change detected:', payload);
          loadPals(); // Reload pals when friends table changes
        }
      )
      .subscribe((status) => {
        console.log('Friends channel subscription status:', status);
      });
      
    return () => {
      console.log("Cleaning up friends channel subscription");
      supabase.removeChannel(friendsChannel);
    };
  }, [user]);

  return {
    pals,
    isLoading,
    error,
    loadPals
  };
}
