
import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import { useChat } from "@/hooks/use-chat";

interface PalsListProps {
  pals: User[];
  isLoading: boolean;
}

export const PalsList: React.FC<PalsListProps> = ({ pals, isLoading }) => {
  const navigate = useNavigate();
  const { startNewChat } = useChat();

  const handleMessageFriend = async (friendId: string) => {
    const chatId = await startNewChat(friendId);
    if (chatId) {
      navigate('/chat');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-pulse text-lg">Loading pals...</div>
      </div>
    );
  }

  if (pals.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl mb-2">No pals yet</h2>
        <p className="text-muted-foreground mb-4">Go to the Merge page to connect with people!</p>
        <Button 
          onClick={() => navigate('/merge')}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          Find Pals
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pals.map(friend => (
        <Card key={friend.id} className="border-yellow-400">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-yellow-400">
                <AvatarImage src={friend.avatar} alt={friend.username} />
                <AvatarFallback className="text-lg">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-medium text-lg">{friend.displayName || friend.username}</h3>
                <p className="text-sm text-muted-foreground">@{friend.username}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1 border-yellow-400 text-yellow-500 hover:bg-yellow-500/10"
                onClick={() => handleMessageFriend(friend.id)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button 
                variant="outline"
                className="flex-1 border-yellow-400 text-yellow-500 hover:bg-yellow-500/10"
                onClick={() => navigate(`/profile/${friend.id}`)}
              >
                View Profile
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
