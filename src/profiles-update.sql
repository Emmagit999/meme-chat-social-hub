
-- This is what we'll need to add to the profiles table, but we'll use a lov-sql block for it
-- Will add a bio column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
