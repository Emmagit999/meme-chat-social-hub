
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Comment } from '@/types';
import { toast } from "sonner";

type DataContextType = {
  posts: Post[];
  comments: Comment[];
  isLoading: boolean;
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  likePost: (postId: string) => void;
  addComment: (comment: Omit<Comment, 'id' | 'likes' | 'createdAt'>) => void;
  getPostComments: (postId: string) => Comment[];
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
    createdAt: new Date(2024, 3, 15, 15, 10)
  },
  {
    id: "2",
    postId: "1",
    userId: "1",
    username: "meme_lord",
    userAvatar: "/assets/avatar1.jpg",
    content: "Story of my life 😂",
    likes: 8,
    createdAt: new Date(2024, 3, 15, 15, 20)
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);

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
  };

  const likePost = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 } 
          : post
      )
    );
  };

  const addComment = (commentData: Omit<Comment, 'id' | 'likes' | 'createdAt'>) => {
    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date()
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
  };

  const getPostComments = (postId: string) => {
    return comments.filter(comment => comment.postId === postId);
  };

  return (
    <DataContext.Provider value={{ 
      posts, 
      comments,
      isLoading,
      addPost,
      likePost,
      addComment,
      getPostComments
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
