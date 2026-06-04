-- ============================================================================
-- Least-privilege grant sweep (security Phase 2, Part B) — make every public table's
-- write-grant surface match its REAL write paths. Mirrors the events lockdown (Phase 1)
-- + the media/profiles column-locks. REVOKES ONLY (insert/update/delete); SELECT is
-- untouched everywhere. Safe because: SAVE goes through the save_event SECURITY DEFINER
-- RPC (owner context), UNSAVE is a direct RLS DELETE (kept), handle_new_user inserts
-- profiles in owner context, and every deny-all table is written only via SECURITY
-- DEFINER RPCs or the service-role admin client — all of which bypass these grants.
-- (Validated by a rolled-back grant-sweep simulation + a post-apply has_*_privilege snapshot.)
-- ============================================================================

-- saved_events: SAVE via save_event RPC (insert revoked); UNSAVE is a direct RLS DELETE (kept);
-- the saved-status check is a direct RLS SELECT (kept). anon has no saved_events policy → revoke all.
revoke insert, update on public.saved_events from authenticated;
revoke insert, update, delete on public.saved_events from anon;

-- highlight_reels: no app RLS writer (scaffold; future writes go via an RPC/service-role). SELECT stays.
revoke insert, update, delete on public.highlight_reels from authenticated, anon;

-- media: authenticated is already column-locked to update(status, removed_at) (Phase 1.5) — DO NOT
-- touch that grant (and do NOT add purge_at: it is trigger-derived). anon's broad grant is moot (no
-- anon media write policy) but revoke it for least-privilege.
revoke insert, update, delete on public.media from anon;

-- profiles: UPDATE is already column-locked to the allowlist; INSERT is done by handle_new_user
-- (SECURITY DEFINER trigger, owner context), and nothing deletes profiles via the client. Revoke the
-- moot INSERT/DELETE from both roles. (UPDATE grant untouched — the column allowlist stays.)
revoke insert, delete on public.profiles from authenticated, anon;

-- The 9 deny-all tables: every write is via a SECURITY DEFINER RPC (create_guest/create_report/
-- create_media*/capture_guest_email/record_link_hit) or the service-role admin client (sent_emails,
-- contact_submissions, job_applications, announcements). No host/anon direct RLS write exists.
revoke insert, update, delete on
  public.guests, public.reports, public.storage_ledger, public.link_stats, public.announcements,
  public.newsletter_signups, public.sent_emails, public.contact_submissions, public.job_applications
  from authenticated, anon;
