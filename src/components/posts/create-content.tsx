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
        <DropdownMenuContent align="end" className="w-56 p-2">
          <DropdownMenuItem 
            onClick={() => handleCreatePost('meme')}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">Create Meme</div>
              <div className="text-xs text-muted-foreground">Share funny content</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleCreatePost('roast')}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">Create Roast</div>
              <div className="text-xs text-muted-foreground">Friendly burns</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleCreatePost('joke')}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">Create Joke</div>
              <div className="text-xs text-muted-foreground">Share humor</div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleCreatePost('posts')}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-slate-500 flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">Create Post</div>
              <div className="text-xs text-muted-foreground">General content</div>
            </div>
          </DropdownMenuItem>
          
          <div className="border-t border-border my-2"></div>
          
          <DropdownMenuItem 
            onClick={() => setShowStatusForm(true)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-medium">Create Status</div>
              <div className="text-xs text-muted-foreground">24h story</div>
            </div>
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