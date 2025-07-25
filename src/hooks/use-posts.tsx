import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from './use-notifications';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Function to load posts from the database
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      setPosts(postsData?.map(post => ({
        id: post.id,
        userId: post.user_id,
        username: post.username || 'anonymous',
        userAvatar: post.user_avatar || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
        content: post.content,
        image: post.image,
        video: post.video,
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: new Date(post.created_at),
        type: post.type as 'meme' | 'roast' | 'joke' | 'posts'
      })) || []);
      
      return postsData;
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to load user's liked posts
  const loadLikedPosts = useCallback(async () => {
    if (!user) return;

    try {
      const { data: likedPostsData, error: likedError } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      if (!likedError && likedPostsData) {
        setLikedPosts(likedPostsData.map(like => like.post_id));
      }
      
      return likedPostsData;
    } catch (error) {
      console.error('Error loading liked posts:', error);
      return null;
    }
  }, [user]);

  // Public function to refresh posts data
  const refreshPosts = useCallback(async () => {
    const results = await Promise.all([
      loadPosts(),
      loadLikedPosts()
    ]);
    return results;
  }, [loadPosts, loadLikedPosts]);

  useEffect(() => {
    refreshPosts();

    // Set up real-time updates for posts
    const postsChannel = supabase
      .channel('public:posts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts'
      }, (payload) => {
        const newPost = payload.new as any;
        
        // Add the new post to the list
        const formattedPost: Post = {
          id: newPost.id,
          userId: newPost.user_id,
          username: newPost.username || 'anonymous',
          userAvatar: newPost.user_avatar || `/assets/avatar${Math.floor(Math.random() * 3) + 1}.jpg`,
          content: newPost.content,
          image: newPost.image,
          video: newPost.video,
          likes: newPost.likes || 0,
          comments: newPost.comments || 0,
          createdAt: new Date(newPost.created_at),
          type: newPost.type as 'meme' | 'roast' | 'joke' | 'posts'
        };
        
        setPosts(prev => [formattedPost, ...prev]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'posts'
      }, (payload) => {
        const updatedPost = payload.new as any;
        
        // Update the post in the list
        setPosts(prev => prev.map(post => 
          post.id === updatedPost.id 
            ? {
                ...post,
                content: updatedPost.content,
                image: updatedPost.image,
                video: updatedPost.video,
                likes: updatedPost.likes || 0,
                comments: updatedPost.comments || 0,
                type: updatedPost.type as 'meme' | 'roast' | 'joke' | 'posts',
                userAvatar: updatedPost.user_avatar || post.userAvatar,
              } 
            : post
        ));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'posts'
      }, (payload) => {
        // Remove the deleted post from the list
        const deletedPostId = payload.old?.id;
        if (deletedPostId) {
          setPosts(prev => prev.filter(post => post.id !== deletedPostId));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [refreshPosts]);

  const addPost = async (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      const validType: 'meme' | 'roast' | 'joke' | 'posts' = 
        (postData.type === 'meme' || postData.type === 'roast' || postData.type === 'joke' || postData.type === 'posts') 
          ? postData.type 
          : 'meme';

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: postData.userId,
          username: postData.username,
          user_avatar: postData.userAvatar,
          content: postData.content,
          image: postData.image,
          video: postData.video,
          type: validType
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newPost: Post = {
          id: data.id,
          userId: data.user_id,
          username: data.username,
          userAvatar: data.user_avatar,
          content: data.content,
          image: data.image,
          video: data.video,
          likes: 0,
          comments: 0,
          createdAt: new Date(data.created_at),
          type: data.type as 'meme' | 'roast' | 'joke' | 'posts'
        };

        // Real-time will handle adding to list
        toast.success(`${newPost.type.charAt(0).toUpperCase() + newPost.type.slice(1)} created!`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
    }
  };
  
  const deletePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete a post");
      return;
    }
    
    try {
      // Check if the post belongs to the current user
      const post = posts.find(p => p.id === postId);
      if (!post || post.userId !== user.id) {
        toast.error("You can only delete your own posts");
        return;
      }
      
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
      
      // Remove from local state
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("Failed to delete post");
      throw error;
    }
  };

  const likePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a post");
      return;
    }

    const isAlreadyLiked = likedPosts.includes(postId);
    const currentPost = posts.find(p => p.id === postId);
    
    if (!currentPost) return;

    try {
      if (isAlreadyLiked) {
        // Unlike the post - first remove from UI
        setLikedPosts(prev => prev.filter(id => id !== postId));
        
        // Delete like record from database
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (deleteError) throw deleteError;

        // Update post likes count in database
        const newLikeCount = Math.max(0, currentPost.likes - 1);
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: newLikeCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        // Update local state with new count from database
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: newLikeCount } 
              : post
          )
        );

      } else {
        // Like the post - first add to UI
        setLikedPosts(prev => [...prev, postId]);
        
        // Record the like in post_likes table
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (insertError) throw insertError;

        // Update post likes count in database
        const newLikeCount = currentPost.likes + 1;
        const { error: updateError } = await supabase
          .from('posts')
          .update({ likes: newLikeCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        // Update local state with new count from database
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likes: newLikeCount } 
              : post
          )
        );
        
        // Add notification for the post owner if it's not the current user
        if (currentPost.userId !== user.id) {
          try {
            addNotification({
              type: 'like',
              from: user.username,
              fromUserId: user.id,
              avatar: user.avatar || '',
              content: `liked your ${currentPost.type}`,
              read: false
            });
            
            // Create notification in database
            await supabase.from('notifications').insert({
              user_id: currentPost.userId,
              type: 'like',
              from_username: user.username,
              from_user_id: user.id,
              avatar: user.avatar,
              content: `liked your ${currentPost.type}`,
              read: false
            });
          } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Don't fail the like operation for notification errors
          }
        }
      }
    } catch (error) {
      console.error('Error toggling post like:', error);
      toast.error("Failed to update like status");
      
      // Revert UI changes on error
      if (isAlreadyLiked) {
        setLikedPosts(prev => [...prev, postId]);
      } else {
        setLikedPosts(prev => prev.filter(id => id !== postId));
      }
      
      // Refresh posts to get accurate data
      setTimeout(() => {
        refreshPosts();
      }, 1000);
    }
  };

  const getUserPosts = useCallback((userId: string): Post[] => {
    return posts.filter(post => post.userId === userId);
  }, [posts]);

  const isPostLiked = useCallback((postId: string): boolean => {
    return likedPosts.includes(postId);
  }, [likedPosts]);

  return { 
    posts, 
    isLoading, 
    addPost, 
    deletePost,
    likePost, 
    getUserPosts, 
    isPostLiked, 
    likedPosts,
    refreshPosts 
  };
};
