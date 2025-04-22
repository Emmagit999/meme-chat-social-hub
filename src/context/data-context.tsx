
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
  getUserPosts: (userId: string) => Post[];
};

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage keys for localStorage
const POSTS_STORAGE_KEY = 'memechat_posts';
const COMMENTS_STORAGE_KEY = 'memechat_comments';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Set up real-time listeners for posts and comments
  useEffect(() => {
    // Set up real-time listeners for posts
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: '*', // Listen for all changes: INSERT, UPDATE, DELETE
        schema: 'public', 
        table: 'posts' 
      }, (payload) => {
        console.log('Post change detected:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          const newPost = payload.new as any;
          const formattedPost: Post = {
            id: newPost.id,
            userId: newPost.user_id,
            username: newPost.username,
            userAvatar: newPost.user_avatar,
            content: newPost.content,
            image: newPost.image,
            video: newPost.video,
            likes: newPost.likes || 0,
            comments: newPost.comments || 0,
            createdAt: new Date(newPost.created_at),
            type: newPost.type || 'meme'
          };
          
          setPosts(prevPosts => [formattedPost, ...prevPosts]);
          
          // Show notification if post is not from current user
          if (user && newPost.user_id !== user.id) {
            toast(`New ${newPost.type || 'post'} from ${newPost.username}!`);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedPost = payload.new as any;
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === updatedPost.id 
                ? {
                    ...post,
                    content: updatedPost.content,
                    image: updatedPost.image,
                    video: updatedPost.video,
                    likes: updatedPost.likes || post.likes,
                    comments: updatedPost.comments || post.comments
                  }
                : post
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedPost = payload.old as any;
          setPosts(prevPosts => 
            prevPosts.filter(post => post.id !== deletedPost.id)
          );
        }
      })
      .subscribe();
    
    // Set up real-time listeners for comments
    const commentsChannel = supabase
      .channel('public:comments')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments' 
      }, (payload) => {
        console.log('Comment change detected:', payload);
        
        // Handle different types of changes
        if (payload.eventType === 'INSERT') {
          const newComment = payload.new as any;
          const formattedComment: Comment = {
            id: newComment.id,
            postId: newComment.post_id,
            userId: newComment.user_id,
            username: newComment.username,
            userAvatar: newComment.user_avatar,
            content: newComment.content,
            likes: newComment.likes || 0,
            createdAt: new Date(newComment.created_at),
            replies: []
          };
          
          setComments(prevComments => [...prevComments, formattedComment]);
          
          // Update comment count on the post
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === newComment.post_id 
                ? { ...post, comments: post.comments + 1 } 
                : post
            )
          );
          
          // Show notification if comment is on current user's post
          if (user) {
            const isUserPost = posts.some(p => p.id === newComment.post_id && p.userId === user.id);
            if (isUserPost && newComment.user_id !== user.id) {
              toast(`New comment from ${newComment.username}`);
            }
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedComment = payload.new as any;
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === updatedComment.id 
                ? {
                    ...comment,
                    content: updatedComment.content,
                    likes: updatedComment.likes || comment.likes
                  }
                : comment
            )
          );
        } else if (payload.eventType === 'DELETE') {
          const deletedComment = payload.old as any;
          setComments(prevComments => 
            prevComments.filter(comment => comment.id !== deletedComment.id)
          );
          
          // Update comment count on the post
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === deletedComment.post_id 
                ? { ...post, comments: Math.max(0, post.comments - 1) } 
                : post
            )
          );
        }
      })
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [user, posts]);

  // Load data from Supabase on initial render
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // First try to load posts from Supabase
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (postsError) {
          console.error('Error fetching posts from Supabase:', postsError);
          loadFromLocalStorage();
          return;
        }
        
        if (postsData && postsData.length > 0) {
          // Convert Supabase posts to Post objects
          const formattedPosts = postsData.map((post: any) => ({
            id: post.id,
            userId: post.user_id,
            username: post.username,
            userAvatar: post.user_avatar,
            content: post.content,
            image: post.image,
            video: post.video,
            likes: post.likes || 0,
            comments: post.comments || 0,
            createdAt: new Date(post.created_at),
            type: post.type || 'meme'
          }));
          
          setPosts(formattedPosts);
          
          // Now load comments
          const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select('*')
            .order('created_at', { ascending: true });
          
          if (commentsError) {
            console.error('Error fetching comments from Supabase:', commentsError);
          } else if (commentsData && commentsData.length > 0) {
            // Convert Supabase comments to Comment objects
            const formattedComments = commentsData.map((comment: any) => ({
              id: comment.id,
              postId: comment.post_id,
              userId: comment.user_id,
              username: comment.username,
              userAvatar: comment.user_avatar,
              content: comment.content,
              likes: comment.likes || 0,
              createdAt: new Date(comment.created_at),
              replies: [] // We'll handle replies separately if needed
            }));
            
            setComments(formattedComments);
          }
        } else {
          // No posts found in Supabase, load from localStorage
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Fallback to load from localStorage
  const loadFromLocalStorage = () => {
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
        setPosts([]);
      }
    } else {
      setPosts([]);
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
        setComments([]);
      }
    } else {
      setComments([]);
    }
  };

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

  const addPost = async (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }
    
    const newPost: Post = {
      ...postData,
      id: Date.now().toString(),
      likes: 0,
      comments: 0,
      createdAt: new Date()
    };
    
    try {
      // Save post to Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert({
          id: newPost.id,
          user_id: newPost.userId,
          username: newPost.username,
          user_avatar: newPost.userAvatar,
          content: newPost.content,
          image: newPost.image,
          video: newPost.video,
          type: newPost.type,
          created_at: newPost.createdAt.toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // If post was saved successfully, the real-time channel will handle adding it to the UI
      toast.success("Post created successfully!");
    } catch (error) {
      console.error('Error saving post to Supabase:', error);
      toast.error("Failed to create post. Please try again.");
      
      // Fall back to local state if Supabase fails
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a post");
      return;
    }
    
    try {
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1 } 
            : post
        )
      );
      
      // Save like to Supabase
      const post = posts.find(p => p.id === postId);
      if (post) {
        const { error } = await supabase
          .from('posts')
          .update({ likes: post.likes + 1 })
          .eq('id', postId);
        
        if (error) {
          throw error;
        }
        
        // Also save the like in a likes table for tracking which user liked which post
        await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to like post. Please try again.");
      
      // Revert optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes - 1 } 
            : post
        )
      );
    }
  };

  const addComment = async (commentData: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>) => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    const newComment: Comment = {
      ...commentData,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date(),
      replies: []
    };
    
    try {
      // Save comment to Supabase
      const { data, error } = await supabase
        .from('comments')
        .insert({
          id: newComment.id,
          post_id: newComment.postId,
          user_id: newComment.userId,
          username: newComment.username,
          user_avatar: newComment.userAvatar,
          content: newComment.content,
          created_at: newComment.createdAt.toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // If comment was saved successfully, the real-time channel will handle adding it to the UI
      // and updating the post's comment count
      toast.success("Comment added!");
    } catch (error) {
      console.error('Error saving comment to Supabase:', error);
      toast.error("Failed to add comment. Please try again.");
      
      // Fall back to local state if Supabase fails
      setComments(prevComments => [...prevComments, newComment]);
      
      // Update comment count on the post
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === commentData.postId 
            ? { ...post, comments: post.comments + 1 } 
            : post
        )
      );
    }
  };

  const getPostComments = (postId: string) => {
    return comments.filter(comment => comment.postId === postId);
  };

  const addCommentReply = async (commentId: string, replyData: Omit<CommentReply, 'id' | 'likes' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to reply");
      return;
    }
    
    const newReply: CommentReply = {
      ...replyData,
      commentId,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date()
    };
    
    try {
      // Save reply to Supabase
      const { data, error } = await supabase
        .from('comment_replies')
        .insert({
          id: newReply.id,
          comment_id: newReply.commentId,
          user_id: newReply.userId,
          username: newReply.username,
          user_avatar: newReply.userAvatar,
          content: newReply.content,
          created_at: newReply.createdAt.toISOString()
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update local state
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
    } catch (error) {
      console.error('Error saving reply to Supabase:', error);
      toast.error("Failed to add reply. Please try again.");
      
      // Fall back to local state if Supabase fails
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
    }
  };

  const likeComment = async (commentId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a comment");
      return;
    }
    
    try {
      // Optimistic update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes + 1 } 
            : comment
        )
      );
      
      // Save like to Supabase
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        const { error } = await supabase
          .from('comments')
          .update({ likes: comment.likes + 1 })
          .eq('id', commentId);
        
        if (error) {
          throw error;
        }
        
        // Also save the like in a likes table
        await supabase
          .from('comment_likes')
          .insert({
            user_id: user.id,
            comment_id: commentId,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error("Failed to like comment. Please try again.");
      
      // Revert optimistic update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes: comment.likes - 1 } 
            : comment
        )
      );
    }
  };

  const likeCommentReply = async (commentId: string, replyId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a reply");
      return;
    }
    
    try {
      // Optimistic update
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
      
      // Save like to Supabase
      const { error } = await supabase
        .from('comment_replies')
        .update({ likes: (comments.find(c => c.id === commentId)?.replies || []).find(r => r.id === replyId)?.likes + 1 })
        .eq('id', replyId);
      
      if (error) {
        throw error;
      }
      
      // Also save the like in a likes table
      await supabase
        .from('reply_likes')
        .insert({
          user_id: user.id,
          reply_id: replyId,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error liking reply:', error);
      toast.error("Failed to like reply. Please try again.");
      
      // Revert optimistic update
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                replies: (comment.replies || []).map(reply => 
                  reply.id === replyId 
                    ? { ...reply, likes: reply.likes - 1 } 
                    : reply
                ) 
              } 
            : comment
        )
      );
    }
  };
  
  // Function to get posts by a specific user
  const getUserPosts = (userId: string): Post[] => {
    return posts.filter(post => post.userId === userId);
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
      likeCommentReply,
      getUserPosts
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
