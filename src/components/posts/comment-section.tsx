
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Reply, ThumbsUp } from "lucide-react";
import { CommentReplyItem, CommentReplyForm } from './comment-reply';

interface CommentItemProps {
  comment: Comment;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const [isReplying, setIsReplying] = useState(false);
  const { likeComment, addCommentReply, likeCommentReply } = useData();
  const { user } = useAuth();

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

  return (
    <div>
      <div className="flex items-start gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userAvatar} alt={comment.username} />
          <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 bg-secondary rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{comment.username}</span>
              <p>{comment.content}</p>
            </div>
          </div>
          <div className="flex gap-4 mt-2">
            <button 
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
              onClick={() => likeComment(comment.id)}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{comment.likes > 0 && comment.likes}</span>
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

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={user.avatar} alt={user.username} />
        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
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
