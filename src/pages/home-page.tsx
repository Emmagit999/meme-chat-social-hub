import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { useData } from "@/context/data-context";
import { Plus, Filter } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const HomePage: React.FC = () => {
  const { posts, isLoading } = useData();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'meme' | 'roast' | 'joke'>('all');
  const isMobile = useIsMobile();
  const { requestPermission } = usePushNotifications();
  
  // Request notification permissions when the component mounts
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);
  
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeFilter);

  // Make sure only one video can play at a time
  // First video gets to keep its video, all others get video property removed
  const postsWithLimitedVideos = filteredPosts.map((post, index) => {
    // Find the first post with a video
    const firstVideoIndex = filteredPosts.findIndex(p => p.video);
    
    // If this post has a video and it's not the first video, remove the video
    if (post.video && index !== firstVideoIndex && firstVideoIndex !== -1) {
      return { ...post, video: undefined };
    }
    return post;
  });

  return (
    <div className="container py-16 pb-24 md:pb-16">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Home Feed</h1>
        
        <div className="flex items-center gap-4 flex-wrap">
          <ToggleGroup type="single" value={activeFilter} onValueChange={(value) => value && setActiveFilter(value as any)}>
            <ToggleGroupItem value="all" aria-label="Show all posts">All</ToggleGroupItem>
            <ToggleGroupItem value="meme" aria-label="Filter by memes">Memes</ToggleGroupItem>
            <ToggleGroupItem value="roast" aria-label="Filter by roasts">Roasts</ToggleGroupItem>
            <ToggleGroupItem value="joke" aria-label="Filter by jokes">Jokes</ToggleGroupItem>
          </ToggleGroup>
          
          <Button 
            onClick={() => setIsCreatePostOpen(true)} 
            className="bg-memeGreen hover:bg-memeGreen/90 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Post</span>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-lg">Loading posts...</div>
        </div>
      ) : postsWithLimitedVideos.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">No posts yet</h2>
          <p className="text-muted-foreground mb-4">Be the first to post!</p>
          <Button 
            onClick={() => setIsCreatePostOpen(true)} 
            className="bg-memeGreen hover:bg-memeGreen/90"
          >
            Create Post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {postsWithLimitedVideos.map(post => (
            <div key={post.id} className="flex flex-col h-full max-h-[600px] md:max-h-[500px]">
              <PostCard post={post} className="h-full" />
            </div>
          ))}
        </div>
      )}
      
      <CreatePostForm 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
      />
      
      <Button
        className="fixed right-4 bottom-20 md:bottom-4 rounded-full w-14 h-14 bg-memeGreen hover:bg-memeGreen/90 shadow-lg md:hidden"
        onClick={() => setIsCreatePostOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default HomePage;
