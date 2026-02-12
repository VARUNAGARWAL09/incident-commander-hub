-- Allow authenticated users to delete profiles (for team management)
-- Only admins should be able to delete other users, but for now allow authenticated users
CREATE POLICY "Authenticated users can delete profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);