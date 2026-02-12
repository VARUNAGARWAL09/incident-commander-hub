-- Add member_since column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN member_since timestamp with time zone NOT NULL DEFAULT now();

-- Update existing users to January 7, 2026
UPDATE public.profiles 
SET member_since = '2026-01-07T00:00:00Z'
WHERE member_since >= now() - interval '1 minute';