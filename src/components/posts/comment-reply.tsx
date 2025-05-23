
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CommentReply } from "@/types";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from 'react-router-dom';

interface CommentReplyProps {
  reply: CommentReply;
  onLike: () => void;
}

export const CommentReplyItem: React.FC<CommentReplyProps> = ({ reply, onLike }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(reply.likes);
  const navigate = useNavigate();

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 1000);
    onLike();
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate directly to user profile
    navigate(`/profile/${reply.userId}`);
  };

  return (
    <div className="pl-10 mt-2">
      <div className="flex items-start gap-2">
        <div 
          onClick={handleProfileClick} 
          className="cursor-pointer"
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={reply.userAvatar} alt={reply.username} />
            <AvatarFallback>{reply.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 bg-secondary rounded-lg p-2">
          <div className="flex justify-between items-start">
            <div>
              <div 
                onClick={handleProfileClick} 
                className="font-medium text-sm hover:underline cursor-pointer"
              >
                {reply.username}
              </div>
              <p className="text-sm">{reply.content}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            <button 
              className={`text-xs flex items-center gap-1 hover:text-foreground ${isLiked ? 'text-foreground' : 'text-muted-foreground'}`}
              onClick={handleLike}
            >
              <span 
                className={`text-xs ${isLiking ? 'animate-bounce' : ''}`} 
                role="img" 
                aria-label="laugh"
              >
                😂
              </span>
              <span>{localLikeCount > 0 && localLikeCount}</span>
            </button>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommentReplyForm: React.FC<{
  commentId: string;
  onAddReply: (content: string) => void;
  onCancel: () => void;
}> = ({ commentId, onAddReply, onCancel }) => {
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onAddReply(content);
    setContent('');
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/profile/${user.id}`);
  };

  return (
    <div className="pl-10 mt-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div onClick={handleProfileClick} className="cursor-pointer">
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <input 
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a reply..."
          className="flex-1 bg-secondary rounded-lg px-3 py-1 text-sm"
          autoFocus
        />
        <div className="flex gap-1">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onCancel}
            className="text-xs h-7"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="sm"
            className="bg-memeGreen text-white hover:bg-memeGreen/90 text-xs h-7"
            disabled={!content.trim()}
          >
            Reply
          </Button>
        </div>
      </form>
    </div>
  );
};
