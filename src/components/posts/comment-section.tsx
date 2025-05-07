
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Reply } from "lucide-react";
import { CommentReplyItem, CommentReplyForm } from './comment-reply';
import { Link, useNavigate } from 'react-router-dom';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [isReplying, setIsReplying] = useState(false);
  const { likeComment, addCommentReply, likeCommentReply } = useData();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(comment.likes);
  const navigate = useNavigate();

  if (!user) return null;

  const handleAddReply = (content: string) => {
    addCommentReply(comment.id, {
      commentId: comment.id,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar || "",
      content
    });
    setIsReplying(false);
  };

  const handleLikeComment = () => {
    // Toggle like state
    setIsLiked(!isLiked);
    
    // Update like count locally
    setLocalLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    
    // Animation effect
    setIsLiking(true);
    setTimeout(() => setIsLiking(false), 1000);
    
    // Update in database
    likeComment(comment.id);
  };
  
  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate directly to the profile page
    navigate(`/profile/${userId}`);
  };

  return (
    <div>
      <div className="flex items-start gap-2">
        <div 
          onClick={(e) => handleProfileClick(e, comment.userId)} 
          className="cursor-pointer"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.userAvatar} alt={comment.username} />
            <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1 bg-secondary rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <div 
                onClick={(e) => handleProfileClick(e, comment.userId)} 
                className="font-medium hover:underline cursor-pointer"
              >
                {comment.username}
              </div>
              <p>{comment.content}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <button 
              className={`text-xs flex items-center gap-1 hover:text-foreground ${isLiked ? 'text-foreground' : 'text-muted-foreground'}`}
              onClick={handleLikeComment}
            >
              <span 
                className={`text-sm ${isLiking ? 'animate-bounce' : ''}`} 
                role="img" 
                aria-label="laugh"
              >
                😂
              </span>
              <span>{localLikeCount > 0 && localLikeCount}</span>
            </button>
            <button 
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="h-4 w-4" />
              <span>Reply</span>
            </button>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Reply form */}
      {isReplying && (
        <CommentReplyForm 
          commentId={comment.id}
          onAddReply={handleAddReply}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map(reply => (
            <CommentReplyItem 
              key={reply.id} 
              reply={reply}
              onLike={() => likeCommentReply(comment.id, reply.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const CommentList: React.FC<{
  comments: Comment[];
}> = ({ comments }) => {
  return (
    <div className="space-y-4 mt-4">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export const CommentForm: React.FC<{
  postId: string;
}> = ({ postId }) => {
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { addComment } = useData();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    addComment({
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar || "",
      postId,
      content
    });
    
    setContent('');
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/profile/${user.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <div onClick={handleProfileClick} className="cursor-pointer">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <input 
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 bg-secondary rounded-lg px-3 py-2"
      />
      <Button 
        type="submit" 
        className="bg-memeGreen text-white hover:bg-memeGreen/90"
        disabled={!content.trim()}
      >
        Post
      </Button>
    </form>
  );
};

export const CommentSection: React.FC<{
  postId: string;
}> = ({ postId }) => {
  const { getPostComments } = useData();
  const comments = getPostComments(postId);
  
  return (
    <div>
      <CommentForm postId={postId} />
      <CommentList comments={comments} />
    </div>
  );
};
