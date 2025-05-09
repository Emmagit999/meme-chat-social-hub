
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

  // Load pal requests data
  const loadPalRequests = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      console.log("Fetching pal requests for user:", user.id);
      
      // Get requests sent by the user
      const { data: sentData, error: sentError } = await supabase
        .from('pal_requests')
        .select('*, sender:sender_id(*), receiver:receiver_id(*)')
        .eq('sender_id', user.id);
      
      if (sentError) {
        console.error("Error fetching sent pal requests:", sentError);
        throw sentError;
      }
      
      console.log("Sent pal requests:", sentData);
      
      // Get requests received by the user
      const { data: receivedData, error: receivedError } = await supabase
        .from('pal_requests')
        .select('*, sender:sender_id(*), receiver:receiver_id(*)')
        .eq('receiver_id', user.id);
      
      if (receivedError) {
        console.error("Error fetching received pal requests:", receivedError);
        throw receivedError;
      }
      
      console.log("Received pal requests:", receivedData);
      
      // Format the data
      const formattedSentRequests = sentData?.map(formatPalRequest) || [];
      const formattedReceivedRequests = receivedData?.map(formatPalRequest) || [];
      
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
  
  // Format a pal request from Supabase
  const formatPalRequest = (request: any): PalRequest => {
    return {
      id: request.id,
      sender_id: request.sender_id,
      receiver_id: request.receiver_id,
      status: request.status || 'pending',
      created_at: new Date(request.created_at),
      sender: request.sender ? {
        id: request.sender.id,
        username: request.sender.username || '',
        displayName: request.sender.username || 'User',
        avatar: request.sender.avatar_url || '',
        bio: request.sender.bio || '',
        isPro: request.sender.is_pro || false,
        createdAt: new Date(request.sender.updated_at || new Date())
      } : undefined,
      receiver: request.receiver ? {
        id: request.receiver.id,
        username: request.receiver.username || '',
        displayName: request.receiver.username || 'User',
        avatar: request.receiver.avatar_url || '',
        bio: request.receiver.bio || '',
        isPro: request.receiver.is_pro || false,
        createdAt: new Date(request.receiver.updated_at || new Date())
      } : undefined
    };
  };

  // Send a pal request
  const sendPalRequest = async (receiverId: string) => {
    if (!user) return false;
    
    try {
      // Check if a request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('pal_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
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
      
      // Insert the new request
      const { data, error } = await supabase
        .from('pal_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          status: 'pending'
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
        .from('pal_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) {
        console.error("Error fetching request details:", requestError);
        throw requestError;
      }
      
      // Update the request status
      const { error: updateError } = await supabase
        .from('pal_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      if (updateError) {
        console.error("Error accepting pal request:", updateError);
        toast.error("Couldn't accept pal request. Please try again.", {
          duration: 10000
        });
        return false;
      }
      
      // Add both users to each other's friends list
      const friendsPromises = [
        // Add sender to receiver's friends
        supabase.from('friends').insert({
          user_id: user.id,
          friend_id: requestData.sender_id
        }),
        // Add receiver to sender's friends
        supabase.from('friends').insert({
          user_id: requestData.sender_id,
          friend_id: user.id
        })
      ];
      
      const friendsResults = await Promise.all(friendsPromises);
      
      // Check for errors in adding friends
      const friendsError = friendsResults.find(result => result.error);
      if (friendsError) {
        console.error("Error adding to friends list:", friendsError);
        toast.error("Error adding to pals list. Please try again.", {
          duration: 10000
        });
        return false;
      }
      
      // Create a notification for the sender
      await supabase
        .from('notifications')
        .insert({
          user_id: requestData.sender_id,
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
      // Get the request details first
      const { data: requestData, error: requestError } = await supabase
        .from('pal_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (requestError) {
        console.error("Error fetching request details:", requestError);
        throw requestError;
      }
      
      // Update the request status
      const { error } = await supabase
        .from('pal_requests')
        .update({ status: 'rejected' })
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
      
      // Check for pending requests
      const { data: requestData, error: requestError } = await supabase
        .from('pal_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .maybeSingle();
      
      if (requestError && requestError.code !== 'PGRST116') {
        console.error("Error checking request status:", requestError);
        throw requestError;
      }
      
      if (requestData) {
        if (requestData.status === 'accepted') {
          return 'accepted';
        } else if (requestData.sender_id === user.id) {
          return 'requested';
        } else {
          return 'pending';
        }
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
      
      // Set up real-time listener for pal_requests table
      const requestsChannel = supabase
        .channel('pal-requests-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pal_requests', filter: `or(receiver_id=eq.${user.id},sender_id=eq.${user.id})` },
          (payload) => {
            console.log('Pal requests change detected:', payload);
            loadPalRequests();
          }
        )
        .subscribe();
        
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
        supabase.removeChannel(requestsChannel);
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
