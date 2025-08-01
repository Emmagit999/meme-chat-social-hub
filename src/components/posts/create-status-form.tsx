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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { ImageIcon, FilmIcon, X } from "lucide-react";
import { toast } from "sonner";
import { MediaUpload } from "./media-upload";
import { uploadToStorage } from "@/utils/storage";
import { supabase } from '@/integrations/supabase/client';

interface CreateStatusFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStatusForm: React.FC<CreateStatusFormProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
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

  const handleStatusSubmit = async () => {
    if (!user) return;
    
    if (!mediaPreview && !content.trim()) {
      toast.error("Status needs either text or media");
      return;
    }
    
    setPosting(true);
    toast.loading("Creating your status...", { id: "creating-status" });
    
    try {
      // Calculate expiry time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('status' as any)
        .insert({
          user_id: user.id,
          content: content.trim() || null,
          media_url: mediaPreview,
          media_type: mediaType,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success("Status created successfully!", { id: "creating-status" });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating status:', error);
      toast.error("Failed to create status", { id: "creating-status" });
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
    setMediaPreview(null);
    setMediaType(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Create Status</DialogTitle>
          <DialogDescription>
            Share a moment that will disappear in 24 hours
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Share what's happening..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] border-border"
          />
          
          <MediaUpload 
            onImageSelect={handleImageSelect} 
            onVideoSelect={handleVideoSelect} 
          />
          
          {mediaPreview && (
            <div className="relative rounded-md overflow-hidden border border-border">
              <Button 
                type="button" 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 z-10"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Status preview" 
                  className="w-full h-auto max-h-[300px] object-contain" 
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  controls 
                  className="w-full h-auto max-h-[300px] object-contain" 
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
            onClick={handleStatusSubmit}
            disabled={posting || uploading || (!content.trim() && !mediaPreview)}
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold disabled:opacity-50"
          >
            {posting ? "Posting..." : "Share Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};