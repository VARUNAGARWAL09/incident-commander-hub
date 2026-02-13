
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade not null,
  executive_summary jsonb,
  technical_analysis jsonb,
  root_cause jsonb,
  business_impact jsonb,
  remediation jsonb,
  compliance_mapping jsonb,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  status text check (status in ('draft', 'final', 'approved')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(incident_id)
);

alter table public.incident_reports enable row level security;

-- Policies
create policy "Authenticated users can view incident reports"
  on public.incident_reports for select
  to authenticated
  using (true);

create policy "Authenticated users can insert incident reports"
  on public.incident_reports for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update incident reports"
  on public.incident_reports for update
  to authenticated
  using (true);
