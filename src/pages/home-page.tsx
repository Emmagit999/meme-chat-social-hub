
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { useData } from "@/context/data-context";
import { Plus, Filter } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";

const HomePage: React.FC = () => {
  const { posts, isLoading } = useData();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'meme' | 'roast' | 'joke'>('all');
  const isMobile = useIsMobile();
  
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeFilter);

  return (
    <div className="container py-6">
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
          <div className="animate-pulse-subtle text-lg">Loading...</div>
        </div>
      ) : filteredPosts.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      
      <CreatePostForm 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)} 
      />
      
      <Button
        className="fixed right-4 bottom-4 rounded-full w-14 h-14 bg-memeGreen hover:bg-memeGreen/90 shadow-lg md:hidden"
        onClick={() => setIsCreatePostOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default HomePage;
