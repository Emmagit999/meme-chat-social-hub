
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

interface CreatePostFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addPost } = useData();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'meme' | 'roast' | 'joke'>('meme');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  
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
  
  const handleImageUpload = () => {
    // Mock image upload - in a real app, you'd handle file selection and uploading
    const imageUrl = "https://placehold.co/600x400/121212/00C853?text=Mock+Image";
    setMediaPreview(imageUrl);
    setMediaType('image');
    toast.success("Image uploaded");
  };
  
  const handleVideoUpload = () => {
    // Mock video upload
    const videoUrl = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
    setMediaPreview(videoUrl);
    setMediaType('video');
    toast.success("Video uploaded");
  };
  
  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
  };
  
  const resetForm = () => {
    setContent('');
    setPostType('meme');
    setMediaPreview(null);
    setMediaType(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
          <DialogDescription>
            Share a meme, joke, or roast with the community
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
          
          <div className="flex items-center gap-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleImageUpload}
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Image</span>
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleVideoUpload}
              className="flex items-center gap-2"
            >
              <FilmIcon className="h-4 w-4" />
              <span>Video</span>
            </Button>
            
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
          </div>
          
          {mediaPreview && (
            <div className="relative rounded-md overflow-hidden border border-border">
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
            className="bg-memeGreen hover:bg-memeGreen/90"
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
