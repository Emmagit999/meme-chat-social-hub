import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, UserRound, Users, RefreshCw, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePalRequests } from '@/hooks/use-pal-requests';

const PalsPage: React.FC = () => {
  const { user } = useAuth();
  const { getFriends, startNewChat } = useMessaging();
  const { receivedRequests, acceptPalRequest, rejectPalRequest, loadPalRequests } = usePalRequests();
  const [pals, setPals] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Enhanced function to load pals with direct database queries and optimized error handling
  const loadPals = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log("Loading pals for user:", user.id);
      
      // DIRECT APPROACH: Get both sides of friendship using a UNION query via two separate queries
      // First get all friends where current user is the initiator (user_id)
      const { data: outgoingFriends, error: outgoingError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
        
      if (outgoingError) {
        console.error("Error fetching outgoing friends:", outgoingError);
      }
      
      // Then get all friends where current user is the recipient (friend_id)
      const { data: incomingFriends, error: incomingError } = await supabase
        .from('friends')
        .select('user_id')
        .eq('friend_id', user.id);
        
      if (incomingError) {
        console.error("Error fetching incoming friends:", incomingError);
      }
      
      console.log("Outgoing friends:", outgoingFriends);
      console.log("Incoming friends:", incomingFriends);
      
      // Combine both directions of friendship
      const palIds = [
        ...(outgoingFriends?.map(f => f.friend_id) || []),
        ...(incomingFriends?.map(f => f.user_id) || [])
      ];
      
      // Remove duplicates
      const uniquePalIds = [...new Set(palIds)];
      
      console.log("Found unique pal IDs:", uniquePalIds);
      
      if (uniquePalIds.length > 0) {
        // Fetch profiles for all pals in a single query with specific error handling
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniquePalIds);
          
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw profilesError;
        }
        
        console.log("Profile data received for pals:", profilesData?.length);
        
        if (profilesData && profilesData.length > 0) {
          const formattedPals = profilesData.map(profile => ({
            id: profile.id,
            username: profile.username || 'pal',
            displayName: profile.username || 'Pal',
            avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
            bio: profile.bio || '',
            isPro: profile.is_pro || false,
            createdAt: new Date(profile.updated_at || new Date())
          }));
          
          console.log("Formatted pals:", formattedPals.length);
          setPals(formattedPals);
          
          // Cache successful results in localStorage as backup
          localStorage.setItem('pals', JSON.stringify(formattedPals));
        } else {
          console.log("No profile data found for pals");
          setPals([]);
        }
      } else {
        console.log("No friend relationships found in database");
        setPals([]);
      }
    } catch (error) {
      console.error('Error loading pals:', error);
      
      // Try to load from localStorage as backup
      const storedPals = localStorage.getItem('pals');
      if (storedPals) {
        try {
          const parsedPals = JSON.parse(storedPals);
          console.log("Loaded pals from localStorage backup:", parsedPals.length);
          setPals(parsedPals);
        } catch (e) {
          console.error('Error parsing stored pals:', e);
          setPals([]);
        }
      } else {
        setPals([]);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up real-time listener for the friends table
  useEffect(() => {
    if (!user) return;
    
    // Initial load
    loadPals();
    loadPalRequests();
    
    // Set up enhanced real-time listener for friends table changes with better error handling
    const friendsChannel = supabase
      .channel('friends-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends' },
        (payload) => {
          console.log('Friends table change detected:', payload);
          loadPals(); // Reload pals when changes are detected
        }
      )
      .subscribe((status) => {
        console.log("Friends channel subscription status:", status);
      });
      
    return () => {
      supabase.removeChannel(friendsChannel);
    };
  }, [user, getFriends, loadPalRequests]);

  const handleStartChat = async (palId: string) => {
    try {
      console.log("Starting chat with pal ID:", palId);
      const chatId = await startNewChat(palId);
      if (chatId) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const handleRefreshPals = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadPals();
      await loadPalRequests();
    } catch (error) {
      console.error('Error refreshing pals:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAcceptPalRequest = async (requestId: string) => {
    const success = await acceptPalRequest(requestId);
    if (success) {
      loadPals(); // Reload the pals list after accepting
    }
  };

  const pendingRequests = receivedRequests.filter(request => request.status === 'pending');

  return (
    <div className="container py-6 px-4 md:px-6 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-yellow-500">My Pals</h1>
          {pendingRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost"
            size="icon"
            className={`text-yellow-500 ${isRefreshing ? 'animate-spin' : ''}`}
            onClick={handleRefreshPals}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button 
            onClick={() => navigate('/search')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            size="sm"
          >
            Find More Pals
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pals" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-8">
          <TabsTrigger value="pals" className="text-base">
            My Pals
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-base">
            Pal Requests
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pals">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-800 rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : pals.length === 0 ? (
            <div className="text-center py-10 border border-gray-800 rounded-lg bg-gray-900">
              <Users className="h-12 w-12 mx-auto mb-3 text-yellow-500/50" />
              <h2 className="text-xl mb-2 text-yellow-500">No pals yet</h2>
              <p className="text-gray-400 mb-4">Find and connect with new friends!</p>
              <Button 
                onClick={() => navigate('/search')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Find Pals
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pals.map((pal) => (
                <div key={pal.id} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-black hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-yellow-500/30">
                      <AvatarImage src={pal.avatar} />
                      <AvatarFallback className="bg-gray-800">
                        {pal.username?.substring(0, 2).toUpperCase() || <UserRound className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-yellow-500">
                        {pal.displayName || pal.username}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {pal.bio || 'No bio yet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleStartChat(pal.id)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat</span>
                    </Button>
                    <Button
                      onClick={() => navigate(`/profile/${pal.id}`)}
                      variant="ghost" 
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="requests">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-800 rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-10 border border-gray-800 rounded-lg bg-gray-900">
              <UserCheck className="h-12 w-12 mx-auto mb-3 text-yellow-500/50" />
              <h2 className="text-xl mb-2 text-yellow-500">No pending pal requests</h2>
              <p className="text-gray-400 mb-4">When someone adds you as a pal, you'll see their request here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-black hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-yellow-500/30">
                      <AvatarImage src={request.sender?.avatar} />
                      <AvatarFallback className="bg-gray-800">
                        {request.sender?.username?.substring(0, 2).toUpperCase() || <UserRound className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-yellow-500">
                        {request.sender?.displayName || request.sender?.username}
                      </h3>
                      <p className="text-xs text-gray-400">
                        wants to be your pal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAcceptPalRequest(request.id)}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 border-green-500/50 text-green-500 hover:bg-green-500/10"
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      onClick={() => rejectPalRequest(request.id)}
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-1 text-red-500 hover:bg-red-500/10"
                    >
                      <UserX className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PalsPage;
