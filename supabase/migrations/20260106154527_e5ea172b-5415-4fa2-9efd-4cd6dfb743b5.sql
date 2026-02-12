-- Create severity enum
CREATE TYPE public.incident_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- Create status enum
CREATE TYPE public.incident_status AS ENUM ('open', 'investigating', 'contained', 'resolved', 'closed');

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  severity incident_severity NOT NULL DEFAULT 'medium',
  status incident_status NOT NULL DEFAULT 'open',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  alert_count INTEGER DEFAULT 0,
  evidence_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth yet)
CREATE POLICY "Anyone can view incidents"
ON public.incidents
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create incidents"
ON public.incidents
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update incidents"
ON public.incidents
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete incidents"
ON public.incidents
FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_incidents_updated_at
BEFORE UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate case number
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 'CASE-([0-9]+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.incidents;
  
  NEW.case_number := 'CASE-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate case number
CREATE TRIGGER generate_incident_case_number
BEFORE INSERT ON public.incidents
FOR EACH ROW
WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
EXECUTE FUNCTION public.generate_case_number();

-- Enable realtime for incidents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;

-- Insert initial mock data
INSERT INTO public.incidents (case_number, title, description, severity, status, tags, alert_count, evidence_count, created_at) VALUES
('CASE-001', 'Ransomware Attack on Production Servers', 'Multiple production servers encrypted by suspected LockBit variant. Initial access vector appears to be compromised VPN credentials.', 'critical', 'investigating', ARRAY['ransomware', 'lockbit', 'production', 'priority'], 47, 23, now() - interval '2 hours'),
('CASE-002', 'Suspicious Lateral Movement Detected', 'EDR detected unusual authentication patterns suggesting lateral movement between domain controllers.', 'high', 'investigating', ARRAY['lateral-movement', 'active-directory', 'edr'], 12, 8, now() - interval '4 hours'),
('CASE-003', 'Phishing Campaign Targeting Finance Team', 'Coordinated phishing campaign detected targeting finance department with credential harvesting pages.', 'high', 'contained', ARRAY['phishing', 'credential-theft', 'finance'], 28, 15, now() - interval '1 day'),
('CASE-004', 'Data Exfiltration via Cloud Storage', 'Large volume of data transferred to unauthorized cloud storage service from engineering workstation.', 'medium', 'open', ARRAY['data-exfiltration', 'cloud', 'dlp'], 5, 3, now() - interval '1 hour'),
('CASE-005', 'Cryptominer Detected on Development Server', 'XMRig cryptominer binary detected running on dev-server-12. Process terminated and system isolated.', 'medium', 'resolved', ARRAY['cryptominer', 'malware', 'development'], 8, 11, now() - interval '2 days'),
('CASE-006', 'Brute Force Attack on SSH Services', 'Multiple SSH brute force attempts detected from TOR exit nodes targeting external-facing servers.', 'low', 'closed', ARRAY['brute-force', 'ssh', 'tor'], 156, 4, now() - interval '3 days');