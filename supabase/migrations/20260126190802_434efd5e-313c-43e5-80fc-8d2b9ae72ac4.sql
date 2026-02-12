-- Fix RLS policies for incidents table - require authentication
DROP POLICY IF EXISTS "Anyone can view incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can create incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can delete incidents" ON public.incidents;

CREATE POLICY "Authenticated users can view incidents" 
ON public.incidents FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create incidents" 
ON public.incidents FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update incidents" 
ON public.incidents FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete incidents" 
ON public.incidents FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for alerts table - require authentication
DROP POLICY IF EXISTS "Anyone can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anyone can delete alerts" ON public.alerts;

CREATE POLICY "Authenticated users can view alerts" 
ON public.alerts FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create alerts" 
ON public.alerts FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alerts" 
ON public.alerts FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete alerts" 
ON public.alerts FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix RLS policies for evidence table - require authentication
DROP POLICY IF EXISTS "Anyone can view evidence" ON public.evidence;
DROP POLICY IF EXISTS "Anyone can create evidence" ON public.evidence;
DROP POLICY IF EXISTS "Anyone can update evidence" ON public.evidence;
DROP POLICY IF EXISTS "Anyone can delete evidence" ON public.evidence;

CREATE POLICY "Authenticated users can view evidence" 
ON public.evidence FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create evidence" 
ON public.evidence FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update evidence" 
ON public.evidence FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete evidence" 
ON public.evidence FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix RLS policy for profiles table - require authentication
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Fix storage policies for evidence-files bucket
UPDATE storage.buckets SET public = false WHERE id = 'evidence-files';

DROP POLICY IF EXISTS "Evidence files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete evidence files" ON storage.objects;

CREATE POLICY "Authenticated users can view evidence files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload evidence files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update evidence files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'evidence-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete evidence files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'evidence-files' AND auth.uid() IS NOT NULL);