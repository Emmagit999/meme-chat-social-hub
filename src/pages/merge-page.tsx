
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { MessageCircle, X, Heart, Shuffle, UserPlus, Search, Smile } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

const MergePage: React.FC = () => {
  const { startNewChat, registerUser } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [showingMessageBox, setShowingMessageBox] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Get online users and people to merge with
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      try {
        // Get real users from Supabase
        const { data: profilesData, error } = await supabase
          .from('profiles')
          .select('*');
        
        if (error) {
          console.error('Error fetching profiles from Supabase:', error);
          setSuggestedUsers([]);
          setIsLoading(false);
          return;
        }
        
        // Filter out current user and convert Supabase profiles to User objects
        if (profilesData && profilesData.length > 0) {
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
          
          setSuggestedUsers(realUsers);
          
          // Set random users as online
          if (realUsers.length > 0) {
            setOnlineUsers([realUsers[0].id]);
          }
        } else {
          setSuggestedUsers([]);
        }
      } catch (error) {
        console.error('Error in loadUsers:', error);
        setSuggestedUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadUsers();
    }
    
    // Set up a fake "real-time" system to update online users
    const interval = setInterval(() => {
      // In a real app this would be a websocket connection
      if (suggestedUsers.length > 1) {
        const randomUserIndex = Math.floor(Math.random() * suggestedUsers.length);
        const randomUserId = suggestedUsers[randomUserIndex].id;
        const isOnline = Math.random() > 0.7;
        
        if (isOnline && !onlineUsers.includes(randomUserId)) {
          setOnlineUsers(prev => [...prev, randomUserId]);
          const userObj = suggestedUsers.find(u => u.id === randomUserId);
          if (userObj) {
            toast(`${userObj.displayName || userObj.username} is now online!`, {
              icon: "🟢",
            });
          }
        }
      }
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(interval);
  }, [user, suggestedUsers.length]);
  
  const currentUser = suggestedUsers[currentIndex];
  
  const resetSwipe = () => {
    setSwiped(false);
    setDirection(null);
  };
  
  const goToNextUser = () => {
    if (currentIndex < suggestedUsers.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prevIndex => prevIndex + 1);
        resetSwipe();
      }, 300);
    } else {
      toast("You've seen all potential matches. Refreshing...");
      setTimeout(() => {
        setCurrentIndex(0);
        resetSwipe();
      }, 300);
    }
  };
  
  const handleLike = async () => {
    if (!user || !currentUser) {
      toast.error("You must be logged in to add friends");
      return;
    }
    
    setSwiped(true);
    setDirection('right');
    
    try {
      // Add to friends in Supabase database
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: currentUser.id }
        ]);
      
      if (error) {
        console.error('Error adding friend:', error);
        toast.error('Failed to add as friend');
      } else {
        toast.success(`${currentUser.displayName || currentUser.username} added as friend!`);
        
        // Open message box to this user
        setSelectedUser(currentUser);
        setShowingMessageBox(true);
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
      toast.error('Failed to add as friend');
    }
    
    goToNextUser();
  };
  
  const handleSkip = () => {
    setSwiped(true);
    setDirection('left');
    goToNextUser();
  };
  
  const handleSendMessage = () => {
    if (!selectedUser || !messageText.trim()) return;
    
    // Start a chat and send the message
    const chatId = startNewChat(selectedUser.id);
    
    toast.success(`Started chatting with ${selectedUser.displayName || selectedUser.username}`);
    
    // Reset and navigate to chat
    setMessageText("");
    setShowingMessageBox(false);
    setSelectedUser(null);
    
    // Navigate to chat after a brief delay to let the animation complete
    setTimeout(() => {
      navigate(`/chat`);
    }, 300);
  };
  
  const handleStartChat = (chatUser: User) => {
    setSelectedUser(chatUser);
    setShowingMessageBox(true);
  };

  // Filter online users based on search query
  const filteredOnlineUsers = onlineUsers
    .map(id => suggestedUsers.find(u => u.id === id))
    .filter(Boolean) as User[];
  
  const searchFilteredUsers = filteredOnlineUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const displayName = user.displayName || '';
    const username = user.username || '';
    
    return displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Chat message emojis
  const emojis = ["😀", "😂", "❤️", "👍", "🔥", "🎉", "😍", "🤔", "👋", "🙌"];

  if (isLoading) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-6 text-yellow-500">Merge with Friends</h1>
        <div className="p-10 rounded-lg bg-gray-900 border border-gray-700 animate-pulse">
          <p className="mb-4 text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }
  
  if (suggestedUsers.length === 0) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-6 text-yellow-500">Merge with Friends</h1>
        <div className="p-10 rounded-lg bg-gray-900 border border-gray-700">
          <p className="mb-4 text-gray-400">No users available right now.</p>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
            onClick={() => toast("We'll notify you when new users join!")}
          >
            <Shuffle className="h-5 w-5 mr-2" />
            Try Again Later
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 px-4">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">Merge with Friends</h1>
      
      {showingMessageBox && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-4 mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={selectedUser.avatar} alt={selectedUser.username} />
                <AvatarFallback>{(selectedUser.displayName || selectedUser.username).substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-yellow-500">{selectedUser.displayName || selectedUser.username}</h3>
                <p className="text-sm text-gray-400">@{selectedUser.username}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={() => setShowingMessageBox(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-auto mb-3">
              <p className="text-sm text-gray-300">Start your conversation with {selectedUser.displayName || selectedUser.username}</p>
            </div>
            
            <div className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="pr-10 bg-gray-800 border-gray-700 text-white resize-none min-h-[80px]"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 bottom-2 text-yellow-500 hover:text-yellow-400 hover:bg-transparent"
                    >
                      <Smile className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="grid grid-cols-5 gap-2">
                      {emojis.map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          className="h-8 w-8 text-lg"
                          onClick={() => setMessageText(prev => prev + emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="relative max-w-md mx-auto">
            <Card 
              className={`transition-all duration-300 transform ${
                swiped 
                  ? direction === 'left' 
                    ? 'translate-x-[-100%] rotate-[-10deg] opacity-0' 
                    : 'translate-x-[100%] rotate-[10deg] opacity-0'
                  : ''
              } bg-gray-900 border-gray-700`}
            >
              <CardHeader className="text-center pb-0">
                <div className="mx-auto mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.username} />
                    <AvatarFallback className="text-4xl bg-gray-800 text-yellow-500">
                      {currentUser?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-yellow-500">
                    {currentUser?.displayName || currentUser?.username}
                  </h2>
                  {onlineUsers.includes(currentUser?.id) && (
                    <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-400">@{currentUser?.username}</p>
                {currentUser?.isPro && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">
                      Pro User
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-center py-6 text-gray-300">
                <p>{currentUser?.bio || "No bio yet. Just here for the memes!"}</p>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 border-red-500 bg-transparent" 
                  onClick={handleSkip}
                >
                  <X className="h-6 w-6 text-red-500" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 border-yellow-500 bg-transparent" 
                  onClick={handleLike}
                >
                  <Heart className="h-6 w-6 text-yellow-500" />
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="max-w-md mx-auto mt-6 flex justify-center">
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={() => handleStartChat(currentUser)}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Message Directly
            </Button>
          </div>
        </div>
        
        <div className={`flex-1 ${isMobile ? 'mt-8' : ''}`}>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <h2 className="text-xl font-semibold text-yellow-500">Online Friends</h2>
              <div className="mt-2">
                <div className="relative">
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-yellow-500 pl-8 placeholder:text-yellow-500/50"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-yellow-500/50" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchFilteredUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">
                    {searchQuery ? `No users found matching "${searchQuery}"` : "No users online right now"}
                  </p>
                ) : (
                  searchFilteredUsers.map(onlineUser => (
                    <div key={onlineUser.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={onlineUser.avatar} alt={onlineUser.username} />
                            <AvatarFallback className="bg-gray-800 text-yellow-500">{onlineUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                        </div>
                        <div>
                          <h3 className="font-medium text-yellow-500">{onlineUser.displayName || onlineUser.username}</h3>
                          <p className="text-sm text-gray-400">@{onlineUser.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from('friends')
                                .insert([
                                  { user_id: user?.id, friend_id: onlineUser.id }
                                ]);
                              
                              if (error) {
                                console.error('Error adding friend:', error);
                                toast.error('Failed to add as friend');
                              } else {
                                toast.success(`Added ${onlineUser.displayName || onlineUser.username} as friend!`);
                              }
                            } catch (error) {
                              console.error('Error adding friend:', error);
                              toast.error('Failed to add as friend');
                            }
                          }}
                          className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-700"
                        >
                          <UserPlus className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleStartChat(onlineUser)}
                          className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-700"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MergePage;
