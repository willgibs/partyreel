-- EVENT PASS REMINDERS, A SWITCH OF THEIR OWN (Will, `emails` r1 `foot=commercial`, 2026-09-28).
-- The renewal nudge is the one mail that asks for a purchase, so it is the one that carries an
-- unsubscribe, and the unsubscribe is a switch in Email preferences: this column. The purge cron's
-- `renewal_nudges` reads it before it sends (src/lib/lifecycle/sweeps/passes.ts, through
-- resolveNotificationPrefs); the /account card writes it (setNotificationPrefs).
--
-- Tier 2 of the consent model (profiles-social.md): on by default, one switch per kind of mail,
-- account holders only. Rows are lazy, so the default IS the answer for every account without a row,
-- and NOTIFICATION_PREF_DEFAULTS.notifyPassRenewal mirrors it (notification-prefs.test.ts parses this
-- file for the parity).
--
-- One column and one grant; nothing dropped. The three columns for mail nothing sends
-- (notify_album_shared, notify_new_uploads_digest, notify_new_follower) stay: their switches leave
-- the card in this batch and no code reads or writes them any more, and dropping them is
-- destructive, so it waits for Will's yes.
--
-- A constant default adds the column without rewriting the table (Postgres 11+), so existing rows
-- read true at once.

alter table public.notification_prefs
  add column notify_pass_renewal boolean not null default true;

-- ★ ADDITIVE, NEVER A TABLE-LEVEL REVOKE (database-security.md, Gotchas): a revoke on the table would
-- cascade to every column grant the card writes and take Email preferences down. SELECT is already
-- table-level for authenticated (RLS scopes the row to its owner), so it reads the new column with
-- no grant; anon holds nothing on this table and gains nothing here; the service role's table-level
-- grant covers the sweep's read.
grant insert (notify_pass_renewal), update (notify_pass_renewal)
  on public.notification_prefs to authenticated;

comment on column public.notification_prefs.notify_pass_renewal is
  'Tier 2: Event Pass reminders, the renewal nudge two weeks before a pass expires. On by default; the account''s Email preferences switch; read by the renewal_nudges sweep before it sends.';
