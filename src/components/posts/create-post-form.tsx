import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { ImageIcon, FilmIcon, X } from "lucide-react";
import { toast } from "sonner";
import { MediaUpload } from "./media-upload";

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'meme' | 'roast' | 'joke';
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ isOpen, onClose, defaultType = 'meme' }) => {
  const { user } = useAuth();
  const { addPost } = useData();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'meme' | 'roast' | 'joke'>(defaultType);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleMediaUploaded = (url: string, type: "image" | "video") => {
    setMediaPreview(url);
    setMediaType(type);
  };

  const handlePostSubmit = () => {
    if (!user) return;
    
    if (!content.trim()) {
      toast.error("Your post can't be empty");
      return;
    }
    
    addPost({
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      content,
      image: mediaType === 'image' ? mediaPreview : undefined,
      video: mediaType === 'video' ? mediaPreview : undefined,
      type: postType
    });
    
    resetForm();
    onClose();
  };
  
  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
  };
  
  const resetForm = () => {
    setContent('');
    setPostType(defaultType || 'meme');
    setMediaPreview(null);
    setMediaType(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white border-yellow-400">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">Create a Post</DialogTitle>
          <DialogDescription>
            Share a meme, joke, or roast with the community
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] border-yellow-400"
          />
          <MediaUpload onUploaded={handleMediaUploaded} />
          
          <Select 
            value={postType} 
            onValueChange={(value) => setPostType(value as 'meme' | 'roast' | 'joke')}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meme">Meme</SelectItem>
              <SelectItem value="roast">Roast</SelectItem>
              <SelectItem value="joke">Joke</SelectItem>
            </SelectContent>
          </Select>
          
          {mediaPreview && (
            <div className="relative rounded-md overflow-hidden border border-yellow-400">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-[200px] object-cover" 
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full h-auto max-h-[200px]" 
                />
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handlePostSubmit}
            className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold"
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
