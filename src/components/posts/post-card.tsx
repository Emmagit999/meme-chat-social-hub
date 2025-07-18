
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
import { useVideoManager } from "@/hooks/use-video-manager";
import { ShareDialog } from "@/components/posts/share-dialog";
import { VideoPlayer } from "./video-player";

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
  const { playVideo, pauseVideo, isVideoPlaying } = useVideoManager();
  const [isLiked, setIsLiked] = useState(() => isPostLiked(post.id));
  const [isAnimating, setIsAnimating] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes);
  const [userClickedPlay, setUserClickedPlay] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

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
    if (videoRef.current) {
      if (videoRef.current.paused || !isVideoPlaying(post.id)) {
        playVideo(post.id, videoRef.current);
        setUserClickedPlay(true);
      } else {
        pauseVideo(post.id);
        setUserClickedPlay(false);
      }
    }
  };

  const handleShareClick = () => {
    setShareDialogOpen(true);
  };

  // Improved video handling with global video manager
  useEffect(() => {
    if (!videoRef.current || !post.video) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Only autoplay on mobile after user interaction
            if (isMobile && userClickedPlay) {
              if (videoRef.current) {
                playVideo(post.id, videoRef.current);
              }
            }
          } else {
            // Pause when not in view
            if (isVideoPlaying(post.id)) {
              pauseVideo(post.id);
            }
          }
        });
      },
      { threshold: 0.6 }
    );
    
    observer.observe(videoRef.current);
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [post.video, isMobile, userClickedPlay, playVideo, pauseVideo, isVideoPlaying, post.id]);

  // Ensure proper media sizing and layout
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
          
          <Badge className={`${getPostTypeBadgeStyles()}`} variant="outline">
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </Badge>
        </div>
        
        {/* Post content */}
        <p className="text-white mb-4">{post.content}</p>
        
        {/* Improved media layout with consistent sizing */}
        <div className="media-container relative mb-4">
          {post.image && (
            <div className="flex justify-center">
              <img 
                src={post.image} 
                alt="Post" 
                className="rounded-md object-contain max-h-[400px] w-auto mx-auto"
              />
            </div>
          )}
          
          {post.video && (
            <VideoPlayer 
              src={post.video}
              videoId={post.id}
              className="rounded-md w-auto mx-auto max-h-[400px]"
              autoPlay={true}
            />
          )}
        </div>
      </div>
      
      {/* Post actions - improved visibility */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800 text-gray-400 bg-black">
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
            onClick={handleShareClick}
            aria-label="Share post"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <ShareDialog
        isOpen={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        postId={post.id}
        username={post.username}
        content={post.content}
      />
    </div>
  );
};
