
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';

export type PalRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  sender?: User;
  receiver?: User;
};

export function usePalRequests() {
  const { user } = useAuth();
  const [sentRequests, setSentRequests] = useState<PalRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);

  // Load pal requests data - using the 'friends' table as workaround
  // since we don't have a dedicated pal_requests table in the schema
  const loadPalRequests = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching pal requests for user:", user.id);
      
      // Get sent requests (simulated from friends table where established=false)
      const { data: sentData, error: sentError } = await supabase
        .from('friends')
        .select('*, profiles!friends_friend_id_fkey(*)')
        .eq('user_id', user.id);
      
      if (sentError) {
        console.error("Error fetching sent pal requests:", sentError);
        throw sentError;
      }
      
      console.log("Sent pal requests (from friends table):", sentData);
      
      // Get received requests (simulated from friends table where established=false)
      const { data: receivedData, error: receivedError } = await supabase
        .from('friends')
        .select('*, profiles!friends_user_id_fkey(*)')
        .eq('friend_id', user.id);
      
      if (receivedError) {
        console.error("Error fetching received pal requests:", receivedError);
        throw receivedError;
      }
      
      console.log("Received pal requests (from friends table):", receivedData);
      
      // Format the data to match our PalRequest type
      const formattedSentRequests = sentData?.map(request => ({
        id: request.id,
        sender_id: user.id,
        receiver_id: request.friend_id,
        status: 'requested' as const,
        created_at: new Date(request.created_at || new Date()),
        receiver: request.profiles ? {
          id: request.profiles.id,
          username: request.profiles.username || '',
          displayName: request.profiles.username || 'User',
          avatar: request.profiles.avatar_url || '',
          bio: request.profiles.bio || '',
          isPro: request.profiles.is_pro || false,
          createdAt: new Date(request.profiles.updated_at || new Date())
        } : undefined
      })) || [];
      
      const formattedReceivedRequests = receivedData?.map(request => ({
        id: request.id,
        sender_id: request.user_id,
        receiver_id: user.id,
        status: 'pending' as const,
        created_at: new Date(request.created_at || new Date()),
        sender: request.profiles ? {
          id: request.profiles.id,
          username: request.profiles.username || '',
          displayName: request.profiles.username || 'User',
          avatar: request.profiles.avatar_url || '',
          bio: request.profiles.bio || '',
          isPro: request.profiles.is_pro || false,
          createdAt: new Date(request.profiles.updated_at || new Date())
        } : undefined
      })) || [];
      
      setSentRequests(formattedSentRequests);
      setReceivedRequests(formattedReceivedRequests);
      
      // Set the count of pending received requests
      const pendingCount = formattedReceivedRequests.filter(r => r.status === 'pending').length;
      setRequestCount(pendingCount);
    } catch (error) {
      console.error("Error in loadPalRequests:", error);
      
      // Try to load from localStorage as backup
      const storedSentRequests = localStorage.getItem('sentPalRequests');
      const storedReceivedRequests = localStorage.getItem('receivedPalRequests');
      
      if (storedSentRequests) {
        try {
          setSentRequests(JSON.parse(storedSentRequests));
        } catch (e) {
          console.error('Error parsing stored sent requests:', e);
        }
      }
      
      if (storedReceivedRequests) {
        try {
          const parsedRequests = JSON.parse(storedReceivedRequests);
          setReceivedRequests(parsedRequests);
          setRequestCount(parsedRequests.filter(r => r.status === 'pending').length);
        } catch (e) {
          console.error('Error parsing stored received requests:', e);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Send a pal request
  const sendPalRequest = async (receiverId: string) => {
    if (!user) return false;
    
    try {
      // Check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user.id})`)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing request:", checkError);
        throw checkError;
      }
      
      // If a request already exists, don't create a new one
      if (existingRequest) {
        toast.info("A pal request already exists between you and this user", {
          duration: 10000
        });
        return false;
      }
      
      // Insert the new request as a friend entry
      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: receiverId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error sending pal request:", error);
        toast.error("Couldn't send pal request. Please try again.", {
          duration: 10000
        });
        return false;
      }
      
      console.log("Pal request sent:", data);
      
      // Create a notification for the receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          from_user_id: user.id,
          from_username: user.username || 'A user',
          type: 'friend',
          content: `${user.username || 'Someone'} sent you a pal request`,
          avatar: user.avatar
        });
      
      // Refresh the requests list
      loadPalRequests();
      
      toast.success("Pal request sent!", {
        duration: 10000
      });
      
      return true;
    } catch (error) {
      console.error("Error in sendPalRequest:", error);
      toast.error("Couldn't send pal request. Please try again.", {
        duration: 10000
      });
      return false;
    }
  };

  // Accept a pal request
  const acceptPalRequest = async (requestId: string) => {
    if (!user) return false;
    
    try {
      // Get the request details first
      const { data: requestData, error: requestError } = await supabase
        .from('friends')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) {
        console.error("Error fetching request details:", requestError);
        throw requestError;
      }
      
      // No need to update status - friends table already represents the connection
      
      // Create a notification for the sender
      await supabase
        .from('notifications')
        .insert({
          user_id: requestData.user_id,
          from_user_id: user.id,
          from_username: user.username || 'A user',
          type: 'friend',
          content: `${user.username || 'Someone'} accepted your pal request`,
          avatar: user.avatar
        });
      
      // Refresh the requests list
      loadPalRequests();
      
      toast.success("Pal request accepted!", {
        duration: 10000
      });
      
      return true;
    } catch (error) {
      console.error("Error in acceptPalRequest:", error);
      toast.error("Couldn't accept pal request. Please try again.", {
        duration: 10000
      });
      return false;
    }
  };

  // Reject a pal request
  const rejectPalRequest = async (requestId: string) => {
    if (!user) return false;
    
    try {
      // Delete the friends entry
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);
      
      if (error) {
        console.error("Error rejecting pal request:", error);
        toast.error("Couldn't reject pal request. Please try again.", {
          duration: 10000
        });
        return false;
      }
      
      // Refresh the requests list
      loadPalRequests();
      
      toast.success("Pal request rejected", {
        duration: 10000
      });
      
      return true;
    } catch (error) {
      console.error("Error in rejectPalRequest:", error);
      toast.error("Couldn't reject pal request. Please try again.", {
        duration: 10000
      });
      return false;
    }
  };
  
  // Check if a user is already a pal or has a pending request
  const getPalStatus = async (userId: string): Promise<'none' | 'pending' | 'requested' | 'accepted'> => {
    if (!user || userId === user.id) return 'none';
    
    try {
      // Check if users are already friends
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('friend_id', userId)
        .maybeSingle();
      
      if (friendError && friendError.code !== 'PGRST116') {
        console.error("Error checking friend status:", friendError);
        throw friendError;
      }
      
      if (friendData) {
        return 'accepted';
      }
      
      // Check if the other user sent a request to current user
      const { data: receivedRequest, error: receivedError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .eq('friend_id', user.id)
        .maybeSingle();
        
      if (receivedError && receivedError.code !== 'PGRST116') {
        console.error("Error checking received request:", receivedError);
        throw receivedError;
      }
      
      if (receivedRequest) {
        return 'pending';
      }
      
      // Check if current user sent a request to the other user
      const { data: sentRequest, error: sentError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('friend_id', userId)
        .maybeSingle();
        
      if (sentError && sentError.code !== 'PGRST116') {
        console.error("Error checking sent request:", sentError);
        throw sentError;
      }
      
      if (sentRequest) {
        return 'requested';
      }
      
      return 'none';
    } catch (error) {
      console.error("Error in getPalStatus:", error);
      return 'none';
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadPalRequests();
      
      // Set up real-time listener for friends table
      const friendsChannel = supabase
        .channel('friends-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'friends', filter: `or(user_id=eq.${user.id},friend_id=eq.${user.id})` },
          (payload) => {
            console.log('Friends table change detected:', payload);
            loadPalRequests();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(friendsChannel);
      };
    }
  }, [user]);
  
  // Cache data in localStorage when it changes
  useEffect(() => {
    if (sentRequests.length > 0) {
      localStorage.setItem('sentPalRequests', JSON.stringify(sentRequests));
    }
    if (receivedRequests.length > 0) {
      localStorage.setItem('receivedPalRequests', JSON.stringify(receivedRequests));
    }
  }, [sentRequests, receivedRequests]);

  return {
    sentRequests,
    receivedRequests,
    isLoading,
    requestCount,
    sendPalRequest,
    acceptPalRequest,
    rejectPalRequest,
    getPalStatus,
    loadPalRequests
  };
}
