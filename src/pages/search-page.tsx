
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useChat } from "@/hooks/use-chat";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Search, MessageCircle, UserPlus } from "lucide-react";
import { User } from "@/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { startNewChat } = useChat();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        // Get real users from Supabase
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error('Error fetching profiles from Supabase:', error);
          setAllUsers([]);
          setIsLoading(false);
          return;
        }
        
        if (profilesData && profilesData.length > 0) {
          // Convert Supabase profiles to User objects and filter out current user
          const realUsers = profilesData
            .filter((profile: any) => profile.id !== user?.id)
            .map((profile: any) => ({
              id: profile.id,
              username: profile.username || 'user',
              displayName: profile.username || 'User',
              avatar: profile.avatar_url || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
              createdAt: new Date(profile.updated_at || new Date()),
              bio: profile.bio || '',
              isPro: profile.is_pro || false
            }));
          
          setAllUsers(realUsers);
        } else {
          setAllUsers([]);
        }
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        setAllUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchUsers();
    }
  }, [user]);
  
  const filteredUsers = searchQuery.trim() ? 
    allUsers.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : 
    allUsers;

  const handleAddPal = (palUser: User) => {
    // Add to pals
    const pals = JSON.parse(localStorage.getItem('pals') || '[]');
    if (!pals.some(p => p.id === palUser.id)) {
      pals.push(palUser);
      localStorage.setItem('pals', JSON.stringify(pals));
      toast.success(`Added ${palUser.displayName || palUser.username} as a pal!`);
    } else {
      toast.info(`${palUser.displayName || palUser.username} is already your pal!`);
    }
  };
  
  const handleStartChat = (userId: string) => {
    startNewChat(userId);
    navigate("/chat");
  };
  
  if (!user) return null;
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Search Users</h1>
      
      <div className="flex gap-2 mb-6">
        <div className="relative w-full">
          <Input
            placeholder="Search for users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-yellow-200 focus:border-yellow-400 pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
        <Button className="bg-memeGreen hover:bg-memeGreen/90">
          <Search className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-pulse">Loading users...</div>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(suggestedUser => (
            <Card key={suggestedUser.id} className="border-yellow-200 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${suggestedUser.id}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={suggestedUser.avatar} alt={suggestedUser.username} />
                      <AvatarFallback>{suggestedUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/profile/${suggestedUser.id}`} className="hover:underline">
                      <p className="font-medium">{suggestedUser.displayName || suggestedUser.username}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground">@{suggestedUser.username}</p>
                  </div>
                </div>
                
                {suggestedUser.bio && (
                  <p className="mt-2 text-sm">{suggestedUser.bio}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0 border-t border-yellow-100 mt-4">
                <Button 
                  variant="outline"
                  onClick={() => handleAddPal(suggestedUser)}
                  className="flex items-center gap-1 text-yellow-600 border-yellow-300"
                >
                  <UserPlus className="h-4 w-4" />
                  Add as Pal
                </Button>
                <Button 
                  onClick={() => handleStartChat(suggestedUser.id)}
                  className="bg-memeGreen hover:bg-memeGreen/90"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            {searchQuery ? (
              <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
            ) : (
              <p className="text-muted-foreground">No other users found in the system</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
