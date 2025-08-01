import { useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OptimisticLike {
  postId: string;
  isLiked: boolean;
  likeCount: number;
}

export const useOptimisticLikes = () => {
  const { user } = useAuth();
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, OptimisticLike>>({});

  const toggleLike = useCallback(async (postId: string, currentLikeCount: number, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast.error("You must be logged in to like a post");
      return;
    }

    const newIsLiked = !isCurrentlyLiked;
    const newLikeCount = newIsLiked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1);

    // Optimistic update
    setOptimisticLikes(prev => ({
      ...prev,
      [postId]: {
        postId,
        isLiked: newIsLiked,
        likeCount: newLikeCount
      }
    }));

    try {
      if (newIsLiked) {
        // Add like
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (insertError) throw insertError;
      } else {
        // Remove like
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (deleteError) throw deleteError;
      }

      // Get accurate count and update posts table
      const { data: likesData, error: countError } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId);

      if (countError) throw countError;

      const actualLikeCount = likesData?.length || 0;
      
      // Update posts table with accurate count
      const { error: updateError } = await supabase
        .from('posts')
        .update({ likes: actualLikeCount })
        .eq('id', postId);

      if (updateError) throw updateError;

      // Update optimistic state with accurate count
      setOptimisticLikes(prev => ({
        ...prev,
        [postId]: {
          postId,
          isLiked: newIsLiked,
          likeCount: actualLikeCount
        }
      }));

    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
      
      // Rollback optimistic update
      setOptimisticLikes(prev => ({
        ...prev,
        [postId]: {
          postId,
          isLiked: isCurrentlyLiked,
          likeCount: currentLikeCount
        }
      }));
    }
  }, [user]);

  const getLikeState = useCallback((postId: string, defaultLikeCount: number, defaultIsLiked: boolean) => {
    const optimistic = optimisticLikes[postId];
    if (optimistic) {
      return {
        likeCount: optimistic.likeCount,
        isLiked: optimistic.isLiked
      };
    }
    return {
      likeCount: defaultLikeCount,
      isLiked: defaultIsLiked
    };
  }, [optimisticLikes]);

  const clearOptimisticState = useCallback((postId: string) => {
    setOptimisticLikes(prev => {
      const newState = { ...prev };
      delete newState[postId];
      return newState;
    });
  }, []);

  return {
    toggleLike,
    getLikeState,
    clearOptimisticState
  };
};