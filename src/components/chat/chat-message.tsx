
import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User } from '@/types';

interface ChatMessageProps {
  message: Message;
  currentUser: User;
  otherUserAvatar?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  currentUser,
  otherUserAvatar = "/assets/avatar1.jpg"
}) => {
  const isSentByMe = message.senderId === currentUser.id;

  return (
    <div
      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
    >
      {!isSentByMe && (
        <Avatar className="h-8 w-8 mr-2 self-end">
          <AvatarImage src={otherUserAvatar} />
          <AvatarFallback>
            {message.senderId.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isSentByMe
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={`text-xs mt-1 ${
            isSentByMe
              ? 'text-white/70 text-right'
              : 'text-gray-500'
          }`}
        >
          {format(message.createdAt, 'h:mm a')}
        </div>
      </div>
      {isSentByMe && (
        <Avatar className="h-8 w-8 ml-2 self-end">
          <AvatarImage src={currentUser.avatar || "/assets/avatar1.jpg"} />
          <AvatarFallback>
            {currentUser.displayName?.substring(0, 2) || 
             currentUser.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
