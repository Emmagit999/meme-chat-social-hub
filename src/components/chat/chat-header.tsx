
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  username: string;
  avatarSrc?: string;
  userId: string;
  onBackClick?: () => void;
  showBackButton?: boolean;
  isConnected?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  username, 
  avatarSrc = "/assets/avatar1.jpg",
  userId,
  onBackClick,
  showBackButton = true, // Always show back button by default
  isConnected = true
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${userId}`);
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      // Default behavior if no onBackClick provided
      navigate('/chat');
    }
  };

  return (
    <div className="p-4 border-b border-border chat-header-gradient flex items-center sticky top-0 z-10 shadow-lg">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="mr-3 hover:bg-white/10 text-white rounded-full transition-all duration-300 hover:scale-110"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      )}
      
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative">
          <Avatar 
            className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-white/30 transition-all 
                     ring-2 ring-white/20" 
            onClick={handleProfileClick}
          >
            <AvatarImage src={avatarSrc} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
              {username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 chat-online-indicator 
                         rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className="font-bold text-white text-lg truncate cursor-pointer hover:text-white/80 
                     transition-colors" 
            onClick={handleProfileClick}
          >
            {username}
          </h3>
          {!isConnected ? (
            <p className="text-sm text-red-300 flex items-center animate-pulse">
              <WifiOff className="h-4 w-4 mr-1" />
              Reconnecting...
            </p>
          ) : (
            <p className="text-sm text-white/70">Active now</p>
          )}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-white hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
        onClick={() => navigate(`/profile/${userId}`)}
      >
        <MoreVertical className="h-6 w-6" />
      </Button>
    </div>
  );
};
