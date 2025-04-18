
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { Post } from "@/types";
import { Heart, MessageCircle, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { likePost, addComment, getPostComments } = useData();
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const comments = getPostComments(post.id);

  const handleLike = () => {
    likePost(post.id);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    addComment({
      postId: post.id,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      content: commentText
    });

    setCommentText('');
    setShowComments(true);
  };

  const getPostTypeClass = () => {
    switch (post.type) {
      case 'roast':
        return 'border-l-4 border-red-500';
      case 'joke':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-memeGreen';
    }
  };

  const getPostTypeTag = () => {
    switch (post.type) {
      case 'roast':
        return 'Roast';
      case 'joke':
        return 'Joke';
      default:
        return 'Meme';
    }
  };

  return (
    <Card className={`mb-4 hover:shadow-md transition-shadow ${getPostTypeClass()}`}>
      <CardHeader className="flex flex-row items-start gap-4 pb-2">
        <Avatar>
          <AvatarImage src={post.userAvatar} alt={post.username} />
          <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-semibold">@{post.username}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground inline-block w-fit">
            {getPostTypeTag()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="mb-3">{post.content}</p>
        {post.image && (
          <div className="rounded-md overflow-hidden mb-3">
            <img 
              src={post.image} 
              alt="Post media" 
              className="w-full h-auto object-cover max-h-[400px]" 
            />
          </div>
        )}
        {post.video && (
          <div className="rounded-md overflow-hidden mb-3">
            <video 
              src={post.video} 
              controls 
              className="w-full h-auto max-h-[400px]" 
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="flex items-center justify-between w-full mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-memeGreen flex gap-1"
            onClick={handleLike}
          >
            <Heart className={`h-5 w-5 ${post.likes > 0 ? 'fill-memeGreen text-memeGreen' : ''}`} />
            <span>{post.likes}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-memeGreen flex gap-1"
            onClick={() => setIsCommenting(!isCommenting)}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-memeGreen"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        
        {isCommenting && (
          <form onSubmit={handleSubmitComment} className="w-full mb-3">
            <Textarea 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="mb-2"
            />
            <Button type="submit" size="sm" className="bg-memeGreen hover:bg-memeGreen/90">
              Comment
            </Button>
          </form>
        )}
        
        {post.comments > 0 && (
          <div className="w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-memeGreen flex items-center gap-1 mb-2"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>{showComments ? "Hide comments" : "Show comments"}</span>
            </Button>
            
            {showComments && (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3 p-2 rounded-md bg-secondary">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.userAvatar} alt={comment.username} />
                      <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">@{comment.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
