
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/post-card";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { useData } from "@/context/data-context";
import { Plus } from "lucide-react";

const RoastPage: React.FC = () => {
  const { posts, isLoading } = useData();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  
  const roastPosts = posts.filter(post => post.type === 'roast' || post.type === 'joke');

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roast Zone</h1>
        <Button 
          onClick={() => setIsCreatePostOpen(true)} 
          className="bg-memeGreen hover:bg-memeGreen/90 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create Roast</span>
        </Button>
      </div>
      
      <p className="text-muted-foreground mb-6">
        This is the Roast Zone - where humor gets edgy. Share your funniest jokes and most savage roasts!
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-pulse-subtle text-lg">Loading...</div>
        </div>
      ) : roastPosts.length === 0 ? (
        <div className="text-center py-10">
          <h2 className="text-xl mb-2">No roasts or jokes yet</h2>
          <p className="text-muted-foreground mb-4">Be the first to post something funny!</p>
          <Button 
            onClick={() => setIsCreatePostOpen(true)} 
            className="bg-memeGreen hover:bg-memeGreen/90"
          >
            Create Roast
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {roastPosts.map(post => (
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

export default RoastPage;
