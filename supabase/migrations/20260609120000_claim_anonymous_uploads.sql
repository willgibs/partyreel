-- Claim anonymous uploads on sign-in (attribution P3).
--
-- An anonymous upload is a public.guests row with user_id IS NULL, created by create_guest with no session.
-- The browser that made it still holds the upload capability -- the session_token -- in localStorage under
-- pr_session_{qr_token} (one per visited event; src/lib/guest/use-stored-session.ts). When that browser
-- later authenticates, the client presents those tokens here and we stamp user_id = auth.uid() onto the
-- matching STILL-UNCLAIMED rows, so the user's anonymous history becomes theirs (P4's Uploads tab keys on
-- guests.user_id, which this populates retroactively -- the twin of create_guest's join-time stamp).
--
-- Mirrors save_event's posture (20260602162326): authenticated, SECURITY DEFINER, search_path=''. SECURITY
-- DEFINER is MANDATORY -- insert/update/delete on public.guests is revoked from authenticated + anon
-- (20260604175656), so there is no RLS write path.
--
-- SAFE + browser-callable by design: identity is auth.uid() (JWT-validated, unspoofable), NOT a client value;
-- the session_tokens are 256-bit capabilities the browser legitimately holds (the ADR-0004 model), not an
-- asserted trusted value -- so unlike the 6 ANON write RPCs server-mediated in ADR-0016 (which trusted client
-- size/email/host_id), there is nothing here for server-mediation to protect. The `user_id is null` filter
-- means an already-owned row is NEVER stolen or re-assigned (naturally idempotent: a re-run claims 0). The
-- array is bounded. Does NOT set email -- preserve the "email = verified-at-join" invariant (20260602144343).
create function public.claim_anonymous_uploads(p_session_tokens text[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
begin
  -- Defense-in-depth (the grant already excludes anon); a missing session claims nothing.
  if v_uid is null then return 0; end if;
  if p_session_tokens is null or cardinality(p_session_tokens) = 0 then return 0; end if;
  -- Sanity ceiling: ~1 token per event attended; no real browser holds 1000. Bounds the array probe.
  if cardinality(p_session_tokens) > 1000 then
    raise exception 'Too many tokens.' using errcode = 'program_limit_exceeded';
  end if;

  update public.guests
     set user_id = v_uid
   where session_token = any (p_session_tokens)
     and user_id is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.claim_anonymous_uploads(text[]) from public, anon;
grant execute on function public.claim_anonymous_uploads(text[]) to authenticated;
