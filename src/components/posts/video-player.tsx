import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useVideoManager } from '@/hooks/use-video-manager';

interface VideoPlayerProps {
  src: string;
  videoId: string;
  className?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  videoId, 
  className = '',
  autoPlay = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const { playVideo, pauseVideo, isVideoPlaying } = useVideoManager();

  // Handle intersection observer for auto-play
  useEffect(() => {
    if (!autoPlay || !videoRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          // Video is mostly visible, try to play
          if (videoRef.current && !isVideoPlaying(videoId)) {
            playVideo(videoId, videoRef.current);
            setIsPlaying(true);
          }
        } else {
          // Video is not visible, pause it
          if (videoRef.current && isVideoPlaying(videoId)) {
            pauseVideo(videoId);
            setIsPlaying(false);
          }
        }
      },
      {
        threshold: 0.5,
        rootMargin: '-10px'
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [autoPlay, videoId, playVideo, pauseVideo, isVideoPlaying]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleVideoClick = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      pauseVideo(videoId);
      setIsPlaying(false);
    } else {
      playVideo(videoId, videoRef.current);
      setIsPlaying(true);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video object-cover rounded-lg"
        muted
        loop
        playsInline
        preload="metadata"
        style={{ maxHeight: '400px' }}
      />
      
      {/* Play/Pause overlay */}
      {(!autoPlay || showControls) && (
        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-black/50 rounded-full p-3">
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white ml-1" />
            )}
          </div>
        </div>
      )}
      
      {/* Video duration indicator */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        Video
      </div>
    </div>
  );
};