
import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useData } from "@/context/data-context";
import { MessageCircle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface PostCardProps {
  post: {
    id: string;
    userId: string;
    username: string;
    userAvatar: string;
    content: string;
    image?: string;
    video?: string;
    likes: number;
    comments: number;
    createdAt: Date;
    type: 'meme' | 'roast' | 'joke';
  };
  className?: string;
  hideCommentLink?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, className, hideCommentLink = false }) => {
  const { likePost } = useData();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleLike = () => {
    if (user) {
      likePost(post.id);
      setIsLiked(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }
  };

  // Handle video play/pause when visible/not visible in viewport
  useEffect(() => {
    if (!videoRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.log("Video play error:", e));
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(videoRef.current);
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  const getPostTypeBadgeStyles = () => {
    switch (post.type) {
      case 'meme':
        return 'bg-blue-500/20 text-blue-400';
      case 'roast':
        return 'bg-orange-500/20 text-orange-400';
      case 'joke':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className={cn("bg-black border border-gray-800 rounded-lg overflow-hidden h-full flex flex-col", className)}>
      <div className="p-4 flex-grow">
        {/* Header with user info and post type tag */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.userId}`}>
              <Avatar className="h-10 w-10 border border-yellow-500/30">
                <AvatarImage src={post.userAvatar} />
                <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link to={`/profile/${post.userId}`} className="font-medium text-yellow-500 hover:underline">
                {post.username}
              </Link>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(post.createdAt)} ago
              </p>
            </div>
          </div>
          
          {/* Post type badge */}
          <Badge className={`${getPostTypeBadgeStyles()}`} variant="outline">
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </Badge>
        </div>
        
        {/* Post content */}
        <p className="text-white mb-4">{post.content}</p>
        
        {post.image && (
          <img src={post.image} alt="Post" className="w-full rounded-md mb-4" />
        )}
        
        {post.video && (
          <video 
            ref={videoRef}
            controls
            className="w-full rounded-md mb-4"
            playsInline
            preload="metadata"
            loop
          >
            <source src={post.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {/* Post actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800 text-gray-400">
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center gap-2 hover:text-yellow-500 transition-colors p-2 rounded-full hover:bg-gray-800"
            onClick={handleLike}
            aria-label="Like post"
          >
            <span 
              className={`text-xl ${isAnimating ? 'animate-bounce' : ''}`} 
              role="img" 
              aria-label="laugh"
            >
              😂
            </span>
            <span className="font-medium">{post.likes}</span>
          </button>
          
          {hideCommentLink ? (
            <div className="flex items-center gap-2 text-gray-400 p-2">
              <MessageCircle size={18} />
              <span className="font-medium">{post.comments}</span>
            </div>
          ) : (
            <Link 
              to={`/post/${post.id}`}
              className="flex items-center gap-2 hover:text-yellow-500 transition-colors p-2 rounded-full hover:bg-gray-800"
            >
              <MessageCircle size={18} />
              <span className="font-medium">{post.comments}</span>
            </Link>
          )}
        </div>
        
        <button 
          className="hover:text-yellow-500 transition-colors p-2 rounded-full hover:bg-gray-800"
          aria-label="Share post"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};
