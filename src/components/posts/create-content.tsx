import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Camera, Video } from "lucide-react";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { CreateStatusForm } from "@/components/posts/create-status-form";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CreateContent: React.FC = () => {
  const [showPostForm, setShowPostForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [postType, setPostType] = useState<'meme' | 'roast' | 'joke' | 'posts'>('meme');

  const handleCreatePost = (type: 'meme' | 'roast' | 'joke' | 'posts') => {
    setPostType(type);
    setShowPostForm(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleCreatePost('meme')}>
            <Camera className="h-4 w-4 mr-2" />
            Create Meme
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCreatePost('roast')}>
            <Video className="h-4 w-4 mr-2" />
            Create Roast
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCreatePost('joke')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Joke
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCreatePost('posts')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowStatusForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Status
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePostForm 
        isOpen={showPostForm}
        onClose={() => setShowPostForm(false)}
        defaultType={postType}
      />

      <CreateStatusForm 
        isOpen={showStatusForm}
        onClose={() => setShowStatusForm(false)}
      />
    </>
  );
};