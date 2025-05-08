
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { useData } from "@/context/data-context";
import { Plus, RefreshCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const HomePage: React.FC = () => {
  const { posts, isLoading, refreshData } = useData();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'meme' | 'roast' | 'joke'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const isMobile = useIsMobile();
  const { requestPermission } = usePushNotifications();
  
  // Request notification permissions when the component mounts
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionIssue(false);
      // When connection comes back, do a silent refresh
      refreshData();
    };
    
    const handleOffline = () => {
      setConnectionIssue(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial connection state
    setConnectionIssue(!navigator.onLine);
    
    // Periodic check for unstable connections
    const connectionCheck = setInterval(() => {
      if (navigator.onLine) {
        // Check if we can reach the server
        fetch('/api/ping')
          .then(() => setConnectionIssue(false))
          .catch(() => setConnectionIssue(true));
      } else {
        setConnectionIssue(true);
      }
    }, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectionCheck);
    };
  }, [refreshData]);

  // Intelligent refresh - only refresh when the tab becomes visible after being hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && document.hidden === false) {
        // User has come back to the tab - do a silent refresh
        refreshData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeFilter);

  // We're not limiting videos anymore, all videos will be playable when in view
  const postsWithVideos = filteredPosts;

  return (
    <div className="container py-16 pb-24 md:pb-16">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Home Feed</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${connectionIssue ? 'text-red-500' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing || isAutoRefreshing}
          >
            <RefreshCcw className={`h-5 w-5 ${isRefreshing || isAutoRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          {connectionIssue && (
            <span className="text-xs text-red-500">Connection issues detected</span>
          )}
        </div>
        
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
      ) : postsWithVideos.length === 0 ? (
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
          {postsWithVideos.map(post => (
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
