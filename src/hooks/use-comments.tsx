import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Comment, CommentReply } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Function to load comments from database
  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*, comment_replies(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedComments: Comment[] = data.map(comment => {
          const replies = comment.comment_replies ? comment.comment_replies.map((reply: any) => ({
            id: reply.id,
            commentId: reply.comment_id,
            userId: reply.user_id,
            username: reply.username,
            userAvatar: reply.user_avatar,
            content: reply.content,
            likes: reply.likes || 0,
            createdAt: new Date(reply.created_at)
          })) : [];

          return {
            id: comment.id,
            postId: comment.post_id,
            userId: comment.user_id,
            username: comment.username,
            userAvatar: comment.user_avatar,
            content: comment.content,
            likes: comment.likes || 0,
            replies: replies,
            createdAt: new Date(comment.created_at)
          };
        });

        setComments(formattedComments);
        return formattedComments;
      }
      return null;
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Public function to refresh comments
  const refreshComments = useCallback(async () => {
    return await loadComments();
  }, [loadComments]);

  useEffect(() => {
    loadComments();
    
    // Set up real-time listeners for comments and replies
    const commentsChannel = supabase
      .channel('comments-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          // Refresh comments when there are changes
          loadComments();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comment_replies' },
        () => {
          // Refresh comments when there are changes to replies
          loadComments();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [loadComments]);

  const addComment = useCallback(async (comment: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: comment.userId,
          post_id: comment.postId,
          username: comment.username,
          user_avatar: comment.userAvatar,
          content: comment.content
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
          replies: [],
          createdAt: new Date(data.created_at)
        };

        setComments(prev => [newComment, ...prev]);
        
        // Update the post's comment count properly
        const { data: currentPost, error: fetchError } = await supabase
          .from('posts')
          .select('comments')
          .eq('id', comment.postId)
          .single();
          
        if (!fetchError && currentPost) {
          const newCount = (currentPost.comments || 0) + 1;
          
          const { error: updateError } = await supabase
            .from('posts')
            .update({ comments: newCount })
            .eq('id', comment.postId);
            
          if (updateError) {
            console.error('Error updating post comment count:', updateError);
          }
        }
        
        toast.success("Comment added!");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  }, [user]);

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a comment");
      return;
    }

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
        .update({ likes: comments.find(c => c.id === commentId)?.likes + 1 })
        .eq('id', commentId);

      if (error) throw error;

      // Record the like
      await supabase
        .from('comment_likes')
        .insert({
          user_id: user.id,
          comment_id: commentId
        });
    } catch (error) {
      // Revert optimistic update on error
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes - 1 } 
            : comment
        )
      );
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  }, [user, comments]);

  const addCommentReply = useCallback(async (commentId: string, reply: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comment_replies')
        .insert({
          comment_id: commentId,
          user_id: reply.userId,
          username: reply.username,
          user_avatar: reply.userAvatar,
          content: reply.content
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

        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          )
        );
        
        // Update post comment count for replies too
        const parentComment = comments.find(c => c.id === commentId);
        if (parentComment) {
          const { data: currentPost, error: fetchError } = await supabase
            .from('posts')
            .select('comments')
            .eq('id', parentComment.postId)
            .single();
            
          if (!fetchError && currentPost) {
            const newCount = (currentPost.comments || 0) + 1;
            
            await supabase
              .from('posts')
              .update({ comments: newCount })
              .eq('id', parentComment.postId);
          }
        }
        
        toast.success("Reply added!");
      }
    } catch (error) {
      console.error('Error adding comment reply:', error);
      toast.error('Failed to add reply');
    }
  }, [user]);

  const likeCommentReply = useCallback(async (commentId: string, replyId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a reply");
      return;
    }

    try {
      // Find the comment and reply
      const comment = comments.find(c => c.id === commentId);
      const reply = comment?.replies.find(r => r.id === replyId);
      
      if (!comment || !reply) return;

      // Optimistic update
      setComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? {
                ...c,
                replies: c.replies.map(r => 
                  r.id === replyId 
                    ? { ...r, likes: r.likes + 1 } 
                    : r
                )
              } 
            : c
        )
      );

      // Update in database
      const { error } = await supabase
        .from('comment_replies')
        .update({ likes: reply.likes + 1 })
        .eq('id', replyId);

      if (error) throw error;

      // Record the like
      await supabase
        .from('reply_likes')
        .insert({
          user_id: user.id,
          reply_id: replyId
        });
    } catch (error) {
      // Revert optimistic update on error
      setComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? {
                ...c,
                replies: c.replies.map(r => 
                  r.id === replyId 
                    ? { ...r, likes: r.likes - 1 } 
                    : r
                )
              } 
            : c
        )
      );
      console.error('Error liking reply:', error);
      toast.error('Failed to like reply');
    }
  }, [user, comments]);

  const getPostComments = useCallback((postId: string): Comment[] => {
    return comments.filter(comment => comment.postId === postId);
  }, [comments]);

  return {
    comments,
    isLoading,
    addComment,
    likeComment,
    addCommentReply,
    likeCommentReply,
    getPostComments,
    refreshComments
  };
};
