
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadToStorage } from "@/utils/storage";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { ImageIcon, VideoIcon } from "lucide-react";

export const MediaUpload: React.FC<{
  onUploaded: (url: string, type: "image" | "video") => void;
}> = ({ onUploaded }) => {
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
  };

  const handleVideoSelect = () => {
    videoInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setLoading(true);
    const url = await uploadToStorage(e.target.files[0], "post_media", user.id);
    if (url) {
      onUploaded(url, "image");
      toast.success("Image uploaded!");
    } else {
      toast.error("Image upload failed!");
    }
    setLoading(false);
    e.target.value = "";
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setLoading(true);
    const url = await uploadToStorage(e.target.files[0], "post_media", user.id);
    if (url) {
      onUploaded(url, "video");
      toast.success("Video uploaded!");
    } else {
      toast.error("Video upload failed!");
    }
    setLoading(false);
    e.target.value = "";
  };

  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleImageSelect}
        disabled={loading}
        className="flex items-center gap-2 text-yellow-600 border-yellow-400"
      >
        <ImageIcon className="h-4 w-4" />
        Upload Image
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleVideoSelect}
        disabled={loading}
        className="flex items-center gap-2 text-yellow-600 border-yellow-400"
      >
        <VideoIcon className="h-4 w-4" />
        Upload Video
      </Button>
      <input
        ref={imageInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={loading}
      />
      <input
        ref={videoInputRef}
        className="hidden"
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        disabled={loading}
      />
      {loading && <span className="text-sm text-muted-foreground">Uploading...</span>}
    </div>
  );
};
