
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  username: string;
  avatarSrc?: string;
  userId: string;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  username, 
  avatarSrc = "/assets/avatar1.jpg",
  userId,
  onBackClick,
  showBackButton = false
}) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="p-3 border-b border-gray-200 bg-white flex items-center">
      {showBackButton && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBackClick}
          className="mr-2"
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
        <h2 className="font-semibold">{username}</h2>
      </div>
      <Button variant="ghost" size="icon" className="text-gray-500">
        <MoreVertical className="h-5 w-5" />
      </Button>
    </div>
  );
};
