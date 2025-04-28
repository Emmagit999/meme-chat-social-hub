
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const PalsPage: React.FC = () => {
  const { user } = useAuth();
  const { getFriends, startNewChat } = useMessaging();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const friendsList = await getFriends();
        setFriends(friendsList);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFriends();
  }, [user, getFriends]);

  const handleStartChat = async (friendId: string) => {
    const chatId = await startNewChat(friendId);
    if (chatId) {
      navigate('/chat');
    }
  };

  return (
    <div className="container py-6 px-4 md:px-6 mt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">My Pals</h1>
        <Button 
          onClick={() => navigate('/merge')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
          size="sm"
        >
          Find More Friends
        </Button>
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
      ) : friends.length === 0 ? (
        <div className="text-center py-10 border border-gray-800 rounded-lg bg-gray-900">
          <Users className="h-12 w-12 mx-auto mb-3 text-yellow-500/50" />
          <h2 className="text-xl mb-2 text-yellow-500">No pals yet</h2>
          <p className="text-gray-400 mb-4">Find and connect with new friends!</p>
          <Button 
            onClick={() => navigate('/merge')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            Find Friends
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg bg-black hover:bg-gray-900 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-yellow-500/30">
                  <AvatarImage src={friend.avatar} />
                  <AvatarFallback className="bg-gray-800">
                    {friend.username?.substring(0, 2).toUpperCase() || <UserRound className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-yellow-500">
                    {friend.displayName || friend.username}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {friend.bio || 'No bio yet'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleStartChat(friend.id)}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Button>
                <Button
                  onClick={() => navigate(`/profile/${friend.id}`)}
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
