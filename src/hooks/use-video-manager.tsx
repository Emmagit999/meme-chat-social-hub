import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoManager {
  playingVideoId: string | null;
  playVideo: (videoId: string, videoElement: HTMLVideoElement) => void;
  pauseVideo: (videoId: string) => void;
  pauseAllVideos: () => void;
  isVideoPlaying: (videoId: string) => boolean;
}

export const useVideoManager = (): VideoManager => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const activeVideos = useRef<Map<string, HTMLVideoElement>>(new Map());

  const playVideo = useCallback((videoId: string, videoElement: HTMLVideoElement) => {
    // Pause any currently playing video
    if (playingVideoId && playingVideoId !== videoId) {
      const currentlyPlaying = activeVideos.current.get(playingVideoId);
      if (currentlyPlaying && !currentlyPlaying.paused) {
        currentlyPlaying.pause();
      }
    }

    // Register the video element
    activeVideos.current.set(videoId, videoElement);
    
    // Play the new video
    videoElement.play().catch(error => {
      console.log("Video play error:", error);
    });
    
    setPlayingVideoId(videoId);
  }, [playingVideoId]);

  const pauseVideo = useCallback((videoId: string) => {
    const videoElement = activeVideos.current.get(videoId);
    if (videoElement && !videoElement.paused) {
      videoElement.pause();
    }
    
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
    }
  }, [playingVideoId]);

  const pauseAllVideos = useCallback(() => {
    activeVideos.current.forEach((videoElement, videoId) => {
      if (!videoElement.paused) {
        videoElement.pause();
      }
    });
    setPlayingVideoId(null);
  }, []);

  const isVideoPlaying = useCallback((videoId: string) => {
    return playingVideoId === videoId;
  }, [playingVideoId]);

  // Clean up inactive video elements
  useEffect(() => {
    const cleanup = () => {
      const entries = Array.from(activeVideos.current.entries());
      entries.forEach(([videoId, videoElement]) => {
        if (!document.contains(videoElement)) {
          activeVideos.current.delete(videoId);
          if (playingVideoId === videoId) {
            setPlayingVideoId(null);
          }
        }
      });
    };

    const interval = setInterval(cleanup, 5000);
    return () => clearInterval(interval);
  }, [playingVideoId]);

  return {
    playingVideoId,
    playVideo,
    pauseVideo,
    pauseAllVideos,
    isVideoPlaying
  };
};