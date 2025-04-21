
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

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { getSuggestedUsers, startNewChat } = useChat();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsers = () => {
      const suggestedUsers = getSuggestedUsers();
      
      // Add some real-like mock users if there aren't many
      if (suggestedUsers.length < 5) {
        const mockUsers: User[] = [
          {
            id: "user1",
            username: "meme_lover",
            displayName: "Meme Lover",
            bio: "I live for the dankest memes",
            avatar: "/assets/avatar1.jpg",
            isPro: false,
            createdAt: new Date()
          },
          {
            id: "user2",
            username: "joke_master",
            displayName: "Joke Master",
            bio: "Making people laugh since 2010",
            avatar: "/assets/avatar2.jpg",
            isPro: true,
            createdAt: new Date()
          },
          {
            id: "user3",
            username: "gif_guru",
            displayName: "GIF Guru",
            bio: "A GIF says more than a thousand words",
            avatar: "/assets/avatar3.jpg",
            isPro: false,
            createdAt: new Date()
          },
          {
            id: "user4",
            username: "comedy_king",
            displayName: "Comedy King",
            bio: "Life's too short not to laugh",
            avatar: "/assets/avatar2.jpg",
            isPro: true,
            createdAt: new Date()
          }
        ];
        
        // Combine real and mock users without duplicates
        const combinedUsers = [...suggestedUsers];
        
        for (const mockUser of mockUsers) {
          if (!combinedUsers.some(u => u.id === mockUser.id)) {
            combinedUsers.push(mockUser);
          }
        }
        
        setAllUsers(combinedUsers);
      } else {
        setAllUsers(suggestedUsers);
      }
      
      setIsLoading(false);
    };
    
    fetchUsers();
  }, [getSuggestedUsers]);
  
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
        <Input
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-yellow-200 focus:border-yellow-400"
        />
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
            <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
