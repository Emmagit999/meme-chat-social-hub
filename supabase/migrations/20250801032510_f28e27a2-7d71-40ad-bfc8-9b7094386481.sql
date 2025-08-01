-- Create status table for 24-hour stories
CREATE TABLE public.status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.status ENABLE ROW LEVEL SECURITY;

-- Create policies for status
CREATE POLICY "Anyone can view status" 
ON public.status 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Users can create their own status" 
ON public.status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status" 
ON public.status 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_status_user_expires ON public.status(user_id, expires_at);
CREATE INDEX idx_status_expires ON public.status(expires_at);

-- Add trigger to automatically delete expired statuses
CREATE OR REPLACE FUNCTION delete_expired_status()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.status WHERE expires_at < now();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_expired_status
  AFTER INSERT OR UPDATE ON public.status
  EXECUTE FUNCTION delete_expired_status();