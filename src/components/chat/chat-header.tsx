
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
  isConnected?: boolean; // Added isConnected as an optional prop
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  username, 
  avatarSrc = "/assets/avatar1.jpg",
  userId,
  onBackClick,
  showBackButton = false,
  isConnected = true // Default to true
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="p-3 border-b border-gray-700 bg-black flex items-center">
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBackClick}
          className="mr-2 text-yellow-500 hover:text-yellow-400 hover:bg-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div 
        className="flex items-center flex-1 cursor-pointer" 
        onClick={handleProfileClick}
      >
        <Avatar className="h-8 w-8 mr-3">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback>
            {username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold text-yellow-500">{username}</h2>
        {!isConnected && (
          <div className="ml-2 flex items-center text-red-500">
            <WifiOff className="h-3 w-3 mr-1" />
            <span className="text-xs">Offline</span>
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-900">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};
