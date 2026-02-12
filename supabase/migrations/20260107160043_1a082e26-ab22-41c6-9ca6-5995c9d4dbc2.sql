-- Create alert severity and status types
CREATE TYPE public.alert_status AS ENUM ('pending', 'acknowledged', 'resolved', 'dismissed');

-- Create alerts table
CREATE TABLE public.alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    severity public.incident_severity NOT NULL DEFAULT 'medium',
    status public.alert_status NOT NULL DEFAULT 'pending',
    raw_data JSONB,
    resolution_method TEXT,
    acknowledged_by UUID REFERENCES auth.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence classification type
CREATE TYPE public.evidence_classification AS ENUM ('malicious', 'suspicious', 'benign', 'unknown');
CREATE TYPE public.evidence_type AS ENUM ('file', 'hash', 'url', 'ip', 'domain', 'email', 'other');

-- Create evidence table
CREATE TABLE public.evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    type public.evidence_type NOT NULL DEFAULT 'other',
    value TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    classification public.evidence_classification NOT NULL DEFAULT 'unknown',
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Alerts policies (viewable by all authenticated, modifiable by all for now)
CREATE POLICY "Anyone can view alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Anyone can create alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete alerts" ON public.alerts FOR DELETE USING (true);

-- Evidence policies
CREATE POLICY "Anyone can view evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Anyone can create evidence" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evidence" ON public.evidence FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete evidence" ON public.evidence FOR DELETE USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evidence_updated_at
    BEFORE UPDATE ON public.evidence
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for alerts and evidence
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evidence;