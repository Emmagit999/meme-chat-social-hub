
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { uploadToStorage } from "@/utils/storage";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export const AvatarUpload: React.FC<{
  onUpload: (url: string) => void;
  currentAvatar?: string;
}> = ({ onUpload, currentAvatar }) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setLoading(true);
    const url = await uploadToStorage(e.target.files[0], "avatars", user.id);
    if (url) {
      onUpload(url);
      toast.success("Profile picture updated!");
    } else {
      toast.error("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border-2 border-yellow-400 shadow-gold">
        <AvatarImage src={currentAvatar} alt="" />
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      <Button
        className="bg-yellow-400 text-black font-bold"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Change Avatar"}
      </Button>
    </div>
  );
};
