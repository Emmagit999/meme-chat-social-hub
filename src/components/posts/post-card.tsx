import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';

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
}

export const PostCard: React.FC<PostCardProps> = ({ post, className }) => {
  return (
    <div className={cn("bg-black border border-gray-800 rounded-lg overflow-hidden", className)}>
      <div className="p-4">
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
          
          {/* Post type tag */}
          <div className={`text-xs px-2 py-1 rounded-full ${
            post.type === 'meme' 
              ? 'bg-blue-500/20 text-blue-400' 
              : post.type === 'roast' 
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-green-500/20 text-green-400'
          }`}>
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </div>
        </div>
        
        {/* Post content */}
        <p className="text-white mb-4">{post.content}</p>
        
        {post.image && (
          <img src={post.image} alt="Post Image" className="w-full rounded-md mb-4" />
        )}
        
        {post.video && (
          <video controls className="w-full rounded-md mb-4">
            <source src={post.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      
      {/* Post actions */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800 text-gray-400">
        <div className="flex items-center gap-4">
          <button className="hover:text-yellow-500 transition-colors">
            <span className="font-medium">{post.likes} Likes</span>
          </button>
          <button className="hover:text-yellow-500 transition-colors">
            <span className="font-medium">{post.comments} Comments</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Add share and report buttons here */}
        </div>
      </div>
    </div>
  );
};
