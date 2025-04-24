import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPosts(data?.map(post => ({
          id: post.id,
          userId: post.user_id,
          username: post.username,
          userAvatar: post.user_avatar,
          content: post.content,
          image: post.image,
          video: post.video,
          likes: post.likes,
          comments: post.comments,
          createdAt: new Date(post.created_at),
          type: post.type as 'meme' | 'roast' | 'joke'
        })) || []);
      } catch (error) {
        console.error('Error loading posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  const addPost = async (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return;
    }

    try {
      const validType: 'meme' | 'roast' | 'joke' = 
        (postData.type === 'meme' || postData.type === 'roast' || postData.type === 'joke') 
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
          type: data.type as 'meme' | 'roast' | 'joke'
        };

        setPosts(prev => [newPost, ...prev]);
        toast.success("Post created successfully!");
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error("Failed to create post");
    }
  };

  const likePost = async (postId: string) => {
    if (!user) {
      toast.error("You must be logged in to like a post");
      return;
    }

    try {
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1 } 
            : post
        )
      );

      const { error } = await supabase
        .from('posts')
        .update({ likes: posts.find(p => p.id === postId)?.likes + 1 })
        .eq('id', postId);

      if (error) throw error;

      await supabase
        .from('post_likes')
        .insert({
          user_id: user.id,
          post_id: postId
        });
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error("Failed to like post");
      
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes - 1 } 
            : post
        )
      );
    }
  };

  return { posts, isLoading, addPost, likePost };
};
