
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Post, Comment, CommentReply } from '@/types';
import { usePosts } from '@/hooks/use-posts';
import { useComments } from '@/hooks/use-comments';
import { useRealTimeSync } from '@/hooks/use-real-time-sync';
import { useRealTimePosts } from '@/hooks/use-real-time-posts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DataContextType = {
  posts: Post[];
  comments: Comment[];
  isLoading: boolean;
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => void;
  likeComment: (commentId: string) => void;
  addCommentReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => void;
  likeCommentReply: (commentId: string, replyId: string) => void;
  getPostComments: (postId: string) => Comment[];
  getUserPosts: (userId: string) => Post[];
  isPostLiked: (postId: string) => boolean;
  likedPosts: string[];
  refreshData: () => void;
  lastRefresh: Date;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    posts, 
    isLoading: postsLoading, 
    addPost,
    deletePost,
    likePost, 
    getUserPosts, 
    isPostLiked, 
    likedPosts,
    refreshPosts
  } = usePosts();
  
  const { 
    comments, 
    isLoading: commentsLoading, 
    addComment, 
    likeComment,
    addCommentReply,
    likeCommentReply,
    getPostComments,
    refreshComments
  } = useComments();

  // Enable real-time sync
  useRealTimeSync();
  useRealTimePosts();

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to manually refresh data - only called when explicitly requested
  const refreshData = () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    
    Promise.all([
      refreshPosts(),
      refreshComments()
    ])
      .then(() => {
        setLastRefresh(new Date());
        // No toast notification to avoid UI interruptions
      })
      .catch((error) => {
        console.error("Refresh error:", error);
        // Only show error notification if there's a critical issue
        if (navigator.onLine) {
          toast.error('Connection issue detected', {
            duration: 10000
          });
        }
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  // Set up real-time listeners for updates - never refresh the full UI
  useEffect(() => {
    // Configure Supabase real-time listeners for passive updates
    
    // Listen for changes in posts table
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Posts change detected:', payload);
          // Silently update data in the background without UI refresh
          refreshPosts();
        }
      )
      .subscribe();

    // Listen for changes in comments table
    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          console.log('Comments change detected:', payload);
          // Silently update data in the background without UI refresh
          refreshComments();
        }
      )
      .subscribe();

    // Listen for changes in comment_replies table
    const repliesChannel = supabase
      .channel('public:replies')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comment_replies' },
        (payload) => {
          console.log('Replies change detected:', payload);
          // Silently update data in the background without UI refresh
          refreshComments();
        }
      )
      .subscribe();

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(repliesChannel);
    };
  }, [refreshPosts, refreshComments]);

  return (
    <DataContext.Provider value={{ 
      posts, 
      comments,
      isLoading: postsLoading || commentsLoading,
      addPost,
      deletePost,
      likePost,
      addComment,
      likeComment,
      addCommentReply,
      likeCommentReply,
      getPostComments,
      getUserPosts,
      isPostLiked,
      likedPosts,
      refreshData,
      lastRefresh
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
