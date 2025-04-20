
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadToStorage } from "@/utils/storage";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export const MediaUpload: React.FC<{
  onUploaded: (url: string, type: "image" | "video") => void;
}> = ({ onUploaded }) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"image" | "video" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (type: "image" | "video") => {
    setUploadType(type);
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !uploadType || !e.target.files?.[0]) return;
    setLoading(true);
    const url = await uploadToStorage(e.target.files[0], "post_media", user.id);
    if (url) {
      onUploaded(url, uploadType);
      toast.success(`${uploadType === "image" ? "Image" : "Video"} uploaded!`);
    } else {
      toast.error("Upload failed!");
    }
    setLoading(false);
    setUploadType(null);
    e.target.value = "";
  };

  return (
    <div className="flex gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleSelect("image")}
        className="flex items-center gap-2 text-yellow-600 border-yellow-400"
      >
        Upload Image
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleSelect("video")}
        className="flex items-center gap-2 text-yellow-600 border-yellow-400"
      >
        Upload Video
      </Button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept={uploadType === "image" ? "image/*" : "video/*"}
        onChange={handleChange}
        disabled={loading}
      />
    </div>
  );
};
