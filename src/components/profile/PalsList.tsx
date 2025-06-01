
import React from 'react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
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

  const handleMessagePal = async (palId: string) => {
    try {
      const chatId = await startNewChat(palId);
      if (chatId) {
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-memeGreen mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading your pals...</p>
      </div>
    );
  }

  if (pals.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Pals Yet</h2>
        <p className="text-muted-foreground mb-6">
          Connect with other users to start building your pal network!
        </p>
        <Button 
          onClick={() => navigate('/merge')}
          className="bg-memeGreen hover:bg-memeGreen/90"
        >
          Find Pals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Pals ({pals.length})</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pals.map(pal => (
          <Card key={pal.id} className="border-yellow-400/20 hover:border-yellow-400/40 transition-colors">
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-yellow-400">
                  <AvatarImage src={pal.avatar} alt={pal.username} />
                  <AvatarFallback className="text-lg bg-yellow-100 text-yellow-800">
                    {pal.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">
                    {pal.displayName || pal.username}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    @{pal.username}
                  </p>
                  {pal.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {pal.bio}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 border-yellow-400 text-yellow-600 hover:bg-yellow-500/10"
                  onClick={() => handleMessagePal(pal.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1 border-yellow-400 text-yellow-600 hover:bg-yellow-500/10"
                  onClick={() => navigate(`/profile/${pal.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
