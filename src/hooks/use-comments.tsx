
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Comment, CommentReply } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            comment_replies(*)
          `);

        if (error) throw error;

        setComments(data?.map(comment => ({
          id: comment.id,
          postId: comment.post_id,
          userId: comment.user_id,
          username: comment.username,
          userAvatar: comment.user_avatar,
          content: comment.content,
          likes: comment.likes,
          createdAt: new Date(comment.created_at),
          replies: comment.comment_replies?.map((reply: any) => ({
            id: reply.id,
            commentId: reply.comment_id,
            userId: reply.user_id,
            username: reply.username,
            userAvatar: reply.user_avatar,
            content: reply.content,
            likes: reply.likes,
            createdAt: new Date(reply.created_at)
          })) || []
        })) || []);
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, []);

  const addComment = async (commentData: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: commentData.postId,
          user_id: commentData.userId,
          username: commentData.username,
          user_avatar: commentData.userAvatar,
          content: commentData.content
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newComment: Comment = {
          id: data.id,
          postId: data.post_id,
          userId: data.user_id,
          username: data.username,
          userAvatar: data.user_avatar,
          content: data.content,
          likes: 0,
          createdAt: new Date(data.created_at),
          replies: []
        };

        setComments(prev => [...prev, newComment]);
        toast.success("Comment added!");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Failed to add comment");
    }
  };

  return {
    comments,
    isLoading,
    addComment,
    getPostComments: (postId: string) => comments.filter(comment => comment.postId === postId)
  };
};
