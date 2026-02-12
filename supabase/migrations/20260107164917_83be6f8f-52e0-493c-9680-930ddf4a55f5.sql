-- Create storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence-files', 'evidence-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view evidence files (public bucket)
CREATE POLICY "Evidence files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'evidence-files');

-- Allow anyone to upload evidence files
CREATE POLICY "Anyone can upload evidence files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'evidence-files');

-- Allow anyone to delete evidence files
CREATE POLICY "Anyone can delete evidence files"
ON storage.objects FOR DELETE
USING (bucket_id = 'evidence-files');

-- Add image_url column to evidence table
ALTER TABLE public.evidence 
ADD COLUMN IF NOT EXISTS image_url TEXT;