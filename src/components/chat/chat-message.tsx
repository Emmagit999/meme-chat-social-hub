import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message, User } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreVertical } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

interface ChatMessageProps {
  message: Message;
  currentUser: User;
  otherUserAvatar?: string;
  onDeleteMessage?: (messageId: string) => Promise<boolean>;
  onEditMessage?: (messageId: string, content: string) => Promise<boolean>;
  isDeleting?: boolean;
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  currentUser,
  otherUserAvatar = "/assets/avatar1.jpg",
  onDeleteMessage,
  onEditMessage,
  isDeleting = false,
  isOptimistic = false,
  status = 'sent'
}) => {
  const isSentByMe = message.senderId === currentUser.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isLocalDeleting, setIsLocalDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isDeletingMessage = message.content === '[deleted]';
  const showAsDeleting = isDeleting || isLocalDeleting;
  
  // Handle touch events for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);
  
  const handleDelete = async () => {
    if (!onDeleteMessage || isSubmitting) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this message?");
    if (!confirmed) return;
    
    try {
      setIsLocalDeleting(true);
      setIsSubmitting(true);
      const success = await onDeleteMessage(message.id);
      if (success) {
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsLocalDeleting(false);
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (isSubmitting) return;
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!onEditMessage || !editContent.trim() || editContent === message.content || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const success = await onEditMessage(message.id, editContent);
      if (success) {
        setIsEditing(false);
        toast.success('Message updated');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to update message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(message.content);
    }
  };

  // Handle touch events for long press
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(Date.now());
    setIsPressing(true);
  };

  const handleTouchEnd = () => {
    if (touchStart) {
      const touchDuration = Date.now() - touchStart;
      if (touchDuration > 500) {
        // Long press detected - could trigger context menu
        console.log('Long press detected');
      }
    }
    setTouchStart(null);
    setIsPressing(false);
  };

  // Handle deleted messages
  if (isDeletingMessage && !showAsDeleting) {
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
          className={`max-w-[70%] rounded-2xl p-4 border-2 border-dashed border-muted-foreground/30 ${
            isSentByMe ? 'bg-muted/20' : 'bg-muted/10'
          }`}
        >
          <div className="flex items-center">
            <p className="italic text-muted-foreground/70 text-sm">This message was deleted</p>
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
  }

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
        className={`max-w-[70%] rounded-2xl p-4 relative message-animate ${
          isSentByMe
            ? 'chat-bubble-sent text-white'
            : 'chat-bubble-received text-foreground'
        } ${isPressing ? 'opacity-70' : ''} ${
          isOptimistic ? 'opacity-80' : ''
        } transition-all duration-300 hover:scale-[1.02]`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {isSentByMe && !isEditing && !showAsDeleting && !isDeletingMessage && (
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
        
        {/* Show status indicators for optimistic messages */}
        {isOptimistic && status === 'sending' && (
          <div className="flex items-center gap-1 mb-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-500">Sending...</span>
          </div>
        )}
        
        {isOptimistic && status === 'failed' && (
          <div className="flex items-center gap-1 mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-xs text-red-500">Failed to send</span>
          </div>
        )}
        
        {showAsDeleting ? (
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
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {/* Show edited indicator */}
            {message.edited && (
              <div className="flex items-center mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                <span className="text-xs text-green-500">edited</span>
              </div>
            )}
          </div>
        )}
        
        {!isEditing && !showAsDeleting && !isDeletingMessage && (
          <div
            className={`text-xs mt-1 ${
              isSentByMe
                ? 'text-yellow-500/70 text-right'
                : 'text-yellow-500/50'
            }`}
          >
            {format(new Date(message.createdAt), 'h:mm a')}
            {isOptimistic && status === 'sent' && (
              <span className="ml-1 text-green-500">✓</span>
            )}
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