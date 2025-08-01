import { useState, useCallback } from 'react';

export const useDoubleTapLike = (onLike: () => void) => {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      e.preventDefault();
      e.stopPropagation();
      
      setShowHeart(true);
      onLike();
      
      setTimeout(() => setShowHeart(false), 1200);
    }
    
    setLastTap(now);
  }, [lastTap, onLike]);

  return {
    showHeart,
    handleDoubleTap
  };
};