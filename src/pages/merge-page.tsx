
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { MessageCircle, X, Heart, Shuffle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";

const MergePage: React.FC = () => {
  const { startNewChat } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get online users and people to merge with
  useEffect(() => {
    const loadUsers = () => {
      // In a real app, this would fetch real users from the backend
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        setSuggestedUsers(users.filter(u => u.id !== user?.id));
      } else {
        // Create some initial users if none exist
        const initialUsers: User[] = [
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
          }
        ];
        localStorage.setItem('users', JSON.stringify(initialUsers));
        setSuggestedUsers(initialUsers);
      }
      
      // Set random users as online
      setOnlineUsers(["user1", "user3"]);
      setIsLoading(false);
    };
    
    loadUsers();
    
    // Set up a fake "real-time" system to update online users
    const interval = setInterval(() => {
      // In a real app this would be a websocket connection
      const user2Status = Math.random() > 0.7;
      const updatedOnline = ["user1", "user3"];
      
      if (user2Status) {
        updatedOnline.push("user2");
        toast("Joke Master is now online!", {
          icon: "🟢",
        });
      }
      
      setOnlineUsers(updatedOnline);
    }, 45000); // Every 45 seconds
    
    return () => clearInterval(interval);
  }, [user]);
  
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
      toast.error("You must be logged in to like users");
      return;
    }
    
    setSwiped(true);
    setDirection('right');
    
    // Add to pals
    const pals = JSON.parse(localStorage.getItem('pals') || '[]');
    if (!pals.some(p => p.id === currentUser.id)) {
      pals.push(currentUser);
      localStorage.setItem('pals', JSON.stringify(pals));
    }
    
    // Start a chat with this user
    const chatId = startNewChat(currentUser.id);
    
    toast.success(`You've matched with ${currentUser.displayName || currentUser.username}!`);
    
    goToNextUser();
    
    // Navigate to chat after a brief delay to let the swipe animation complete
    setTimeout(() => {
      navigate(`/chat`);
    }, 500);
  };
  
  const handleSkip = () => {
    setSwiped(true);
    setDirection('left');
    goToNextUser();
  };
  
  const handleStartChat = (user: User) => {
    startNewChat(user.id);
    navigate("/chat");
  };

  if (isLoading) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Merge with Memers</h1>
        <div className="p-10 rounded-lg bg-card border border-border animate-pulse">
          <p className="mb-4">Loading users...</p>
        </div>
      </div>
    );
  }
  
  if (suggestedUsers.length === 0) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Merge with Memers</h1>
        <div className="p-10 rounded-lg bg-card border border-border">
          <p className="mb-4">No users available right now.</p>
          <Button
            className="bg-memeGreen hover:bg-memeGreen/90"
            onClick={() => toast("We'll notify you when new users join!")}
          >
            <Shuffle className="h-5 w-5 mr-2" />
            Try Again Later
          </Button>
        </div>
      </div>
    );
  }

  const onlineFilteredUsers = suggestedUsers.filter(user => 
    onlineUsers.includes(user.id)
  );

  return (
    <div className="container py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Merge with Memers</h1>
      
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
              }`}
            >
              <CardHeader className="text-center pb-0">
                <div className="mx-auto mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.username} />
                    <AvatarFallback className="text-4xl">
                      {currentUser?.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold">
                    {currentUser?.displayName || currentUser?.username}
                  </h2>
                  {onlineUsers.includes(currentUser?.id) && (
                    <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{currentUser?.username}</p>
                {currentUser?.isPro && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-memeGreen/20 text-memeGreen rounded-full text-xs">
                      Pro Memer
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-center py-6">
                <p>{currentUser?.bio || "No bio yet. Just here for the memes!"}</p>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 border-destructive" 
                  onClick={handleSkip}
                >
                  <X className="h-6 w-6 text-destructive" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 rounded-full border-2 border-memeGreen" 
                  onClick={handleLike}
                >
                  <Heart className="h-6 w-6 text-memeGreen" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {(!isMobile || onlineFilteredUsers.length > 0) && (
          <div className={`flex-1 ${isMobile ? 'mt-8' : ''}`}>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Online Memers</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onlineFilteredUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No users online right now
                    </p>
                  ) : (
                    onlineFilteredUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.username} />
                              <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{user.displayName || user.username}</h3>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              // Add to pals
                              const pals = JSON.parse(localStorage.getItem('pals') || '[]');
                              if (!pals.some(p => p.id === user.id)) {
                                pals.push(user);
                                localStorage.setItem('pals', JSON.stringify(pals));
                                toast.success(`Added ${user.displayName || user.username} as a pal!`);
                              } else {
                                toast.info(`${user.displayName || user.username} is already your pal!`);
                              }
                            }}
                          >
                            <UserPlus className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleStartChat(user)}
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
        )}
      </div>
    </div>
  );
};

export default MergePage;
