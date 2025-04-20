
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Comment, CommentReply } from '@/types';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";

type DataContextType = {
  posts: Post[];
  comments: Comment[];
  isLoading: boolean;
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  likePost: (postId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => void;
  getPostComments: (postId: string) => Comment[];
  addCommentReply: (commentId: string, reply: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => void;
  likeComment: (commentId: string) => void;
  likeCommentReply: (commentId: string, replyId: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data
const initialPosts: Post[] = [
  {
    id: "1",
    userId: "1",
    username: "meme_lord",
    userAvatar: "/assets/avatar1.jpg",
    content: "When you finally understand a programming concept after staring at it for 3 hours",
    image: "https://placehold.co/600x400/121212/00C853?text=Programming+Meme",
    likes: 120,
    comments: 15,
    createdAt: new Date(2024, 3, 15, 14, 30),
    type: 'meme'
  },
  {
    id: "2",
    userId: "2",
    username: "roast_master",
    userAvatar: "/assets/avatar2.jpg",
    content: "Your code is so bad, even the compiler is giving up on you",
    likes: 89,
    comments: 7,
    createdAt: new Date(2024, 3, 15, 12, 15),
    type: 'roast'
  },
  {
    id: "3",
    userId: "1",
    username: "meme_lord",
    userAvatar: "/assets/avatar1.jpg",
    content: "Why did the developer go broke? Because he used up all his cache!",
    likes: 56,
    comments: 3,
    createdAt: new Date(2024, 3, 14, 18, 45),
    type: 'joke'
  }
];

const initialComments: Comment[] = [
  {
    id: "1",
    postId: "1",
    userId: "2",
    username: "roast_master",
    userAvatar: "/assets/avatar2.jpg",
    content: "This is so relatable it hurts!",
    likes: 12,
    createdAt: new Date(2024, 3, 15, 15, 10),
    replies: [
      {
        id: "1",
        commentId: "1",
        userId: "1",
        username: "meme_lord",
        userAvatar: "/assets/avatar1.jpg",
        content: "Right? I spent 5 hours debugging yesterday!",
        likes: 3,
        createdAt: new Date(2024, 3, 15, 15, 15)
      }
    ]
  },
  {
    id: "2",
    postId: "1",
    userId: "1",
    username: "meme_lord",
    userAvatar: "/assets/avatar1.jpg",
    content: "Story of my life 😂",
    likes: 8,
    createdAt: new Date(2024, 3, 15, 15, 20),
    replies: []
  }
];

// Storage keys for localStorage
const POSTS_STORAGE_KEY = 'memechat_posts';
const COMMENTS_STORAGE_KEY = 'memechat_comments';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      const savedPosts = localStorage.getItem(POSTS_STORAGE_KEY);
      const savedComments = localStorage.getItem(COMMENTS_STORAGE_KEY);
      
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts);
          // Convert string dates back to Date objects
          const formattedPosts = parsedPosts.map((post: any) => ({
            ...post,
            createdAt: new Date(post.createdAt)
          }));
          setPosts(formattedPosts);
        } catch (error) {
          console.error('Error parsing saved posts:', error);
          setPosts(initialPosts);
        }
      } else {
        setPosts(initialPosts);
      }
      
      if (savedComments) {
        try {
          const parsedComments = JSON.parse(savedComments);
          // Convert string dates back to Date objects
          const formattedComments = parsedComments.map((comment: any) => ({
            ...comment,
            createdAt: new Date(comment.createdAt),
            replies: comment.replies.map((reply: any) => ({
              ...reply,
              createdAt: new Date(reply.createdAt)
            }))
          }));
          setComments(formattedComments);
        } catch (error) {
          console.error('Error parsing saved comments:', error);
          setComments(initialComments);
        }
      } else {
        setComments(initialComments);
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Save data to localStorage whenever posts or comments change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    }
  }, [posts, isLoading]);
  
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
    }
  }, [comments, isLoading]);

  const addPost = (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      likes: 0,
      comments: 0,
      createdAt: new Date()
    };
    
    setPosts(prevPosts => [newPost, ...prevPosts]);
    toast.success("Post created successfully!");

    // In a real app, we would also save to Supabase here
    // const { error } = await supabase.from('posts').insert([newPost]);
    // if (error) toast.error(error.message);
  };

  const likePost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      )
    );

    // In a real app, update likes in Supabase
    // const { error } = await supabase.from('post_likes').insert([{ post_id: postId, user_id: user.id }]);
  };

  const addComment = (commentData: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => {
    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date(),
      replies: []
    };
    
    setComments(prevComments => [...prevComments, newComment]);
    
    // Update comment count on the post
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === commentData.postId 
          ? { ...post, comments: post.comments + 1 } 
          : post
      )
    );
    
    toast.success("Comment added!");

    // In a real app, save to Supabase
    // const { error } = await supabase.from('comments').insert([newComment]);
  };

  const getPostComments = (postId: string) => {
    return comments.filter(comment => comment.postId === postId);
  };

  const addCommentReply = (commentId: string, replyData: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => {
    const newReply: CommentReply = {
      ...replyData,
      commentId,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date()
    };
    
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              replies: [...(comment.replies || []), newReply]
            } 
          : comment
      )
    );
    
    toast.success("Reply added!");

    // In a real app, save to Supabase
    // const { error } = await supabase.from('comment_replies').insert([newReply]);
  };

  const likeComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: comment.likes + 1 } 
          : comment
      )
    );

    // In a real app, update likes in Supabase
    // const { error } = await supabase.from('comment_likes').insert([{ comment_id: commentId, user_id: user.id }]);
  };

  const likeCommentReply = (commentId: string, replyId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              replies: (comment.replies || []).map(reply => 
                reply.id === replyId 
                  ? { ...reply, likes: reply.likes + 1 } 
                  : reply
              ) 
            } 
          : comment
      )
    );

    // In a real app, update likes in Supabase
    // const { error } = await supabase.from('reply_likes').insert([{ reply_id: replyId, user_id: user.id }]);
  };

  return (
    <DataContext.Provider value={{ 
      posts, 
      comments,
      isLoading,
      addPost,
      likePost,
      addComment,
      getPostComments,
      addCommentReply,
      likeComment,
      likeCommentReply
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
