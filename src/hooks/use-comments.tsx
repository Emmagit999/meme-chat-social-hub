
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

  const likeComment = async (commentId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a comment");
      return;
    }

    // Find the comment to like
    const commentToLike = comments.find(c => c.id === commentId);
    if (!commentToLike) return;

    try {
      // Optimistic update
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1 } 
            : comment
        )
      );

      // Update in database
      const { error } = await supabase
        .from('comments')
        .update({ likes: commentToLike.likes + 1 })
        .eq('id', commentId);

      if (error) throw error;

      // Add to comment_likes table
      await supabase
        .from('comment_likes')
        .insert({
          user_id: user.id,
          comment_id: commentId
        });
        
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error("Failed to like comment");
      
      // Revert optimistic update on error
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes - 1 } 
            : comment
        )
      );
    }
  };

  const addCommentReply = async (commentId: string, replyData: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to reply to a comment");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comment_replies')
        .insert({
          comment_id: commentId,
          user_id: replyData.userId,
          username: replyData.username,
          user_avatar: replyData.userAvatar,
          content: replyData.content
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newReply: CommentReply = {
          id: data.id,
          commentId: data.comment_id,
          userId: data.user_id,
          username: data.username,
          userAvatar: data.user_avatar,
          content: data.content,
          likes: 0,
          createdAt: new Date(data.created_at)
        };

        // Add reply to the correct comment
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        }));

        toast.success("Reply added!");
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error("Failed to add reply");
    }
  };

  const likeCommentReply = async (commentId: string, replyId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a reply");
      return;
    }

    // Find the comment and reply to like
    const commentWithReply = comments.find(c => c.id === commentId);
    if (!commentWithReply) return;
    
    const replyToLike = commentWithReply.replies?.find(r => r.id === replyId);
    if (!replyToLike) return;

    try {
      // Optimistic update
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies?.map(reply =>
                reply.id === replyId
                  ? { ...reply, likes: reply.likes + 1 }
                  : reply
              )
            };
          }
          return comment;
        })
      );

      // Update in database
      const { error } = await supabase
        .from('comment_replies')
        .update({ likes: replyToLike.likes + 1 })
        .eq('id', replyId);

      if (error) throw error;

      // Add to reply_likes table
      await supabase
        .from('reply_likes')
        .insert({
          user_id: user.id,
          reply_id: replyId
        });
        
    } catch (error) {
      console.error('Error liking reply:', error);
      toast.error("Failed to like reply");
      
      // Revert optimistic update on error
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies?.map(reply =>
                reply.id === replyId
                  ? { ...reply, likes: reply.likes - 1 }
                  : reply
              )
            };
          }
          return comment;
        })
      );
    }
  };

  return {
    comments,
    isLoading,
    addComment,
    likeComment,
    addCommentReply,
    likeCommentReply,
    getPostComments: (postId: string) => comments.filter(comment => comment.postId === postId)
  };
};
