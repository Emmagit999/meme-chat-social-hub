
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Post, Comment, CommentReply } from '@/types';
import { usePosts } from '@/hooks/use-posts';
import { useComments } from '@/hooks/use-comments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';

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

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Function to refresh all data - now more silent with fewer notifications
  const refreshData = () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    
    // Only show loading toast for refreshes that take longer than 1.5s
    const refreshTimer = setTimeout(() => {
      toast.loading('Refreshing content...', {
        icon: <RefreshCcw className="animate-spin" />,
        duration: 2000, // Auto-close after 2 seconds
      });
    }, 1500);
    
    Promise.all([
      refreshPosts(),
      refreshComments()
    ])
      .then(() => {
        setLastRefresh(new Date());
        clearTimeout(refreshTimer);
        // Silent refresh - only show notification if explicitly requested by user
      })
      .catch(() => {
        clearTimeout(refreshTimer);
        toast.error('Connection issue detected', {
          duration: 3000 // Auto-close after 3 seconds
        });
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  // Set up real-time listeners for updates
  useEffect(() => {
    // Configure Supabase real-time - using the direct channel approach
    // instead of RPC which wasn't working
    
    // Listen for changes in posts table
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Posts change detected:', payload);
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
