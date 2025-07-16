-- Enable Row Level Security and real-time for all tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.comment_replies REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;
ALTER TABLE public.friends REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;
ALTER TABLE public.reply_likes REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reply_likes;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON public.comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Create function to ensure posts comment count stays accurate
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count
    UPDATE public.posts 
    SET comments = COALESCE(comments, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count
    UPDATE public.posts 
    SET comments = GREATEST(COALESCE(comments, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic comment counting
DROP TRIGGER IF EXISTS trigger_update_post_comment_count_comments ON public.comments;
CREATE TRIGGER trigger_update_post_comment_count_comments
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- Create function for comment replies counting  
CREATE OR REPLACE FUNCTION update_post_comment_count_replies()
RETURNS TRIGGER AS $$
DECLARE
  parent_post_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get the post_id from the parent comment
    SELECT post_id INTO parent_post_id 
    FROM public.comments 
    WHERE id = NEW.comment_id;
    
    -- Increment comment count for the post
    UPDATE public.posts 
    SET comments = COALESCE(comments, 0) + 1 
    WHERE id = parent_post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get the post_id from the parent comment
    SELECT post_id INTO parent_post_id 
    FROM public.comments 
    WHERE id = OLD.comment_id;
    
    -- Decrement comment count for the post
    UPDATE public.posts 
    SET comments = GREATEST(COALESCE(comments, 0) - 1, 0) 
    WHERE id = parent_post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment replies
DROP TRIGGER IF EXISTS trigger_update_post_comment_count_replies ON public.comment_replies;
CREATE TRIGGER trigger_update_post_comment_count_replies
  AFTER INSERT OR DELETE ON public.comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count_replies();

-- Function to update post like counts automatically
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE public.posts 
    SET likes = COALESCE(likes, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE public.posts 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post likes
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE public.comments 
    SET likes = COALESCE(likes, 0) + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE public.comments 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment likes
DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON public.comment_likes;
CREATE TRIGGER trigger_update_comment_like_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- Function to update reply like counts
CREATE OR REPLACE FUNCTION update_reply_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE public.comment_replies 
    SET likes = COALESCE(likes, 0) + 1 
    WHERE id = NEW.reply_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE public.comment_replies 
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) 
    WHERE id = OLD.reply_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply likes
DROP TRIGGER IF EXISTS trigger_update_reply_like_count ON public.reply_likes;
CREATE TRIGGER trigger_update_reply_like_count
  AFTER INSERT OR DELETE ON public.reply_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_like_count();

-- Create function to automatically create notifications
CREATE OR REPLACE FUNCTION create_friend_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile RECORD;
BEGIN
  -- Get sender profile info
  SELECT username, avatar_url INTO sender_profile
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create notification for friend request
  INSERT INTO public.notifications (
    user_id,
    from_user_id,
    from_username,
    type,
    content,
    avatar
  ) VALUES (
    NEW.friend_id,
    NEW.user_id,
    COALESCE(sender_profile.username, 'Unknown User'),
    'friend',
    'sent you a pal request',
    sender_profile.avatar_url
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend notifications
DROP TRIGGER IF EXISTS trigger_create_friend_notification ON public.friends;
CREATE TRIGGER trigger_create_friend_notification
  AFTER INSERT ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_notification();