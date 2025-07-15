-- Fix the messages table RLS policies to allow deletions and updates for message authors
DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
DROP POLICY IF EXISTS "Users can insert messages they send" ON messages;

-- Create better RLS policies for messages
CREATE POLICY "Users can insert their own messages" 
ON messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE 
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages" 
ON messages FOR DELETE 
USING (auth.uid() = sender_id);

-- Add RLS policies for profiles to ensure data security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop duplicate policies if they exist
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create single, clear policies for profiles
CREATE POLICY "Anyone can view profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Enable real-time for friends and profiles tables
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Set replica identity for better real-time updates
ALTER TABLE friends REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE chats REPLICA IDENTITY FULL;

-- Add input validation function for usernames
CREATE OR REPLACE FUNCTION validate_username(username_input text)
RETURNS boolean AS $$
BEGIN
  -- Check if username is valid (3-30 chars, alphanumeric + underscore)
  RETURN username_input ~ '^[a-zA-Z0-9_]{3,30}$';
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for username validation
ALTER TABLE profiles ADD CONSTRAINT username_validation 
CHECK (username IS NULL OR validate_username(username));

-- Create index for better friend lookup performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(participant1, participant2);