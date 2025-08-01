import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent,
} from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { format } from 'date-fns';
import { Status } from '@/types';

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: Status[];
  initialIndex?: number;
  userName: string;
  userAvatar: string;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  isOpen,
  onClose,
  statuses,
  initialIndex = 0,
  userName,
  userAvatar
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const currentStatus = statuses[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds for images
  
  useEffect(() => {
    if (!isOpen || isPaused || (currentStatus?.media_type === 'video' && !isVideoPlaying)) {
      return;
    }

    const duration = currentStatus?.media_type === 'video' ? 15000 : STORY_DURATION;
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        if (newProgress >= 100) {
          nextStatus();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, isPaused, isVideoPlaying, currentStatus]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  const nextStatus = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevStatus = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleVideoToggle = () => {
    setIsVideoPlaying(!isVideoPlaying);
  };

  if (!currentStatus) return null;

  const timeAgo = format(new Date(currentStatus.created_at), 'h:mm a');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full h-full md:max-w-lg md:h-auto md:max-h-[90vh] p-0 bg-black border-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
            {statuses.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: index < currentIndex ? '100%' : 
                           index === currentIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <img
                src={userAvatar}
                alt={userName}
                className="w-8 h-8 rounded-full border-2 border-white"
              />
              <div>
                <p className="text-white font-medium text-sm">{userName}</p>
                <p className="text-white/70 text-xs">{timeAgo}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 relative flex items-center justify-center"
            onClick={() => setIsPaused(!isPaused)}
          >
            {currentStatus.media_url ? (
              currentStatus.media_type === 'image' ? (
                <img
                  src={currentStatus.media_url}
                  alt="Status"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    src={currentStatus.media_url}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-0 w-full h-full bg-transparent hover:bg-black/20"
                    onClick={handleVideoToggle}
                  >
                    {isVideoPlaying ? (
                      <Pause className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    ) : (
                      <Play className="h-12 w-12 text-white" />
                    )}
                  </Button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary/80 to-primary">
                <p className="text-white text-xl font-medium text-center p-8">
                  {currentStatus.content}
                </p>
              </div>
            )}

            {/* Content text overlay */}
            {currentStatus.content && currentStatus.media_url && (
              <div className="absolute bottom-20 left-4 right-4">
                <p className="text-white text-center font-medium bg-black/50 p-3 rounded-lg">
                  {currentStatus.content}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="absolute inset-0 flex">
            <button
              className="flex-1 bg-transparent"
              onClick={prevStatus}
              disabled={currentIndex === 0}
            />
            <button
              className="flex-1 bg-transparent"
              onClick={nextStatus}
              disabled={currentIndex === statuses.length - 1}
            />
          </div>

          {/* Navigation arrows (desktop) */}
          <div className="hidden md:block">
            {currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                onClick={prevStatus}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            {currentIndex < statuses.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                onClick={nextStatus}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white/20 rounded-full p-4">
                <Pause className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};