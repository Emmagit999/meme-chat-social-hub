import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Post } from "@/types";
import { Heart, MessageSquare, MoreHorizontal, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useData } from "@/context/data-context";
import { CommentSection } from './comment-section';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { likePost } = useData();

  return (
    <Card className="w-full border-yellow-400 shadow-gold">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarImage src={post.userAvatar} alt={post.username} />
            <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{post.username}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Report</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-sm mt-1">{post.content}</p>
            {post.image && (
              <img 
                src={post.image} 
                alt="Post Image" 
                className="w-full rounded-md mt-3 aspect-video object-cover" 
              />
            )}
            {post.video && (
              <video 
                src={post.video} 
                controls 
                className="w-full rounded-md mt-3 aspect-video object-cover" 
              />
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between p-4">
        <div className="flex gap-4">
          <Button 
            variant="ghost"
            onClick={() => likePost(post.id)}
          >
            <Heart className="h-5 w-5" />
            <span>{post.likes > 0 && post.likes}</span>
          </Button>
          <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
            <MessageSquare className="h-5 w-5" />
            <span>{post.comments > 0 && post.comments}</span>
          </Button>
        </div>
        <Button variant="ghost">
          <Share2 className="h-5 w-5" />
        </Button>
      </CardFooter>
      {isExpanded && (
        <div className="pt-4 mt-4 border-t">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  );
};
