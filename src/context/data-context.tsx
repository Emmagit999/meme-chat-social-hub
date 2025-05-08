
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

  // Function to refresh all data
  const refreshData = () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    
    // For UI feedback on refresh operations that take longer than 500ms
    const refreshTimer = setTimeout(() => {
      toast.loading('Refreshing data...', {
        icon: <RefreshCcw className="animate-spin" />
      });
    }, 500);
    
    Promise.all([
      refreshPosts(),
      refreshComments()
    ])
      .then(() => {
        setLastRefresh(new Date());
        clearTimeout(refreshTimer);
        // Only show success notification for explicit refreshes
        toast.success('Data refreshed successfully!', { duration: 1500 });
      })
      .catch(() => {
        clearTimeout(refreshTimer);
        toast.error('Failed to refresh data');
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  // Set up real-time listeners for updates
  useEffect(() => {
    // Configure Supabase real-time
    const enableRealtimeForTable = async (table: string) => {
      try {
        // Enable REPLICA IDENTITY FULL for the table
        await supabase.rpc('enable_realtime', { table_name: table });
      } catch (error) {
        console.error(`Error enabling realtime for ${table}:`, error);
      }
    };
    
    // Try to enable realtime for critical tables
    enableRealtimeForTable('posts');
    enableRealtimeForTable('comments');
    enableRealtimeForTable('comment_replies');
    
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
