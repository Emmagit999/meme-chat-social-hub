import { useEffect, useState } from 'react';

interface ChatNotificationOptions {
  title?: string;
  originalTitle?: string;
  favicon?: string;
  interval?: number;
}

export const useChatNotifications = (options: ChatNotificationOptions = {}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [originalTitle] = useState(document.title);
  const [originalFavicon] = useState(document.querySelector('link[rel="icon"]')?.getAttribute('href') || '');

  const {
    title = '🔴 New Message!',
    originalTitle: customOriginalTitle = originalTitle,
    favicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔴</text></svg>',
    interval = 1000
  } = options;

  const startNotification = () => {
    setIsBlinking(true);
  };

  const stopNotification = () => {
    setIsBlinking(false);
    document.title = customOriginalTitle;
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (link) {
      link.href = originalFavicon;
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isBlinking) {
      intervalId = setInterval(() => {
        const currentTitle = document.title;
        const isShowingNotification = currentTitle === title;
        
        document.title = isShowingNotification ? customOriginalTitle : title;
        
        const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (link) {
          link.href = isShowingNotification ? originalFavicon : favicon;
        }
      }, interval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isBlinking, title, customOriginalTitle, favicon, interval, originalFavicon]);

  // Stop notification when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isBlinking) {
        stopNotification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isBlinking]);

  return {
    startNotification,
    stopNotification,
    isBlinking
  };
};