import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, Video, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { CameraCapture } from '@/components/media/camera-capture';

interface MediaUploadProps {
  onImageSelect: (file: File) => void;
  onVideoSelect: (file: File) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onImageSelect, onVideoSelect }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Image file is too large. Please select an image under 10MB.');
        return;
      }
      onImageSelect(file);
    }
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('Video file is too large. Please select a video under 50MB.');
        return;
      }
      onVideoSelect(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    if (file.type.startsWith('image/')) {
      onImageSelect(file);
    } else if (file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
    setShowCamera(false);
  };

  const openCamera = (mode: 'photo' | 'video') => {
    setCameraMode(mode);
    setShowCamera(true);
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          Photo
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => videoInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Video
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openCamera('photo')}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openCamera('video')}
          className="flex items-center gap-2"
        >
          <Video className="h-4 w-4" />
          Record
        </Button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          className="hidden"
        />
      </div>

      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        mode={cameraMode}
      />
    </>
  );
};