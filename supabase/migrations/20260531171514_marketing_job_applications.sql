-- Marketing careers application submissions. Deny-all RLS (RLS enabled, NO policies) —
-- written ONLY by the /careers server action via the service-role admin client
-- (service_role bypasses RLS). Same accepted rls_enabled_no_policy class as
-- public.contact_submissions / newsletter_signups / reports / sent_emails. No
-- anon/authenticated grants, no RPC.
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  role_slug text not null,
  name text not null,
  email text not null,
  links text,
  message text not null,
  resume_url text,
  source text,
  user_agent text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.job_applications enable row level security;
