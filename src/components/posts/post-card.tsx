
import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { useData } from "@/context/data-context";
import { MessageCircle, Share2, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";

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
  showDeleteButton?: boolean;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  className, 
  hideCommentLink = false,
  showDeleteButton = false,
  onDelete
}) => {
  const { likePost, isPostLiked, likedPosts } = useData();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLiked, setIsLiked] = useState(() => isPostLiked(post.id));
  const [isAnimating, setIsAnimating] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes);
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [userClickedPlay, setUserClickedPlay] = useState(false);

  // Update isLiked whenever likedPosts changes
  useEffect(() => {
    setIsLiked(isPostLiked(post.id));
  }, [likedPosts, post.id, isPostLiked]);

  // Update localLikeCount when post.likes changes
  useEffect(() => {
    setLocalLikeCount(post.likes);
  }, [post.likes]);

  const handleLike = () => {
    if (!user) return;
    
    // Toggle like state
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // Update local like count
    const newLikeCount = newIsLiked ? localLikeCount + 1 : Math.max(0, localLikeCount - 1);
    setLocalLikeCount(newLikeCount);
    
    // Animate emoji
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
    
    // Call API to update like in database
    likePost(post.id);
  };
  
  const handleUserProfile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate directly to the user's profile page
    navigate(`/profile/${post.userId}`);
  };

  const handleDeletePost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(post.id);
    }
  };

  const handleVideoClick = () => {
    if (!isMobile) {
      // On desktop, toggle play/pause on click
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(e => console.log("Video play error:", e));
          setUserClickedPlay(true);
        } else {
          videoRef.current.pause();
          setUserClickedPlay(false);
        }
      }
    }
  };

  // Enhanced Intersection Observer for videos - only autoplay on mobile devices
  useEffect(() => {
    if (!videoRef.current || !post.video) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShouldAutoplay(true);
            // Only autoplay on mobile or if user has clicked play before
            if (isMobile || userClickedPlay) {
              videoRef.current?.play().catch(e => {
                // Handle autoplay restrictions by muting the video first
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(err => 
                    console.log("Video play error:", err)
                  );
                }
              });
            }
          } else {
            setShouldAutoplay(false);
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current?.pause();
            }
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
  }, [post.video, isMobile, userClickedPlay]);

  // Make sure videos are properly sized
  useEffect(() => {
    if (videoRef.current && post.video) {
      videoRef.current.style.width = '100%';
      videoRef.current.style.height = 'auto';
      videoRef.current.style.maxHeight = '400px';
      videoRef.current.style.objectFit = 'contain';
      videoRef.current.style.margin = '0 auto';
    }
  }, [post.video]);

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
            <div 
              onClick={handleUserProfile}
              className="cursor-pointer"
            >
              <Avatar className="h-10 w-10 border border-yellow-500/30 cursor-pointer">
                <AvatarImage src={post.userAvatar} />
                <AvatarFallback>{post.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div 
                onClick={handleUserProfile}
                className="font-medium text-yellow-500 hover:underline cursor-pointer"
              >
                {post.username}
              </div>
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
          <img src={post.image} alt="Post" className="w-full rounded-md mb-4 object-contain max-h-[400px]" />
        )}
        
        {post.video && (
          <div className="relative">
            <video 
              ref={videoRef}
              controls={isMobile || userClickedPlay}
              className="w-full rounded-md mb-4 cursor-pointer"
              playsInline
              preload="metadata"
              loop
              onClick={handleVideoClick}
              poster={post.video + '#t=0.1'} // Add a poster from the first frame
            >
              <source src={post.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {!isMobile && !userClickedPlay && shouldAutoplay && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md cursor-pointer"
                onClick={handleVideoClick}
              >
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800 text-gray-400">
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center gap-2 transition-colors p-2 rounded-full hover:bg-gray-800 ${isLiked ? 'text-yellow-500' : 'hover:text-yellow-500 text-gray-400'}`}
            onClick={handleLike}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <span 
              className={`text-xl ${isAnimating ? 'animate-bounce' : ''}`} 
              role="img" 
              aria-label="laugh"
            >
              😂
            </span>
            <span className="font-medium">{localLikeCount}</span>
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
        
        <div className="flex items-center">
          {showDeleteButton && user && post.userId === user.id && (
            <button 
              className="hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-800 mr-2"
              onClick={handleDeletePost}
              aria-label="Delete post"
            >
              <Trash size={18} />
            </button>
          )}
          <button 
            className="hover:text-yellow-500 transition-colors p-2 rounded-full hover:bg-gray-800"
            aria-label="Share post"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
