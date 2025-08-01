
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { CreateContent } from "@/components/posts/create-content";
import { useData } from "@/context/data-context";
import { Plus, RefreshCcw } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const HomePage: React.FC = () => {
  const { posts, isLoading, refreshData } = useData();
  const [activeFilter, setActiveFilter] = useState<'all' | 'meme' | 'roast' | 'joke' | 'posts'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState(false);
  const isMobile = useIsMobile();
  const { requestPermission } = usePushNotifications();
  
  // Request notification permissions when the component mounts
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Silent background connection check - no visible refresh or UI updates
  useEffect(() => {
    // Check initial connection state
    setConnectionIssue(!navigator.onLine);
    
    // Only update connection status, not UI
    const handleOnline = () => {
      if (connectionIssue) {
        setConnectionIssue(false);
        // No auto-refresh - let Supabase real-time handle updates
      }
    };
    
    const handleOffline = () => {
      setConnectionIssue(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Remove periodic connection checks to avoid unwanted refreshes
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectionIssue]);

  // Remove smart background refresh to prevent unwanted UI refreshes
  // Rely on Supabase real-time updates instead
  
  // Manual refresh function - only used when user explicitly clicks refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 800);
  };
  
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeFilter);

  // Mix posts with images and videos for desktop
  const organizedPosts = filteredPosts;

  return (
    <div className="container py-16 pb-24 md:pb-16">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Home Feed</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${connectionIssue ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh posts"
          >
            <RefreshCcw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <ToggleGroup type="single" value={activeFilter} onValueChange={(value) => value && setActiveFilter(value as any)}>
            <ToggleGroupItem value="all" aria-label="Show all posts">All</ToggleGroupItem>
            <ToggleGroupItem value="meme" aria-label="Filter by memes">Memes</ToggleGroupItem>
            <ToggleGroupItem value="roast" aria-label="Filter by roasts">Roasts</ToggleGroupItem>
            <ToggleGroupItem value="joke" aria-label="Filter by jokes">Jokes</ToggleGroupItem>
            <ToggleGroupItem value="posts" aria-label="Filter by posts">Posts</ToggleGroupItem>
          </ToggleGroup>
          
          <CreateContent />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse text-lg">Loading posts...</div>
        </div>
      ) : organizedPosts.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">No posts yet</h2>
          <p className="text-muted-foreground mb-4">Be the first to post!</p>
          <CreateContent />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {organizedPosts.map(post => (
            <div key={post.id} className="flex flex-col">
              <PostCard post={post} className="h-full" />
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
};

export default HomePage;
