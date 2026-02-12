-- Create activities table for persistent activity log
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('action', 'note', 'evidence', 'status_change', 'assignment', 'alert')),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'System',
  user_email TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view activities" ON public.activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can create activities" ON public.activities FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_activities_incident_id ON public.activities(incident_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;