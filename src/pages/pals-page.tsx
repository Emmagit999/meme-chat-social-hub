
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { User } from "@/types";
import { MessageCircle, UserPlus, UserMinus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useChat } from "@/hooks/use-chat";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client"; // Fixed import path

const PalsPage: React.FC = () => {
  const { user } = useAuth();
  const { startNewChat } = useChat();
  const navigate = useNavigate();
  const [pals, setPals] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPals = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id, profiles!friends_friend_id_fkey(id, username, avatar_url, bio, is_pro)')
          .eq('user_id', user.id);

        if (friendsError) throw friendsError;

        if (friendsData) {
          const formattedPals: User[] = friendsData.map(friend => ({
            id: friend.profiles.id,
            username: friend.profiles.username || 'user',
            displayName: friend.profiles.username || 'User',
            avatar: friend.profiles.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
            createdAt: new Date(),
            bio: friend.profiles.bio || '',
            isPro: friend.profiles.is_pro || false
          }));
          
          setPals(formattedPals);
        }
      } catch (error) {
        console.error('Error fetching pals:', error);
        toast.error('Failed to load pals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPals();
    
    const onlineInterval = setInterval(() => {
      const randomStatus = Math.random() > 0.5;
      if (randomStatus && !onlineUsers.includes("user2")) {
        setOnlineUsers(prev => [...prev, "user2"]);
        toast("Joke Master is now online!", {
          icon: "🟢",
        });
      } else if (!randomStatus && onlineUsers.includes("user2")) {
        setOnlineUsers(prev => prev.filter(id => id !== "user2"));
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(onlineInterval);
  }, [user]);
  
  const handleRemovePal = (palId: string) => {
    const updatedPals = pals.filter(pal => pal.id !== palId);
    setPals(updatedPals);
    toast.success("Pal removed successfully");
  };
  
  const handleMessagePal = (palId: string) => {
    startNewChat(palId);
    navigate('/chat');
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Your Pals</h1>
        <div className="animate-pulse text-center py-10">Loading your pals...</div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Your Pals</h1>
      
      {pals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="mb-4">You don't have any pals yet.</p>
            <p className="text-muted-foreground mb-6">Find people to connect with through the Merge page!</p>
            <Button onClick={() => navigate('/merge')} className="bg-memeGreen hover:bg-memeGreen/90">
              Find Pals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pals.map(pal => (
            <Card key={pal.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={pal.avatar} alt={pal.username} />
                      <AvatarFallback>
                        {pal.displayName?.substring(0, 2) || pal.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.includes(pal.id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{pal.displayName || pal.username}</h3>
                      {pal.isPro && (
                        <Badge variant="outline" className="text-xs bg-memeGreen/20 text-memeGreen border-none">
                          PRO
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">@{pal.username}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <p className="text-sm mb-4">{pal.bio || "No bio yet."}</p>
                
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex gap-1 items-center"
                    onClick={() => handleMessagePal(pal.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Message</span>
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => toast("Notifications turned on for " + pal.displayName)}
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400"
                      onClick={() => handleRemovePal(pal.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PalsPage;
