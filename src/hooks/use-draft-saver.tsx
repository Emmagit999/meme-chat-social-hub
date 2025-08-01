import { useEffect, useCallback } from 'react';

interface DraftData {
  content: string;
  timestamp: number;
  type?: string;
}

export const useDraftSaver = (content: string, type: string = 'post') => {
  const draftKey = `draft-${type}`;

  // Save draft automatically
  useEffect(() => {
    const saveDraft = setTimeout(() => {
      if (content.trim()) {
        const draftData: DraftData = {
          content,
          timestamp: Date.now(),
          type
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      }
    }, 2000); // Save after 2 seconds of no typing

    return () => clearTimeout(saveDraft);
  }, [content, draftKey, type]);

  // Load saved draft
  const loadDraft = useCallback((): string => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draftData: DraftData = JSON.parse(saved);
        // Only load drafts from the last 24 hours
        if (Date.now() - draftData.timestamp < 24 * 60 * 60 * 1000) {
          return draftData.content;
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return '';
  }, [draftKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
  }, [draftKey]);

  return {
    loadDraft,
    clearDraft
  };
};