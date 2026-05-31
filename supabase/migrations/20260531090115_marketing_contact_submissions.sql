-- Marketing contact-form submissions. Deny-all RLS (RLS enabled, NO policies) — written
-- ONLY by the /contact server action via the service-role admin client (service_role
-- bypasses RLS). Same accepted rls_enabled_no_policy class as public.newsletter_signups /
-- public.reports / public.sent_emails. No anon/authenticated grants, no RPC.
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  source text,
  user_agent text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;
