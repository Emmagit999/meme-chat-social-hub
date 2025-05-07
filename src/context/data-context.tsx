
import React, { createContext, useContext } from 'react';
import { Post, Comment, CommentReply } from '@/types';
import { usePosts } from '@/hooks/use-posts';
import { useComments } from '@/hooks/use-comments';

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
    likedPosts 
  } = usePosts();
  
  const { 
    comments, 
    isLoading: commentsLoading, 
    addComment, 
    likeComment,
    addCommentReply,
    likeCommentReply,
    getPostComments 
  } = useComments();

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
      likedPosts
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
