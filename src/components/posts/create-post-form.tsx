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
import { uploadToStorageWithProgress, validateFile, UploadProgress } from "@/utils/enhanced-storage";
import { MentionInput } from "./mention-input";
import { supabase } from '@/integrations/supabase/client';
import { UploadProgress as UploadProgressComponent } from "@/components/ui/upload-progress";
import { PostCategoryBadge } from "@/components/ui/post-category-badge";

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
  const [mentions, setMentions] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleImageSelect = async (file: File) => {
    const validationError = validateFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    
    try {
      const url = await uploadToStorageWithProgress(
        file, 
        "post_media", 
        user?.id || '',
        setUploadProgress
      );
      
      if (url) {
        setMediaPreview(url);
        setMediaType('image');
        toast.success("Image uploaded successfully! 🎉");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleVideoSelect = async (file: File) => {
    const validationError = validateFile(file, 'video');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSelectedFileName(file.name);
    setUploading(true);
    
    try {
      const url = await uploadToStorageWithProgress(
        file, 
        "post_media", 
        user?.id || '',
        setUploadProgress
      );
      
      if (url) {
        setMediaPreview(url);
        setMediaType('video');
        toast.success("Video uploaded successfully! 🎬");
      }
    } catch (error) {
      toast.error("Failed to upload video");
    }
    setUploading(false);
  };

  const sendMentionNotifications = async (mentionedUsernames: string[]) => {
    try {
      for (const username of mentionedUsernames) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', username)
          .single();

        if (profile) {
          await supabase
            .from('notifications')
            .insert({
              user_id: profile.id,
              from_user_id: user.id,
              type: 'mention',
              content: `${user.username} mentioned you in a post`,
              from_username: user.username,
              avatar: user.avatar
            });
        }
      }
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
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
      // Create the post
      await addPost({
        userId: user.id,
        username: user.username,
        userAvatar: user.avatar,
        content,
        image: mediaType === 'image' ? mediaPreview : undefined,
        video: mediaType === 'video' ? mediaPreview : undefined,
        type: postType
      });

      // Send mention notifications
      if (mentions.length > 0) {
        await sendMentionNotifications(mentions);
      }
      
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
    setMentions([]);
    setUploadProgress({ progress: 0, isUploading: false });
    setSelectedFileName('');
  };

  const handleContentChange = (newContent: string, newMentions: string[]) => {
    setContent(newContent);
    setMentions(newMentions);
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
          <MentionInput
            value={content}
            onChange={handleContentChange}
            placeholder="What's on your mind? Type @ to mention someone..."
            className="border-yellow-400"
          />
          <MediaUpload 
            onImageSelect={handleImageSelect} 
            onVideoSelect={handleVideoSelect} 
          />
          
          <div className="flex items-center gap-3">
            <Select 
              value={postType} 
              onValueChange={(value) => setPostType(value as 'meme' | 'roast' | 'joke' | 'posts')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meme">🎭 Meme</SelectItem>
                <SelectItem value="roast">🔥 Roast</SelectItem>
                <SelectItem value="joke">😂 Joke</SelectItem>
                <SelectItem value="posts">📝 Post</SelectItem>
              </SelectContent>
            </Select>
            <PostCategoryBadge type={postType} variant="gradient" />
          </div>
          
          {/* Upload Progress */}
          {uploadProgress.isUploading && (
            <UploadProgressComponent
              progress={uploadProgress.progress}
              isUploading={uploadProgress.isUploading}
              error={uploadProgress.error}
              fileName={selectedFileName}
              onCancel={() => {
                setUploading(false);
                setUploadProgress({ progress: 0, isUploading: false });
              }}
            />
          )}
          
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
