
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessageProps {
  message: Message;
  currentUser: User;
  otherUserAvatar?: string;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onEditMessage?: (messageId: string, content: string) => Promise<boolean>;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  currentUser,
  otherUserAvatar = "/assets/avatar1.jpg",
  onDeleteMessage,
  onEditMessage
}) => {
  const isSentByMe = message.senderId === currentUser.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);
  
  const handleDelete = async () => {
    if (!onDeleteMessage || isSubmitting) return;
    
    try {
      setIsDeleting(true);
      setIsSubmitting(true);
      const success = await onDeleteMessage(message.id);
      if (!success) {
        console.error("Failed to delete message");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setIsDeleting(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };
  
  const handleSaveEdit = async () => {
    if (!onEditMessage || isSubmitting || editContent.trim() === '') return;
    
    try {
      setIsSubmitting(true);
      const success = await onEditMessage(message.id, editContent);
      if (success) {
        setIsEditing(false);
      } else {
        console.error("Failed to edit message");
      }
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  // Handle long press for mobile (touch) devices
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isSentByMe) return; // Only allow editing of own messages
    
    setIsPressing(true);
    pressTimer.current = setTimeout(() => {
      // Show context menu on long press
      e.preventDefault();
      setIsPressing(false);
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressing(false);
  };

  return (
    <div
      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} mb-3`}
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
        className={`max-w-[70%] rounded-lg p-3 relative ${
          isSentByMe
            ? 'bg-black text-yellow-500 border border-yellow-500/30'
            : 'bg-gray-900 text-yellow-400 border border-gray-700'
        } ${isPressing ? 'opacity-70' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {isSentByMe && !isEditing && !isDeleting && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-5 w-5 inline-flex items-center justify-center rounded-full text-yellow-500/50 hover:text-yellow-500 hover:bg-black/20">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem 
                  className="text-blue-400 hover:text-blue-300 cursor-pointer"
                  onClick={handleEdit}
                  disabled={isSubmitting}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {isDeleting ? (
          <p className="italic text-gray-400">Deleting message...</p>
        ) : isEditing && isSentByMe ? (
          <div className="flex flex-col">
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-gray-800 text-yellow-400 border border-yellow-500/50 rounded p-2 mb-1 resize-none"
              disabled={isSubmitting}
              rows={3}
            />
            <div className="flex justify-end">
              <button 
                onClick={() => { setIsEditing(false); setEditContent(message.content); }}
                className="px-2 py-1 text-xs mr-2 text-gray-400"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-2 py-1 text-xs bg-yellow-500 text-black rounded"
                disabled={isSubmitting || editContent.trim() === ''}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        
        {!isEditing && !isDeleting && (
          <div
            className={`text-xs mt-1 ${
              isSentByMe
                ? 'text-yellow-500/70 text-right'
                : 'text-yellow-500/50'
            }`}
          >
            {format(new Date(message.createdAt), 'h:mm a')}
          </div>
        )}
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
