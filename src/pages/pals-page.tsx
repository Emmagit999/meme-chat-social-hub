
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, UserRound, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PalsPage: React.FC = () => {
  const { user } = useAuth();
  const { getFriends, startNewChat } = useMessaging();
  const [pals, setPals] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Improved function to load pals with better error handling
  const loadPals = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Try to get pals from friends table in Supabase
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);
        
      if (friendsError) {
        throw friendsError;
      }
      
      // If we have pals in the database
      if (friendsData && friendsData.length > 0) {
        const palIds = friendsData.map(f => f.friend_id);
        
        // Get the profile data for each pal
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', palIds);
          
        if (profilesError) {
          throw profilesError;
        }
        
        if (profilesData) {
          const formattedPals = profilesData.map(profile => ({
            id: profile.id,
            username: profile.username || 'pal',
            displayName: profile.username || 'Pal',
            avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
            bio: profile.bio || '',
            isPro: profile.is_pro || false,
            createdAt: new Date(profile.updated_at || new Date())
          }));
          
          setPals(formattedPals);
          return;
        }
      }
      
      // Fallback to getFriends method
      const friendsList = await getFriends();
      setPals(friendsList);
    } catch (error) {
      console.error('Error loading pals:', error);
      // Fallback to localStorage as last resort
      const storedPals = localStorage.getItem('pals');
      if (storedPals) {
        try {
          const parsedPals = JSON.parse(storedPals);
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
  
  useEffect(() => {
    loadPals();
  }, [user, getFriends]);

  const handleStartChat = async (palId: string) => {
    try {
      const chatId = await startNewChat(palId);
      if (chatId) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error("Couldn't start chat. Please try again.", {
        duration: 10000
      });
    }
  };
  
  const handleRefreshPals = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await loadPals();
    } catch (error) {
      console.error('Error refreshing pals:', error);
      toast.error("Couldn't refresh pals list", {
        duration: 10000
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container py-6 px-4 md:px-6 mt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">My Pals</h1>
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
    </div>
  );
};

export default PalsPage;
