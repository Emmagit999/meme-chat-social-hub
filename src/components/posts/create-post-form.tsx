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
import { uploadToStorage } from "@/utils/storage";

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'meme' | 'roast' | 'joke' | 'posts';
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ isOpen, onClose, defaultType = 'meme' }) => {
  const { user } = useAuth();
  const { addPost } = useData();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'meme' | 'roast' | 'joke' | 'posts'>(defaultType);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleImageSelect = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToStorage(file, "post_media", user?.id || '');
      if (url) {
        setMediaPreview(url);
        setMediaType('image');
        toast.success("Image uploaded!");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleVideoSelect = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToStorage(file, "post_media", user?.id || '');
      if (url) {
        setMediaPreview(url);
        setMediaType('video');
        toast.success("Video uploaded!");
      }
    } catch (error) {
      toast.error("Failed to upload video");
    }
    setUploading(false);
  };

  const handlePostSubmit = async () => {
    if (!user) return;
    
    if (!content.trim()) {
      toast.error("Your post can't be empty");
      return;
    }
    
    setPosting(true);
    toast.loading("Creating your post...", { id: "creating-post" });
    
    try {
      await addPost({
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        content,
        image: mediaType === 'image' ? mediaPreview : undefined,
        video: mediaType === 'video' ? mediaPreview : undefined,
        type: postType
      });
      
      toast.success("Post created successfully!", { id: "creating-post" });
      resetForm();
      onClose();
    } catch (error) {
      toast.error("Failed to create post", { id: "creating-post" });
    } finally {
      setPosting(false);
    }
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
            Share a meme, joke, roast, or regular post with the community
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] border-yellow-400"
          />
          <MediaUpload 
            onImageSelect={handleImageSelect} 
            onVideoSelect={handleVideoSelect} 
          />
          
          <Select 
            value={postType} 
            onValueChange={(value) => setPostType(value as 'meme' | 'roast' | 'joke' | 'posts')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meme">Meme</SelectItem>
              <SelectItem value="roast">Roast</SelectItem>
              <SelectItem value="joke">Joke</SelectItem>
              <SelectItem value="posts">Posts</SelectItem>
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
            disabled={posting || uploading}
            className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold disabled:opacity-50"
          >
            {posting ? "Posting..." : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
