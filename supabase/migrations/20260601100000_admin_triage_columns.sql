-- Phase 3 (admin portal): triage tracking for the support + applicants inboxes.
-- contact_submissions / job_applications stay deny-all RLS (operator-internal, written by
-- the marketing forms + read/triaged by the service-role admin client); no policies/grants
-- change here. We add who/when triage columns (mirroring reports.resolved_by/resolved_at)
-- and constrain the free-text status to the known set.

-- Who triaged + when. Service-role-written (the admin action sets these).
alter table public.contact_submissions
  add column handled_by uuid references public.profiles (id) on delete set null,
  add column handled_at timestamptz;

alter table public.job_applications
  add column handled_by uuid references public.profiles (id) on delete set null,
  add column handled_at timestamptz;

-- Constrain the triage status to the known set. Existing rows are all 'new' (the forms
-- insert the default + nothing else writes status yet), so this applies cleanly.
alter table public.contact_submissions
  add constraint contact_submissions_status_check
  check (status in ('new', 'in_progress', 'closed'));

alter table public.job_applications
  add constraint job_applications_status_check
  check (status in ('new', 'in_progress', 'closed'));

-- Triage list ordering/filtering (mirrors reports' (status, created_at) index).
create index contact_submissions_status_created_idx
  on public.contact_submissions (status, created_at desc);

create index job_applications_status_created_idx
  on public.job_applications (status, created_at desc);
