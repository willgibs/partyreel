-- ============================================================================
-- ★ DESTRUCTIVE. APPLIED ONLY ON WILL'S YES, never by a lane (lp/identity-email's brief).
--
-- The rows deleted accounts ALREADY left behind. Before 20260926200000_identity.sql, deleting an
-- account unlinked its guest rows in other hosts' events (`guests.user_id` is `on delete set null`)
-- and left the confirmed address on them, where the host's viewer still printed it beside a
-- nameless photo. Going forward the request, the sweep and the BEFORE DELETE trigger clear it;
-- this clears what they never saw.
--
-- Why `user_id is null and email is not null` is exactly those rows: `guests.email` is written only
-- beside a confirmed account's `user_id` (create_guest, the two claims, capture_guest_email; see
-- database-security.md), and only the FK ever nulls `user_id`, so a row holding an address with no
-- account behind it lost that account to a deletion. Older unproved addresses the identity SQL gaps
-- (20260922200000) did not clear land here too, and nothing reads them either. `pending_email` is
-- deliberately untouched: a name-only guest's typed address lives on a row with no account BY
-- DESIGN, and it is theirs to claim.
--
-- The count, read-only, before the yes (it was 0 rows on the live project when this was written,
-- 2026-09-25, so today this moves nothing; it exists for any account deleted before the trigger):
--
--   select count(*) as rows_to_clear, count(distinct event_id) as events_touched
--     from public.guests
--    where user_id is null and email is not null;
--
-- No trigger is paused: guests carries no updated_at stamp, and album-pages' guests_album_note /
-- guests_album_stamp bump each touched event's attribution version once, which is right (an
-- attribution changed).
-- ============================================================================

update public.guests
   set email = null
 where user_id is null
   and email is not null;
