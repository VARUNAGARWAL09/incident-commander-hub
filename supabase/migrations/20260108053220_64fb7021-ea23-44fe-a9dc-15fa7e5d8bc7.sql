-- SLA Configurations table
CREATE TABLE public.sla_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  severity TEXT NOT NULL,
  acknowledge_within_minutes INTEGER NOT NULL DEFAULT 60,
  resolve_within_minutes INTEGER NOT NULL DEFAULT 1440,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SLA configs
CREATE POLICY "Anyone can view SLA configs" ON public.sla_configs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage SLA configs" ON public.sla_configs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update SLA configs" ON public.sla_configs FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete SLA configs" ON public.sla_configs FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add SLA tracking fields to incidents
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS acknowledged_by UUID,
ADD COLUMN IF NOT EXISTS sla_acknowledge_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_resolve_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sla_status TEXT DEFAULT 'on_track';

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit logs (only authenticated users can view)
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Insert default SLA configurations
INSERT INTO public.sla_configs (name, severity, acknowledge_within_minutes, resolve_within_minutes) VALUES
('Critical SLA', 'critical', 15, 240),
('High SLA', 'high', 30, 480),
('Medium SLA', 'medium', 60, 1440),
('Low SLA', 'low', 120, 2880),
('Info SLA', 'info', 240, 4320);

-- Trigger to update timestamps
CREATE TRIGGER update_sla_configs_updated_at
BEFORE UPDATE ON public.sla_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for audit logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;