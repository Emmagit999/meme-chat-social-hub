
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Reply, ThumbsUp } from "lucide-react";
import { CommentReply } from "@/types";
import { useAuth } from "@/context/auth-context";

interface CommentReplyProps {
  reply: CommentReply;
  onLike: () => void;
}

export const CommentReplyItem: React.FC<CommentReplyProps> = ({ reply, onLike }) => {
  return (
    <div className="pl-10 mt-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={reply.userAvatar} alt={reply.username} />
          <AvatarFallback>{reply.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-secondary rounded-lg p-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium text-sm">{reply.username}</span>
              <p className="text-sm">{reply.content}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-1">
            <button 
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
              onClick={onLike}
            >
              <ThumbsUp className="h-3 w-3" />
              <span>{reply.likes > 0 && reply.likes}</span>
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

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    onAddReply(content);
    setContent('');
  };

  return (
    <div className="pl-10 mt-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
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
