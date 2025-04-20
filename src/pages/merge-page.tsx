
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { MessageCircle, X, Heart, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";

const MergePage: React.FC = () => {
  const { getSuggestedUsers, startNewChat } = useChat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  
  const suggestedUsers = getSuggestedUsers();
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
    if (!user) {
      toast.error("You must be logged in to like users");
      return;
    }
    
    setSwiped(true);
    setDirection('right');
    startNewChat(currentUser.id);
    try {
      const { error } = await supabase.from("friends").insert([
        { user_id: user.id, friend_id: currentUser.id }
      ]);
      if (error) throw error;
    } catch (e) {
      // already a friend is ok!
    }
    toast.success(`You've matched with ${currentUser.displayName || currentUser.username}!`);
    setTimeout(() => {
      navigate("/chat");
    }, 500);
    goToNextUser();
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

  return (
    <div className="container py-6">
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
                    <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
                    <AvatarFallback className="text-4xl">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h2 className="text-xl font-bold">
                  {currentUser.displayName || currentUser.username}
                </h2>
                <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                {currentUser.isPro && (
                  <div className="mt-2">
                    <span className="px-2 py-1 bg-memeGreen/20 text-memeGreen rounded-full text-xs">
                      Pro Memer
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="text-center py-6">
                <p>{currentUser.bio || "No bio yet. Just here for the memes!"}</p>
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
        
        <div className="flex-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Suggested Memers</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.displayName || user.username}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleStartChat(user)}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MergePage;
