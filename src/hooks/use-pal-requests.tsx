import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';

export type PalRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'requested';
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
      
      // Get sent requests (from friends table where user_id is current user)
      const { data: sentData, error: sentError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id);
      
      if (sentError) {
        console.error("Error fetching sent pal requests:", sentError);
        throw sentError;
      }
      
      console.log("Sent pal requests (from friends table):", sentData);
      
      // Get received requests (from friends table where friend_id is current user)
      const { data: receivedData, error: receivedError } = await supabase
        .from('friends')
        .select('*')
        .eq('friend_id', user.id);
      
      if (receivedError) {
        console.error("Error fetching received pal requests:", receivedError);
        throw receivedError;
      }
      
      console.log("Received pal requests (from friends table):", receivedData);

      // Fetch all profiles for the users we need
      const senderIds = receivedData?.map(request => request.user_id) || [];
      const receiverIds = sentData?.map(request => request.friend_id) || [];
      const allUserIds = [...new Set([...senderIds, ...receiverIds])];
      
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', allUserIds);
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Retrieved profiles for pals:", profilesData);
        
        // Create a map of user profiles for easy lookup
        const profilesMap: Record<string, any> = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        
        // Format the data to match our PalRequest type
        const formattedSentRequests = sentData?.map(request => ({
          id: request.id,
          sender_id: user.id,
          receiver_id: request.friend_id,
          status: 'requested' as const,
          created_at: new Date(request.created_at || new Date()),
          receiver: profilesMap[request.friend_id] ? {
            id: profilesMap[request.friend_id].id,
            username: profilesMap[request.friend_id].username || '',
            displayName: profilesMap[request.friend_id].username || 'User',
            avatar: profilesMap[request.friend_id].avatar_url || '',
            bio: profilesMap[request.friend_id].bio || '',
            isPro: profilesMap[request.friend_id].is_pro || false,
            createdAt: new Date(profilesMap[request.friend_id].updated_at || new Date())
          } : undefined
        })) || [];
        
        const formattedReceivedRequests = receivedData?.map(request => ({
          id: request.id,
          sender_id: request.user_id,
          receiver_id: user.id,
          status: 'pending' as const,
          created_at: new Date(request.created_at || new Date()),
          sender: profilesMap[request.user_id] ? {
            id: profilesMap[request.user_id].id,
            username: profilesMap[request.user_id].username || '',
            displayName: profilesMap[request.user_id].username || 'User',
            avatar: profilesMap[request.user_id].avatar_url || '',
            bio: profilesMap[request.user_id].bio || '',
            isPro: profilesMap[request.user_id].is_pro || false,
            createdAt: new Date(profilesMap[request.user_id].updated_at || new Date())
          } : undefined
        })) || [];
        
        setSentRequests(formattedSentRequests);
        setReceivedRequests(formattedReceivedRequests);
        
        // Set the count of pending received requests
        const pendingCount = formattedReceivedRequests.filter(r => r.status === 'pending').length;
        setRequestCount(pendingCount);
        
        // Save to localStorage for offline access
        localStorage.setItem('sentPalRequests', JSON.stringify(formattedSentRequests));
        localStorage.setItem('receivedPalRequests', JSON.stringify(formattedReceivedRequests));
      } else {
        setSentRequests([]);
        setReceivedRequests([]);
        setRequestCount(0);
      }
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
        .or(`and(user_id.eq.${user?.id},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${user?.id})`)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking existing request:", checkError);
        throw checkError;
      }
      
      // If a request already exists, don't create a new one
      if (existingRequest) {
        console.log("A pal request already exists");
        return false;
      }
      
      // Insert the new request as a friend entry
      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user?.id,
          friend_id: receiverId
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error sending pal request:", error);
        return false;
      }
      
      console.log("Pal request sent:", data);
      
      // Refresh the requests list
      loadPalRequests();
      
      return true;
    } catch (error) {
      console.error("Error in sendPalRequest:", error);
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
      
      // Create a notification for the sender
      await supabase
        .from('notifications')
        .insert({
          user_id: requestData.user_id,
          from_user_id: user?.id,
          from_username: user?.username || 'A user',
          type: 'friend',
          content: `${user?.username || 'Someone'} accepted your pal request`,
          avatar: user?.avatar
        });
      
      // Refresh the requests list
      loadPalRequests();
      
      return true;
    } catch (error) {
      console.error("Error in acceptPalRequest:", error);
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
        return false;
      }
      
      // Refresh the requests list
      loadPalRequests();
      
      return true;
    } catch (error) {
      console.error("Error in rejectPalRequest:", error);
      return false;
    }
  };
  
  // Check if a user is already a pal or has a pending request
  const getPalStatus = async (userId: string, currentUserId?: string): Promise<'none' | 'pending' | 'requested' | 'accepted'> => {
    if (!currentUserId || userId === currentUserId) return 'none';
    
    try {
      console.log(`Checking pal status between ${currentUserId} and ${userId}`);
      
      // Check if users are already friends (currentUser sent request)
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('friend_id', userId)
        .maybeSingle();
      
      if (friendError && friendError.code !== 'PGRST116') {
        console.error("Error checking friend status:", friendError);
        throw friendError;
      }
      
      if (friendData) {
        console.log("Users are friends (currentUser sent request)");
        return 'accepted';
      }
      
      // Check if the other user sent a request to current user
      const { data: receivedRequest, error: receivedError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .eq('friend_id', currentUserId)
        .maybeSingle();
        
      if (receivedError && receivedError.code !== 'PGRST116') {
        console.error("Error checking received request:", receivedError);
        throw receivedError;
      }
      
      if (receivedRequest) {
        console.log("Other user sent request to current user");
        return 'pending';
      }
      
      // Otherwise no relationship
      console.log("No pal relationship found");
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
      
      // Set up real-time listener for friends table with improved error handling
      const friendsChannel = supabase
        .channel('friends-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'friends', filter: `or(user_id=eq.${user.id},friend_id=eq.${user.id})` },
          (payload) => {
            console.log('Friends table change detected:', payload);
            loadPalRequests();
          }
        )
        .subscribe((status) => {
          console.log('Friends channel subscription status:', status);
        });
        
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
