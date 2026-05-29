-- Phase 6 (growth loop) — guest email capture + a durable newsletter list.
--
-- Two storage targets, on purpose:
--   • guests.email (already exists) holds the per-event email for THIS event's album
--     link. It cascade-deletes with the event — fine, it's event-scoped.
--   • newsletter_signups is the DURABLE marketing list. It must survive event/guest
--     deletion, so it's a standalone table keyed by email (NOT a guests column);
--     event_id is on delete set null so the signup outlives the event it came from.
-- Operator-internal: RLS on with NO policies (deny-all) — written only via the
-- SECURITY DEFINER capture_guest_email RPC + the service-role admin client. Same
-- accepted rls_enabled_no_policy pattern as public.reports / public.sent_emails.
create table public.newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  event_id uuid references public.events (id) on delete set null,
  opted_in_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.newsletter_signups enable row level security;

-- Guest email capture (the post-upload prompt). The opaque session_token IS the
-- capability (ADR-0004) — guests have no JWT. Sets guests.email ONLY if currently
-- null (never clobber an email the guest gave at join), and on opt-in upserts the
-- durable newsletter list (dedupe by lowercased email). Returns nothing sensitive.
create or replace function public.capture_guest_email(
  p_session_token text,
  p_email text,
  p_newsletter_opt_in boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests;
  v_email text;
begin
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
  if v_email is null then
    raise exception 'An email is required.' using errcode = 'check_violation';
  end if;

  select * into v_guest from public.guests where session_token = p_session_token;
  if not found then
    raise exception 'Invalid guest session.' using errcode = 'no_data_found';
  end if;

  -- Per-event email: only fill it if the guest hasn't already provided one.
  update public.guests
    set email = v_email
    where id = v_guest.id and email is null;

  if p_newsletter_opt_in then
    insert into public.newsletter_signups (email, source, event_id)
    values (v_email, 'guest_upload', v_guest.event_id)
    on conflict (email) do nothing;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.capture_guest_email(text, text, boolean) to anon, authenticated;
