-- =============================================================================================
-- SEND TO GOOGLE DRIVE: THE CONNECTION, THE SEND AND ITS LANES (lane `drive-wiring`, 2026-10-05; the design note
-- `_scratch/drive-export/design.md` sections 2 to 7 and 12, Advisor-reviewed in Q25 and Q27; the system doc
-- docs/systems/drive-export.md).
--
-- A host connects her Google account once (`drive.file` only); pressing Send makes a job of one row per original
-- in her album, snapshotted at the press by one statement; a Cloudflare Worker (`partyreel-drive`) streams each
-- original from R2 into a Google resumable upload. The Worker holds no database credential, no refresh token and
-- no key: it LEASES work and an hour of access from the app's signed internal routes and reports back the same
-- way, and the app calls the functions below on the service role. This file is the whole of the database's half:
--
--   1. cloud_connections (deny-all): one row an account and provider. The Google account's stable id (`sub`, never
--      the address, is the identity), "connected as", the token ciphertexts (AES-256-GCM sealed in the app under a
--      key only Vercel's env holds: the database keeps ciphertext alone), the refresh claim, the Partyreel folder,
--      and her lanes' pace (concurrency, Google's last "slow down", the last kick, the day's dead lanes).
--   2. cloud_event_folders (deny-all): (connection, event) -> the album's folder, so a second send lands beside the
--      first. It goes with the connection.
--   3. cloud_exports: one row a send. ★ THE ONE TABLE A CLIENT READS: its owner SELECTs her own rows (RLS) through a
--      column grant of exactly the progress columns, whole in this file (a later table-level revoke would cascade to
--      the column grants: database-security.md's trap). No folder id, no connection id.
--   4. cloud_export_items (deny-all): one row an original of a send. `media_id` has NO foreign key on purpose (a
--      purged item keeps its line, as reports.media_id does, so a send can say what left the album mid-way).
--      `session_uri` is a capability (a week to finish an upload with other bytes): deny-all is its containment.
--   5. cloud_export_leases (deny-all): a lane's claim on a batch (or on one page of the closing check), what "live
--      lanes" counts: a connection runs at most `concurrency` (3), however many albums she sends at once.
--   6. cloud_export_sent_hours (deny-all): what each connection uploaded, an hour a row, the rolling window behind
--      Google's 750 GB a day (we stop at 700), the account breaker's 30 days and the spend watch's reading. Keyed by
--      the connection with no foreign key and owned by the account, so a disconnect keeps the breaker's history.
--   7. The functions: every one SECURITY DEFINER, `search_path = ''`, the service role's alone (in neither advisor
--      list) but two helpers that are the owner's alone. Each returns one jsonb (never a set: nothing here can be cut
--      at PostgREST's 1,000 rows). ★ EVERY BODY THAT TOUCHES A SEND TAKES THE CONNECTION ROW FIRST (`for update`),
--      THEN ITEMS, THEN THE JOB: one order, no cycle. ★ They READ media and events and never lock or write either, so
--      the album protocol's lock order (the album row every transaction's last lock) is untouched.
--   8. The switch `drive_export_enabled`, seeded ON, read inside the lease's own transaction: a database that cannot
--      answer leases nothing.
--   9. spend_watch_readings, restated with one more section, `drive_bytes` (what reached Drive over the day).
--
-- ★ WHAT A SEND HOLDS IS HER DOWNLOAD PANEL'S ORIGINALS. The snapshot's predicate is `chosenRows`
--   (src/lib/export/build-manifest.ts) over what `media_host_all` lets her read: not removed, no permanent delete she
--   asked, and approved unless she turned on Include hidden items (hidden and waiting then go too); photographs still
--   sealed for a develop go, as in her zip. ★ A QUIET LEGAL HOLD IS NOT A FILTER: a held row takes the host's own
--   acts like any other and its hold is invisible to her by design (trust-safety-forensics.md); her zip includes it,
--   so a send that skipped it would be the one number where a hold shows. A takedown is an operator's removal, which
--   the predicate already leaves out. `drive-snapshot.test.ts` pins the predicate to chosenRows.
--
-- ★ SENDING AGAIN NEVER DUPLICATES AND NEVER LIES. A send takes the whole album; each item carries the file an earlier
--   send on this connection left (`prior_file_id`), which the Worker asks Drive for first and records as kept when it
--   is still there, whole and out of the bin, so "12 new since 3 Oct" sends twelve, and a file she deleted in her
--   Drive goes again (the Advisor's Q27 N2, met at the send itself now that the clean exit is dropped).
--
-- ★ NOTHING HERE DELETES ANYTHING OF HERS. There is no exit act (Will, desk 2: "Export is an off-ramp, never a
--   one-click exit"); `cloud_export_act` cancels, resumes, retries and acknowledges, and a send's words never
--   suggest deleting what it sent.
--
-- DEPLOYED BUILDS: nothing deployed names a new object, so partyreel.com and the alias run exactly as today; the
-- app that sends ships after this applies (its routes call these functions by name), and until the Worker is
-- deployed and Will's Google client exists, Send to Drive answers "not set up yet" in words.
--
-- LOCKS AT APPLY: six CREATE TABLEs, their indexes and policy (catalog only, empty tables), the functions (catalog
-- only), one ops_flags insert, and spend_watch_readings replaced (CREATE OR REPLACE: no caller waits on it). No hot
-- table is written; media, events and profiles gain inbound foreign keys only (a SHARE ROW EXCLUSIVE instant each).
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: none of the six tables, none of the functions and no `drive_export_enabled` row exists:
--         select tablename from pg_tables where schemaname = 'public' and tablename like 'cloud_%';   -- no rows
--         select proname from pg_proc where proname like 'cloud_%';                                     -- no rows
--         select key from public.ops_flags where key = 'drive_export_enabled';                          -- no rows
--       and spend_watch_readings is still 20261003190000's body (hash its prosrc against that file's).
--   (2) Apply verbatim.
--   (3) get_advisors (security): EXPECTED DELTA `rls_enabled_no_policy` 19 -> 24 (cloud_connections,
--       cloud_event_folders, cloud_export_items, cloud_export_leases, cloud_export_sent_hours), nothing in 0028 or
--       0029 (every function is the service role's or the owner's alone).
--   (4) Regenerate src/lib/db/types.ts (six tables and the functions join it), then drop the typed seam in
--       src/lib/db/queries/drive.ts (`untyped`).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

-- =============================================================================================
-- 1. cloud_connections
-- =============================================================================================
create table public.cloud_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'google_drive',
  -- From the ID token Google's own token endpoint returned over TLS (no signature check is needed for that).
  account_sub text not null,
  account_email text,
  email_verified boolean not null default false,
  account_name text,
  scopes text[] not null default '{}',
  -- The ciphertexts (`src/lib/drive/tokens.server.ts`): `v1.<key id>.<iv>.<sealed>`, opened only in Vercel.
  refresh_ct text,
  access_ct text,
  access_expires_at timestamptz,
  -- A time-based grant's end (`refresh_token_expires_in`): null for an ordinary grant.
  refresh_expires_at timestamptz,
  -- The refresh CLAIM: one caller at a time refreshes (a row lock cannot span Google's HTTP call).
  refresh_claimed_until timestamptz,
  -- The Partyreel folder in her Drive, made at her first send, never at connect.
  root_folder_id text,
  status text not null default 'connected',
  failing_since timestamptz,
  operator_paused_at timestamptz,
  operator_note text,
  -- Her lanes: at most this many at once; Google's "slow down" drops it to 2 for half an hour.
  concurrency smallint not null default 3,
  concurrency_until timestamptz,
  throttled_until timestamptz,
  -- When Google first said slow down without a success since: past two hours it reads as its daily cap.
  throttled_since timestamptz,
  kicked_at timestamptz,
  -- The day's dead lanes (a poison connection pauses itself at three, never loops).
  lane_failures smallint not null default 0,
  lane_failures_on date,
  lane_rekicked_at timestamptz,
  -- Drive full: since when, and when its room was last asked again (every 6 hours for 7 days).
  full_since timestamptz,
  full_checked_at timestamptz,
  -- about.get, cached a minute (a script pressing Send costs one limiter row a press, never a Google call).
  quota_limit bigint,
  quota_usage bigint,
  quota_at timestamptz,
  -- An operator's Lift of the account breaker: the 30-day sum counts only what reached Drive after it.
  breaker_lifted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_refresh_at timestamptz,
  last_error text,
  constraint cloud_connections_user_provider_key unique (user_id, provider),
  constraint cloud_connections_provider_known check (provider in ('google_drive')),
  constraint cloud_connections_status_known check (status in ('connected', 'failing', 'revoked')),
  constraint cloud_connections_sub_len check (char_length(account_sub) between 1 and 255),
  constraint cloud_connections_email_len check (account_email is null or char_length(account_email) <= 320),
  constraint cloud_connections_name_len check (account_name is null or char_length(account_name) <= 200),
  constraint cloud_connections_note_len check (operator_note is null or char_length(operator_note) <= 500),
  constraint cloud_connections_error_len check (last_error is null or char_length(last_error) <= 500),
  constraint cloud_connections_concurrency_range check (concurrency between 1 and 3),
  -- A live connection always holds its refresh token; a revoked one holds no token at all.
  constraint cloud_connections_tokens_by_status check (
    (status = 'revoked' and refresh_ct is null and access_ct is null)
    or (status <> 'revoked' and refresh_ct is not null)
  )
);

comment on table public.cloud_connections is
  'A host''s Google Drive connection (drive-export.md): the Google account''s sub (the identity) and address, the token ciphertexts (sealed in the app; Vercel alone opens them), the refresh claim, the Partyreel folder and her lanes'' pace. Deny-all: the service role alone, through the cloud_* functions.';

-- =============================================================================================
-- 2. cloud_event_folders
-- =============================================================================================
create table public.cloud_event_folders (
  connection_id uuid not null references public.cloud_connections (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  folder_id text not null,
  created_at timestamptz not null default now(),
  primary key (connection_id, event_id),
  constraint cloud_event_folders_folder_len check (char_length(folder_id) between 1 and 200)
);

comment on table public.cloud_event_folders is
  'The album''s folder in a connection''s Drive, so a second send lands beside the first. Goes with the connection. Deny-all.';

-- =============================================================================================
-- 3. cloud_exports: the one table a client reads (its owner, the progress columns)
-- =============================================================================================
create table public.cloud_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- SET NULL, never cascade: "sent to Drive on 3 Oct" outlives the album (the Advisor's N7), so the name rides here.
  event_id uuid references public.events (id) on delete set null,
  connection_id uuid references public.cloud_connections (id) on delete set null,
  album_name text not null,
  kind text not null default 'export',
  status text not null default 'preparing',
  pause_reason text,
  stop_reason text,
  resume_at timestamptz,
  include_hidden boolean not null default false,
  -- Her browser's zone at the press: the files' names say when each arrived, in her own time.
  tz text not null default 'UTC',
  items_total integer not null default 0,
  items_sent integer not null default 0,
  -- Of items_sent: already in her Drive from an earlier send, confirmed and kept rather than sent again.
  items_kept integer not null default 0,
  items_skipped integer not null default 0,
  items_failed integer not null default 0,
  items_duplicated integer not null default 0,
  bytes_total bigint not null default 0,
  bytes_sent bigint not null default 0,
  folder_id text,
  folder_url text,
  -- The closing check's cursor (media id order).
  check_after uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  resumed_at timestamptz,
  paused_at timestamptz,
  last_progress_at timestamptz,
  stuck_since timestamptz,
  closed_at timestamptz,
  -- A stop that needs her flags itself app-wide once (Will, desk 2): set at the stop, acknowledged by her app.
  attention_at timestamptz,
  attention_seen_at timestamptz,
  constraint cloud_exports_kind_known check (kind in ('export')),
  constraint cloud_exports_status_known check (
    status in ('preparing', 'sending', 'paused', 'checking', 'done', 'partly_done', 'canceled', 'stopped')
  ),
  constraint cloud_exports_pause_reason_known check (
    pause_reason is null
    or pause_reason in ('drive_full', 'daily_limit', 'disconnected', 'folder_gone', 'domain_policy', 'failing',
                        'breaker', 'operator')
  ),
  constraint cloud_exports_paused_with_reason check ((status = 'paused') = (pause_reason is not null)),
  constraint cloud_exports_stop_reason_known check (
    stop_reason is null
    or stop_reason in ('canceled', 'operator', 'disconnected', 'account_changed', 'album_deleted', 'expired',
                       'failed_to_start')
  ),
  constraint cloud_exports_stopped_with_reason check ((status in ('canceled', 'stopped')) = (stop_reason is not null)),
  constraint cloud_exports_album_name_len check (char_length(album_name) between 1 and 300),
  constraint cloud_exports_tz_len check (char_length(tz) between 1 and 64),
  constraint cloud_exports_counts_range check (
    items_total >= 0 and items_sent >= 0 and items_kept >= 0 and items_skipped >= 0 and items_failed >= 0
    and items_duplicated >= 0 and items_kept <= items_sent
    and items_sent + items_skipped + items_failed <= items_total
    and bytes_total >= 0 and bytes_sent >= 0
  )
);

comment on table public.cloud_exports is
  'One send of an album to a host''s Google Drive (drive-export.md). Its owner reads her own rows through RLS and a column grant of the progress columns alone; every write is a cloud_* function on the service role.';

-- One unfinished send per album and account: a second press opens the first.
create unique index cloud_exports_one_unfinished
  on public.cloud_exports (user_id, event_id)
  where status in ('preparing', 'sending', 'paused', 'checking');
create index cloud_exports_connection_idx on public.cloud_exports (connection_id, status, created_at);
create index cloud_exports_user_recent_idx on public.cloud_exports (user_id, created_at desc);
create index cloud_exports_open_idx on public.cloud_exports (status, created_at)
  where status in ('preparing', 'sending', 'paused', 'checking');

alter table public.cloud_exports enable row level security;

create policy cloud_exports_owner_select on public.cloud_exports
  for select to authenticated
  using (user_id = (select auth.uid()));

comment on policy cloud_exports_owner_select on public.cloud_exports is
  'A host reads her own sends (the strip, the dashboard''s marks, Account''s card, the app-wide flag), through the progress columns granted below and nothing else.';

-- ★ The progress columns, whole, here: never the connection, never a folder id, never the cursor.
grant select (
  id, event_id, album_name, kind, status, pause_reason, stop_reason, resume_at, include_hidden,
  items_total, items_sent, items_kept, items_skipped, items_failed, items_duplicated, bytes_total, bytes_sent,
  folder_url, created_at, started_at, last_progress_at, closed_at, attention_at, attention_seen_at
) on public.cloud_exports to authenticated;

-- =============================================================================================
-- 4. cloud_export_items
-- =============================================================================================
create table public.cloud_export_items (
  job_id uuid not null references public.cloud_exports (id) on delete cascade,
  -- No foreign key, on purpose: a purged item keeps its line (the send says what left the album mid-way).
  media_id uuid not null,
  -- Oldest first, so an album arrives in the evening's order.
  position integer not null,
  bytes bigint not null,
  status text not null default 'pending',
  -- Set at the lease (the one naming function, src/lib/export/drive-names.ts; the " (2)" here, against the names
  -- already kept for the album's folder).
  name text,
  attempts smallint not null default 0,
  not_before timestamptz,
  lease_token uuid,
  leased_until timestamptz,
  session_uri text,
  session_offset bigint,
  drive_file_id text,
  drive_md5 text,
  -- The MD5 the Worker computed where R2 kept none (a multipart clip): the one Worker-written input any check reads.
  worker_md5 text,
  kept boolean not null default false,
  missing_once boolean not null default false,
  skip_reason text,
  last_error text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  primary key (job_id, media_id),
  constraint cloud_export_items_status_known check (status in ('pending', 'leased', 'sent', 'skipped', 'failed')),
  constraint cloud_export_items_leased_with_token check ((status = 'leased') = (lease_token is not null)),
  constraint cloud_export_items_sent_with_file check (status <> 'sent' or drive_file_id is not null),
  constraint cloud_export_items_skip_reason_known check (
    skip_reason is null or skip_reason in ('gone', 'missing_object')
  ),
  constraint cloud_export_items_bytes_range check (bytes >= 0),
  constraint cloud_export_items_name_len check (name is null or char_length(name) between 1 and 400),
  constraint cloud_export_items_session_len check (session_uri is null or char_length(session_uri) <= 2048),
  constraint cloud_export_items_file_len check (drive_file_id is null or char_length(drive_file_id) <= 200),
  constraint cloud_export_items_md5_shape check (
    (drive_md5 is null or drive_md5 ~ '^[0-9a-f]{32}$') and (worker_md5 is null or worker_md5 ~ '^[0-9a-f]{32}$')
  ),
  constraint cloud_export_items_error_len check (last_error is null or char_length(last_error) <= 300)
);

comment on table public.cloud_export_items is
  'One original of a send to Google Drive, its state and its file. Deny-all: session_uri is a capability (a week to finish an upload).';

create index cloud_export_items_work_idx on public.cloud_export_items (job_id, position)
  where status in ('pending', 'leased');
create index cloud_export_items_lease_idx on public.cloud_export_items (lease_token)
  where lease_token is not null;
create index cloud_export_items_name_idx on public.cloud_export_items (job_id, name)
  where name is not null;
create index cloud_export_items_sent_media_idx on public.cloud_export_items (media_id)
  where status = 'sent';
create index cloud_export_items_check_idx on public.cloud_export_items (job_id, media_id)
  where status = 'sent';

-- =============================================================================================
-- 5. cloud_export_leases
-- =============================================================================================
create table public.cloud_export_leases (
  token uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.cloud_connections (id) on delete cascade,
  job_id uuid not null references public.cloud_exports (id) on delete cascade,
  kind text not null,
  leased_until timestamptz not null,
  created_at timestamptz not null default now(),
  constraint cloud_export_leases_kind_known check (kind in ('send', 'check'))
);

comment on table public.cloud_export_leases is
  'A lane''s claim on a batch of a send (or one page of its closing check): live while leased_until is ahead. A connection runs at most its concurrency of them. Deny-all.';

create index cloud_export_leases_live_idx on public.cloud_export_leases (connection_id, leased_until);
create index cloud_export_leases_job_idx on public.cloud_export_leases (job_id, kind, leased_until);

-- =============================================================================================
-- 6. cloud_export_sent_hours
-- =============================================================================================
create table public.cloud_export_sent_hours (
  -- No foreign key: a disconnect keeps the history the account breaker sums.
  connection_id uuid not null,
  hour timestamptz not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  bytes bigint not null default 0,
  files integer not null default 0,
  primary key (connection_id, hour),
  constraint cloud_export_sent_hours_range check (bytes >= 0 and files >= 0)
);

comment on table public.cloud_export_sent_hours is
  'What reached a connection''s Drive, an hour a row (uploads only, never a kept file): Google''s day, the account breaker''s 30 days and the spend watch''s reading. Deny-all.';

create index cloud_export_sent_hours_user_idx on public.cloud_export_sent_hours (user_id, hour);
create index cloud_export_sent_hours_hour_idx on public.cloud_export_sent_hours (hour);

-- =============================================================================================
-- Deny-all: RLS on, no policy, no client grant (new tables in public grant anon and authenticated nothing by
-- default since 20260929160000; the revokes restate it, so a drift in the defaults cannot open one).
-- =============================================================================================
alter table public.cloud_connections enable row level security;
alter table public.cloud_event_folders enable row level security;
alter table public.cloud_export_items enable row level security;
alter table public.cloud_export_leases enable row level security;
alter table public.cloud_export_sent_hours enable row level security;

revoke all on table public.cloud_connections, public.cloud_event_folders, public.cloud_export_items,
  public.cloud_export_leases, public.cloud_export_sent_hours from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.cloud_exports from anon, authenticated;
revoke select on table public.cloud_exports from anon;

-- =============================================================================================
-- 7. The functions
-- =============================================================================================

-- ── The two helpers, the owner's alone ──────────────────────────────────────────────────────────

-- Pause one send (p_job) or every running send of a connection (p_job null). A stop that needs her (Drive full,
-- disconnected, her admin's policy, the folder in her bin) flags itself app-wide; one that resumes by itself or is
-- ours to fix (Google's day, a dying lane, the breaker, an operator) stays quiet in place. Leases are left to run
-- out: a lane's next report answers `stop`, so it reports what it finished and releases the rest.
create function public.cloud_export_pause(p_connection uuid, p_job uuid, p_reason text, p_resume_at timestamptz)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  update public.cloud_exports j
     set status = 'paused',
         pause_reason = p_reason,
         paused_at = now(),
         resume_at = p_resume_at,
         attention_at = case
           when p_reason in ('drive_full', 'disconnected', 'domain_policy', 'folder_gone') then now()
           else j.attention_at
         end
   where j.status in ('sending', 'checking')
     and ((p_job is not null and j.id = p_job)
          or (p_job is null and j.connection_id = p_connection));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

comment on function public.cloud_export_pause(uuid, uuid, text, timestamptz) is
  'Pauses one send, or every running send of a connection, with its reason (and its app-wide flag when the reason needs her). The owner''s alone: read only inside the cloud_* bodies, each holding the connection row.';

-- Where a send stands once nothing of it is pending or leased: the closing check when anything went, else its end
-- (partly done when a file would not go, done otherwise; a file skipped because it left the album is no failure).
create function public.cloud_export_settle(p_job uuid)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_job public.cloud_exports%rowtype;
begin
  select * into v_job from public.cloud_exports j where j.id = p_job for update;
  if not found or v_job.status not in ('sending', 'checking') then
    return coalesce(v_job.status, 'missing');
  end if;
  if exists (select 1 from public.cloud_export_items i
              where i.job_id = p_job and i.status in ('pending', 'leased')) then
    return v_job.status;
  end if;
  if v_job.status = 'sending' and v_job.items_sent > 0 then
    update public.cloud_exports set status = 'checking', check_after = null where id = p_job;
    return 'checking';
  end if;
  update public.cloud_exports
     set status = case when v_job.items_failed > 0 then 'partly_done' else 'done' end,
         closed_at = now(),
         stuck_since = null,
         attention_at = case when v_job.items_failed > 0 then now() else null end
   where id = p_job;
  return case when v_job.items_failed > 0 then 'partly_done' else 'done' end;
end;
$$;

comment on function public.cloud_export_settle(uuid) is
  'Moves a send with nothing pending or leased to its closing check, or to done / partly_done. The owner''s alone, read inside the cloud_* bodies.';

-- ── The connection ──────────────────────────────────────────────────────────────────────────────

-- Her Google account, connected or connected again (the callback, after the code exchange and every check of the
-- token's scope, refresh token and ID token). The same Google account (`sub`) keeps the row and its id, takes the
-- new tokens and resumes what paused on it; ★ the replaced token is NOT revoked: Google revokes a token's whole grant
-- (user and client), which the new token rides. Another Google account replaces the row whole (a new id, so nothing
-- sent to the old account is mistaken for the new one's): its unfinished sends end ("your send to old@ stopped when
-- you connected new@"), its finished ones forget the old Drive's folder, and its refresh ciphertext comes back for
-- the app to revoke (a different grant).
create function public.cloud_connection_upsert(
  p_user uuid,
  p_sub text,
  p_email text,
  p_email_verified boolean,
  p_name text,
  p_scopes text[],
  p_refresh_ct text,
  p_access_ct text,
  p_access_expires_at timestamptz,
  p_refresh_expires_at timestamptz
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_old public.cloud_connections%rowtype;
  v_id uuid;
  v_resumed integer := 0;
  v_ended integer := 0;
begin
  if p_user is null or p_sub is null or p_refresh_ct is null then
    raise exception 'cloud_connection_upsert: user, sub and refresh token are required' using errcode = '22004';
  end if;

  select * into v_old from public.cloud_connections c
   where c.user_id = p_user and c.provider = 'google_drive'
   for update;

  if found and v_old.account_sub = p_sub then
    update public.cloud_connections
       set account_email = p_email,
           email_verified = coalesce(p_email_verified, false),
           account_name = p_name,
           scopes = coalesce(p_scopes, '{}'),
           refresh_ct = p_refresh_ct,
           access_ct = p_access_ct,
           access_expires_at = p_access_expires_at,
           refresh_expires_at = p_refresh_expires_at,
           refresh_claimed_until = null,
           status = 'connected',
           failing_since = null,
           last_error = null,
           last_refresh_at = now(),
           updated_at = now()
     where id = v_old.id;
    -- What paused on the connection resumes on it (a reconnect is the act "Reconnect" names).
    update public.cloud_exports j
       set status = 'sending', pause_reason = null, resume_at = null, resumed_at = now(), attention_at = null
     where j.connection_id = v_old.id and j.status = 'paused' and j.pause_reason in ('disconnected', 'failing');
    get diagnostics v_resumed = row_count;
    return jsonb_build_object('connection_id', v_old.id, 'outcome', 'same', 'resumed', v_resumed);
  end if;

  if found then
    -- Another Google account: the old one's unfinished sends end, its finished ones forget its folders.
    update public.cloud_exports j
       set status = 'canceled', stop_reason = 'account_changed', pause_reason = null, closed_at = now(),
           attention_at = null
     where j.connection_id = v_old.id and j.status in ('preparing', 'sending', 'paused', 'checking');
    get diagnostics v_ended = row_count;
    update public.cloud_exports j
       set folder_id = null, folder_url = null
     where j.connection_id = v_old.id;
    delete from public.cloud_connections where id = v_old.id;
  end if;

  insert into public.cloud_connections (
    user_id, provider, account_sub, account_email, email_verified, account_name, scopes,
    refresh_ct, access_ct, access_expires_at, refresh_expires_at, status, last_refresh_at
  ) values (
    p_user, 'google_drive', p_sub, p_email, coalesce(p_email_verified, false), p_name, coalesce(p_scopes, '{}'),
    p_refresh_ct, p_access_ct, p_access_expires_at, p_refresh_expires_at, 'connected', now()
  )
  returning id into v_id;

  return jsonb_build_object(
    'connection_id', v_id,
    'outcome', case when v_old.id is null then 'new' else 'other' end,
    'ended', v_ended,
    'old_refresh_ct', v_old.refresh_ct,
    'old_email', case when v_old.email_verified then v_old.account_email end
  );
end;
$$;

-- Disconnect (Account, an operator's for an account's recovery, account deletion): the row and its folders go, her
-- running sends end, her finished ones keep their counts and lose every Google identifier. The ciphertexts come back
-- so the app revokes at Google after the row is gone (a revoke Google does not answer never keeps a key here).
create function public.cloud_connection_disconnect(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_ended integer := 0;
begin
  select * into v_conn from public.cloud_connections c
   where c.user_id = p_user and c.provider = 'google_drive'
   for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  update public.cloud_exports j
     set status = 'canceled', stop_reason = 'disconnected', pause_reason = null, closed_at = now(),
         attention_at = null
   where j.connection_id = v_conn.id and j.status in ('preparing', 'sending', 'paused', 'checking');
  get diagnostics v_ended = row_count;
  update public.cloud_exports j
     set folder_id = null, folder_url = null
   where j.connection_id = v_conn.id;
  delete from public.cloud_connections where id = v_conn.id;
  return jsonb_build_object(
    'found', true,
    'connection_id', v_conn.id,
    'ended', v_ended,
    'refresh_ct', v_conn.refresh_ct,
    'access_ct', v_conn.access_ct
  );
end;
$$;

-- AN ACCESS TOKEN FOR A CALLER OUTSIDE A LEASE (the press's room check and folders, Check again, an operator's act):
-- the cached one while 20 minutes of it remain; else the refresh CLAIM, handed to the one caller that wins it for 30
-- seconds; else `wait` while another holds it (with the cached token when a slice's worth still remains).
create function public.cloud_connection_token(p_connection uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('state', 'missing');
  end if;
  if v_conn.status = 'revoked' then
    return jsonb_build_object('state', 'revoked');
  end if;
  if v_conn.access_ct is not null and v_conn.access_expires_at > now() + interval '20 minutes' then
    return jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                              'expires_at', v_conn.access_expires_at);
  end if;
  if v_conn.refresh_claimed_until > now() then
    if v_conn.access_ct is not null and v_conn.access_expires_at > now() + interval '2 minutes' then
      return jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                'expires_at', v_conn.access_expires_at);
    end if;
    return jsonb_build_object('state', 'wait');
  end if;
  update public.cloud_connections
     set refresh_claimed_until = now() + interval '30 seconds'
   where id = p_connection;
  return jsonb_build_object('state', 'refresh', 'refresh_ct', v_conn.refresh_ct);
end;
$$;

-- A refresh that worked: the new access token (and the refresh token re-sealed under the current key, or one Google
-- rotated), the claim cleared, the connection healthy again.
create function public.cloud_connection_refreshed(
  p_connection uuid,
  p_access_ct text,
  p_access_expires_at timestamptz,
  p_refresh_ct text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.cloud_connections
     set access_ct = p_access_ct,
         access_expires_at = p_access_expires_at,
         refresh_ct = coalesce(p_refresh_ct, refresh_ct),
         refresh_claimed_until = null,
         last_refresh_at = now(),
         status = case when status = 'failing' and (refresh_expires_at is null or refresh_expires_at > now() + interval '1 day')
                       then 'connected' else status end,
         failing_since = case when status = 'failing' and (refresh_expires_at is null or refresh_expires_at > now() + interval '1 day')
                              then null else failing_since end,
         last_error = null,
         updated_at = now()
   where id = p_connection and status <> 'revoked';
  return jsonb_build_object('ok', found);
end;
$$;

-- A refresh that failed. `p_revoked` (Google answered invalid_grant: she removed Partyreel, six months unused, a
-- time-based grant ran out, a key neither of ours opens): the tokens are wiped at once, her sends pause
-- `disconnected`, and `first` says whether this is news (one reconnect mail). Otherwise the connection reads
-- `failing` (retried by the next lease), and after a day of it her sends pause `disconnected` too.
create function public.cloud_connection_refresh_failed(p_connection uuid, p_error text, p_revoked boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_paused integer := 0;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if p_revoked then
    update public.cloud_connections
       set status = 'revoked', refresh_ct = null, access_ct = null, access_expires_at = null,
           refresh_claimed_until = null, last_error = left(p_error, 500), updated_at = now()
     where id = p_connection;
    v_paused := public.cloud_export_pause(p_connection, null, 'disconnected', null);
    return jsonb_build_object('found', true, 'first', v_conn.status <> 'revoked', 'paused', v_paused,
                              'user_id', v_conn.user_id);
  end if;
  update public.cloud_connections
     set status = case when status = 'revoked' then status else 'failing' end,
         failing_since = coalesce(failing_since, now()),
         refresh_claimed_until = null,
         last_error = left(p_error, 500),
         updated_at = now()
   where id = p_connection;
  if v_conn.failing_since is not null and v_conn.failing_since < now() - interval '24 hours' then
    v_paused := public.cloud_export_pause(p_connection, null, 'disconnected', null);
  end if;
  return jsonb_build_object('found', true, 'first', v_conn.status = 'connected', 'paused', v_paused,
                            'user_id', v_conn.user_id);
end;
$$;

-- Her Drive's room, as about.get answered it (cached a minute), and, when asked, the sends that paused on a full
-- Drive resume once it holds what they have left to send (plus 1%). No limit (an unlimited or a pooled Workspace
-- Drive) holds anything.
create function public.cloud_connection_room(p_connection uuid, p_limit bigint, p_usage bigint, p_resume boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_left bigint;
  v_resumed integer := 0;
begin
  perform 1 from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  update public.cloud_connections
     set quota_limit = p_limit, quota_usage = p_usage, quota_at = now(),
         full_checked_at = case when full_since is not null then now() else full_checked_at end
   where id = p_connection;
  select coalesce(sum(greatest(j.bytes_total - j.bytes_sent, 0)), 0)::bigint into v_left
    from public.cloud_exports j
   where j.connection_id = p_connection and j.status = 'paused' and j.pause_reason = 'drive_full';
  if p_resume and (p_limit is null or p_limit - coalesce(p_usage, 0) >= v_left + v_left / 100) then
    update public.cloud_exports j
       set status = 'sending', pause_reason = null, resume_at = null, resumed_at = now(), attention_at = null
     where j.connection_id = p_connection and j.status = 'paused' and j.pause_reason = 'drive_full';
    get diagnostics v_resumed = row_count;
    update public.cloud_connections set full_since = null, full_checked_at = null where id = p_connection;
  end if;
  return jsonb_build_object('found', true, 'left', v_left, 'resumed', v_resumed);
end;
$$;

-- The Partyreel folder, compare-and-set: a caller that made a new one takes the place only while the place still
-- holds what it saw, so two presses at once leave one folder (the loser undoes its own empty folder by the id
-- Google just returned).
create function public.cloud_connection_root(p_connection uuid, p_candidate text, p_expected text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_root text;
begin
  select c.root_folder_id into v_root from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if v_root is not distinct from p_expected and p_candidate is not null then
    update public.cloud_connections set root_folder_id = p_candidate, updated_at = now() where id = p_connection;
    -- The albums' folders lived under the root that is gone: each is asked again at its next send.
    if p_expected is not null then
      delete from public.cloud_event_folders f where f.connection_id = p_connection;
    end if;
    return jsonb_build_object('found', true, 'root', p_candidate, 'won', true);
  end if;
  return jsonb_build_object('found', true, 'root', v_root, 'won', false);
end;
$$;

-- HOW MANY LANES TO ADD: her concurrency minus the live ones, at most once a minute (a lane on its way holds no
-- lease yet), and none for a connection with nothing running, paused by an operator, revoked or switched off.
create function public.cloud_connection_kick(p_connection uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_live integer;
  v_lanes integer;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found or v_conn.status = 'revoked' or v_conn.operator_paused_at is not null then
    return jsonb_build_object('lanes', 0);
  end if;
  if not coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true) then
    return jsonb_build_object('lanes', 0);
  end if;
  if v_conn.kicked_at > now() - interval '1 minute' then
    return jsonb_build_object('lanes', 0);
  end if;
  if not exists (select 1 from public.cloud_exports j
                  where j.connection_id = p_connection and j.status in ('sending', 'checking')) then
    return jsonb_build_object('lanes', 0);
  end if;
  select count(*) into v_live from public.cloud_export_leases l
   where l.connection_id = p_connection and l.leased_until > now();
  v_lanes := greatest(v_conn.concurrency - v_live, 0);
  if v_lanes > 0 then
    update public.cloud_connections set kicked_at = now() where id = p_connection;
  end if;
  return jsonb_build_object('lanes', v_lanes);
end;
$$;

-- An operator's hand on a connection (/admin/exports): pause it whole (every lease answers `paused`), resume it
-- (and what paused on it for a dying lane or the operator), or lift the account breaker (the 30-day sum restarts).
create function public.cloud_connection_operator(p_connection uuid, p_act text, p_note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_n integer := 0;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if p_act = 'pause' then
    update public.cloud_connections
       set operator_paused_at = now(), operator_note = left(p_note, 500), updated_at = now()
     where id = p_connection;
    v_n := public.cloud_export_pause(p_connection, null, 'operator', null);
  elsif p_act = 'resume' then
    update public.cloud_connections
       set operator_paused_at = null, operator_note = null, lane_failures = 0, lane_failures_on = null,
           updated_at = now()
     where id = p_connection;
    update public.cloud_exports j
       set status = 'sending', pause_reason = null, resume_at = null, resumed_at = now()
     where j.connection_id = p_connection and j.status = 'paused' and j.pause_reason in ('operator', 'failing');
    get diagnostics v_n = row_count;
  elsif p_act = 'lift_breaker' then
    update public.cloud_connections set breaker_lifted_at = now(), updated_at = now() where id = p_connection;
    update public.cloud_exports j
       set status = 'sending', pause_reason = null, resume_at = null, resumed_at = now()
     where j.user_id = v_conn.user_id and j.status = 'paused' and j.pause_reason = 'breaker';
    get diagnostics v_n = row_count;
  else
    raise exception 'cloud_connection_operator: unknown act %', p_act using errcode = '22023';
  end if;
  return jsonb_build_object('ok', true, 'jobs', v_n, 'user_id', v_conn.user_id);
end;
$$;

-- ── The send ────────────────────────────────────────────────────────────────────────────────────

-- WHAT A SEND WOULD TAKE, per album (the panel's final press, the dashboard's picker, the room check before a
-- press): its originals and their bytes, and how many of them are new to this connection's Drive. Albums not hers,
-- or in Deleted, are simply absent. At most 200 albums an ask.
create function public.cloud_export_preview(p_user uuid, p_events uuid[], p_include_hidden boolean)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conn uuid;
  v_out jsonb;
begin
  if p_events is null or cardinality(p_events) = 0 then
    return jsonb_build_object('albums', '{}'::jsonb);
  end if;
  if cardinality(p_events) > 200 then
    raise exception 'cloud_export_preview: at most 200 albums an ask' using errcode = '22023';
  end if;
  select c.id into v_conn from public.cloud_connections c where c.user_id = p_user and c.provider = 'google_drive';

  select coalesce(jsonb_object_agg(a.event_id, jsonb_build_object(
           'name', a.name,
           'event_date', a.event_date,
           'event_end_date', a.event_end_date,
           'items', a.items,
           'bytes', a.bytes,
           'photos', a.photos,
           'clips', a.clips,
           'new_items', a.new_items,
           'new_bytes', a.new_bytes,
           'sent_before', a.sent_before,
           'unfinished', a.unfinished
         )), '{}'::jsonb)
    into v_out
    from (
      select e.id as event_id, e.name, e.event_date, e.event_end_date,
             count(m.id)::integer as items,
             coalesce(sum(m.file_size_bytes), 0)::bigint as bytes,
             count(m.id) filter (where m.type = 'photo')::integer as photos,
             count(m.id) filter (where m.type = 'video')::integer as clips,
             count(m.id) filter (where p.media_id is null)::integer as new_items,
             coalesce(sum(m.file_size_bytes) filter (where p.media_id is null), 0)::bigint as new_bytes,
             (select max(j.created_at) from public.cloud_exports j
               where j.user_id = p_user and j.event_id = e.id and j.connection_id = v_conn
                 and j.items_sent > 0) as sent_before,
             (select j.id from public.cloud_exports j
               where j.user_id = p_user and j.event_id = e.id
                 and j.status in ('preparing', 'sending', 'paused', 'checking')) as unfinished
        from public.events e
        left join public.media m
          on m.event_id = e.id
         -- ★ chosenRows over media_host_all (drive-snapshot.test.ts holds the two equal).
         and m.status <> 'removed'
         and m.purge_asked_at is null
         and (p_include_hidden or m.status = 'approved')
        left join lateral (
          select i.media_id
            from public.cloud_export_items i
            join public.cloud_exports j on j.id = i.job_id
           where i.media_id = m.id and i.status = 'sent' and j.connection_id = v_conn
           limit 1
        ) p on v_conn is not null
       where e.id = any (p_events) and e.host_id = p_user and e.deleted_at is null
       group by e.id, e.name, e.event_date, e.event_end_date
    ) a;
  return jsonb_build_object('albums', v_out, 'connected', v_conn is not null);
end;
$$;

-- THE PRESS: one send of an album, its snapshot in ONE statement (no row read into Vercel, nothing cut at 1,000), in
-- `preparing` until the app has its folder (`cloud_export_ready`). A second press opens the first unfinished one.
-- Refused, in a code the route words: the switch off, no connection (or a revoked or paused one), not her album or in
-- Deleted, the account breaker. An empty album ends `done` at once.
create function public.cloud_export_create(p_user uuid, p_event uuid, p_include_hidden boolean, p_tz text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_event record;
  v_existing uuid;
  v_job uuid;
  v_items integer;
  v_bytes bigint;
  v_tz text := 'UTC';
  v_cap bigint;
  v_sent30 bigint;
  v_folder text;
begin
  if not coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true) then
    return jsonb_build_object('ok', false, 'code', 'switch_off');
  end if;

  select * into v_conn from public.cloud_connections c
   where c.user_id = p_user and c.provider = 'google_drive'
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_connected');
  end if;
  if v_conn.status = 'revoked' then
    return jsonb_build_object('ok', false, 'code', 'disconnected');
  end if;
  if v_conn.operator_paused_at is not null then
    return jsonb_build_object('ok', false, 'code', 'paused');
  end if;

  select e.id, e.name, e.event_date, e.event_end_date into v_event
    from public.events e
   where e.id = p_event and e.host_id = p_user and e.deleted_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  select j.id into v_existing from public.cloud_exports j
   where j.user_id = p_user and j.event_id = p_event
     and j.status in ('preparing', 'sending', 'paused', 'checking');
  if found then
    return jsonb_build_object('ok', true, 'job_id', v_existing, 'existing', true);
  end if;

  -- THE ACCOUNT BREAKER (PRICING's rule 2): ten times her plan's room, never under 5 GB, in any 30 days, since an
  -- operator's last Lift. A plan with no cap on record yet is unmetered (the webhook writes it), failing open.
  select coalesce(pr.storage_cap_bytes, l.default_storage_cap_bytes) into v_cap
    from public.profiles pr
    cross join lateral public.tier_limits(pr.tier) l
   where pr.id = p_user;
  if v_cap is not null then
    select coalesce(sum(h.bytes), 0)::bigint into v_sent30
      from public.cloud_export_sent_hours h
     where h.user_id = p_user
       and h.hour > greatest(now() - interval '30 days', coalesce(v_conn.breaker_lifted_at, '-infinity'::timestamptz));
    if v_sent30 >= greatest(10 * v_cap, 5::bigint * 1024 * 1024 * 1024) then
      return jsonb_build_object('ok', false, 'code', 'breaker');
    end if;
  end if;

  if p_tz is not null and exists (select 1 from pg_catalog.pg_timezone_names z where z.name = p_tz) then
    v_tz := p_tz;
  end if;

  insert into public.cloud_exports (user_id, event_id, connection_id, album_name, status, include_hidden, tz)
  values (p_user, p_event, v_conn.id, left(v_event.name, 300), 'preparing', coalesce(p_include_hidden, false), v_tz)
  returning id into v_job;

  -- ★ THE SNAPSHOT: chosenRows over media_host_all, oldest first (drive-snapshot.test.ts pins the predicate).
  insert into public.cloud_export_items (job_id, media_id, position, bytes)
  select v_job, m.id, (row_number() over (order by m.created_at, m.id))::integer, m.file_size_bytes
    from public.media m
   where m.event_id = p_event
     and m.status <> 'removed'
     and m.purge_asked_at is null
     and (coalesce(p_include_hidden, false) or m.status = 'approved');
  get diagnostics v_items = row_count;

  select coalesce(sum(i.bytes), 0)::bigint into v_bytes from public.cloud_export_items i where i.job_id = v_job;

  if v_items = 0 then
    update public.cloud_exports
       set status = 'done', items_total = 0, bytes_total = 0, started_at = now(), closed_at = now()
     where id = v_job;
    return jsonb_build_object('ok', true, 'job_id', v_job, 'empty', true);
  end if;

  update public.cloud_exports set items_total = v_items, bytes_total = v_bytes where id = v_job;

  select f.folder_id into v_folder from public.cloud_event_folders f
   where f.connection_id = v_conn.id and f.event_id = p_event;

  return jsonb_build_object(
    'ok', true,
    'job_id', v_job,
    'connection_id', v_conn.id,
    'items', v_items,
    'bytes', v_bytes,
    'album_name', v_event.name,
    'event_date', v_event.event_date,
    'event_end_date', v_event.event_end_date,
    'root_folder_id', v_conn.root_folder_id,
    'folder_id', v_folder
  );
end;
$$;

-- THE FOLDER, MADE: a `preparing` send gets the album's folder and starts (`sending`); the folder is kept for the
-- album's next send on this connection.
create function public.cloud_export_ready(p_job uuid, p_folder_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn uuid;
  v_job public.cloud_exports%rowtype;
begin
  select j.connection_id into v_conn from public.cloud_exports j where j.id = p_job;
  if v_conn is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  perform 1 from public.cloud_connections c where c.id = v_conn for update;
  select * into v_job from public.cloud_exports j where j.id = p_job for update;
  if v_job.status <> 'preparing' or p_folder_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_preparing', 'status', v_job.status);
  end if;
  if v_job.event_id is not null then
    insert into public.cloud_event_folders (connection_id, event_id, folder_id)
    values (v_conn, v_job.event_id, p_folder_id)
    on conflict (connection_id, event_id) do update set folder_id = excluded.folder_id;
  end if;
  update public.cloud_exports
     set status = 'sending',
         folder_id = p_folder_id,
         folder_url = 'https://drive.google.com/drive/folders/' || p_folder_id,
         started_at = now()
   where id = p_job;
  return jsonb_build_object('ok', true, 'connection_id', v_conn);
end;
$$;

-- THE LEASE (`/api/internal/drive/lease`, a lane asking for work). The connection row first; then the switch, the
-- connection's own state, Google's "slow down", her live lanes, Google's day; then the oldest send with work: a batch
-- of at most 10 originals or 1 GiB (always one), each re-read against media (a row gone or removed is skipped, never
-- sent), or one page of a closing check; and the access token: the cached one, or the refresh claimed for this call.
-- An album gone to Deleted ends its send. Answers: work, check, wait, paused, stopped, throttled, idle.
create function public.cloud_export_lease(p_connection uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_now constant timestamptz := now();
  c_lease constant interval := interval '15 minutes';
  c_max_items constant integer := 10;
  c_max_bytes constant bigint := 1073741824;
  c_daily_cap constant bigint := 700::bigint * 1024 * 1024 * 1024;
  v_conn public.cloud_connections%rowtype;
  v_live integer;
  v_sent24 bigint;
  v_first_hour timestamptz;
  v_access jsonb;
  v_claim boolean := false;
  v_job public.cloud_exports%rowtype;
  v_event record;
  v_ids uuid[];
  v_gone integer;
  v_count integer;
  v_token uuid;
  v_items jsonb;
  v_tries integer;
begin
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('state', 'stopped', 'why', 'no_connection');
  end if;
  if not coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true) then
    return jsonb_build_object('state', 'paused', 'why', 'switch');
  end if;
  if v_conn.status = 'revoked' then
    return jsonb_build_object('state', 'paused', 'why', 'disconnected');
  end if;
  if v_conn.operator_paused_at is not null then
    return jsonb_build_object('state', 'paused', 'why', 'operator');
  end if;
  if v_conn.throttled_until > c_now then
    return jsonb_build_object('state', 'throttled', 'until', v_conn.throttled_until);
  end if;
  -- A quiet half hour gives her lanes back.
  if v_conn.concurrency < 3 and (v_conn.concurrency_until is null or v_conn.concurrency_until <= c_now) then
    update public.cloud_connections set concurrency = 3, concurrency_until = null where id = p_connection;
    v_conn.concurrency := 3;
  end if;

  select count(*) into v_live from public.cloud_export_leases l
   where l.connection_id = p_connection and l.leased_until > c_now;
  if v_live >= v_conn.concurrency then
    return jsonb_build_object('state', 'wait', 'why', 'lanes');
  end if;

  -- The token, decided before any work is taken: a refresh another caller is making means wait.
  if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '20 minutes' then
    v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                   'expires_at', v_conn.access_expires_at);
  elsif v_conn.refresh_claimed_until > c_now then
    if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '12 minutes' then
      v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                     'expires_at', v_conn.access_expires_at);
    else
      return jsonb_build_object('state', 'wait', 'why', 'refresh');
    end if;
  else
    v_claim := true;
    v_access := jsonb_build_object('state', 'refresh', 'refresh_ct', v_conn.refresh_ct);
  end if;

  -- Google's day: what this connection uploaded over the last 24 hours, stopped at 700 GB of its 750.
  select coalesce(sum(h.bytes), 0)::bigint, min(h.hour) into v_sent24, v_first_hour
    from public.cloud_export_sent_hours h
   where h.connection_id = p_connection and h.hour > c_now - interval '24 hours';
  if v_sent24 >= c_daily_cap then
    perform public.cloud_export_pause(p_connection, null, 'daily_limit', v_first_hour + interval '25 hours');
    return jsonb_build_object('state', 'paused', 'why', 'daily_limit');
  end if;

  for v_job in
    select j.* from public.cloud_exports j
     where j.connection_id = p_connection and j.status in ('sending', 'checking')
     order by j.created_at, j.id
  loop
    -- The album itself: gone to Deleted, purged or no longer hers ends the send.
    select e.deleted_at, e.host_id into v_event from public.events e where e.id = v_job.event_id;
    if v_job.event_id is null or not found or v_event.deleted_at is not null or v_event.host_id <> v_job.user_id then
      update public.cloud_exports
         set status = 'canceled', stop_reason = 'album_deleted', pause_reason = null, closed_at = c_now,
             attention_at = null
       where id = v_job.id;
      continue;
    end if;

    if v_job.status = 'checking' then
      if exists (select 1 from public.cloud_export_leases l
                  where l.job_id = v_job.id and l.kind = 'check' and l.leased_until > c_now) then
        continue;
      end if;
      select coalesce(jsonb_agg(jsonb_build_object(
               'media_id', s.media_id,
               'file_id', s.drive_file_id,
               'bytes', s.bytes,
               'md5', s.md5
             ) order by s.media_id), '[]'::jsonb)
        into v_items
        from (
          select i.media_id, i.drive_file_id, i.bytes, coalesce(i.drive_md5, i.worker_md5) as md5
            from public.cloud_export_items i
           where i.job_id = v_job.id and i.status = 'sent'
             and (v_job.check_after is null or i.media_id > v_job.check_after)
           order by i.media_id
           limit 100
        ) s;
      if jsonb_array_length(v_items) = 0 then
        perform public.cloud_export_settle(v_job.id);
        continue;
      end if;
      v_token := gen_random_uuid();
      insert into public.cloud_export_leases (token, connection_id, job_id, kind, leased_until)
      values (v_token, p_connection, v_job.id, 'check', c_now + c_lease);
      if v_claim then
        update public.cloud_connections set refresh_claimed_until = c_now + interval '30 seconds' where id = p_connection;
      end if;
      return jsonb_build_object(
        'state', 'check',
        'lease', v_token,
        'until', c_now + c_lease,
        'job_id', v_job.id,
        'folder_id', v_job.folder_id,
        'first', v_job.check_after is null,
        'items', v_items,
        'access', v_access
      );
    end if;

    -- A send: a batch of what is due, oldest first, re-read against media as it is taken.
    v_tries := 0;
    v_count := 0;
    loop
      v_tries := v_tries + 1;
      select coalesce(array_agg(s.media_id order by s.position), '{}') into v_ids
        from (
          select p.media_id, p.position,
                 row_number() over (order by p.position) as rn,
                 sum(p.bytes) over (order by p.position) as running
            from (
              select i.media_id, i.position, i.bytes
                from public.cloud_export_items i
               where i.job_id = v_job.id
                 and (i.status = 'pending' or (i.status = 'leased' and i.leased_until <= c_now))
                 and (i.not_before is null or i.not_before <= c_now)
               order by i.position
               limit c_max_items
               for update skip locked
            ) p
        ) s
       where s.rn = 1 or (s.running <= c_max_bytes and v_sent24 + s.running <= c_daily_cap);
      exit when cardinality(v_ids) = 0;

      with gone as (
        update public.cloud_export_items i
           set status = 'skipped', skip_reason = 'gone', lease_token = null, leased_until = null, session_uri = null,
               session_offset = null
         where i.job_id = v_job.id
           and i.media_id = any (v_ids)
           and not exists (
             select 1 from public.media m
              where m.id = i.media_id and m.event_id = v_job.event_id
                and m.status <> 'removed' and m.purge_asked_at is null
           )
        returning 1
      )
      select count(*) into v_gone from gone;
      if v_gone > 0 then
        update public.cloud_exports set items_skipped = items_skipped + v_gone where id = v_job.id;
      end if;

      v_token := gen_random_uuid();
      update public.cloud_export_items i
         set status = 'leased', lease_token = v_token, leased_until = c_now + c_lease, attempts = i.attempts + 1
       where i.job_id = v_job.id and i.media_id = any (v_ids) and i.status in ('pending', 'leased');
      get diagnostics v_count = row_count;
      exit when v_count > 0 or v_tries >= 5;
    end loop;

    if v_count = 0 then
      -- Nothing due: everything left is in other lanes' hands or waiting out a backoff, or nothing is left.
      perform public.cloud_export_settle(v_job.id);
      continue;
    end if;

    insert into public.cloud_export_leases (token, connection_id, job_id, kind, leased_until)
    values (v_token, p_connection, v_job.id, 'send', c_now + c_lease);

    select jsonb_agg(jsonb_build_object(
             'media_id', i.media_id,
             'key', m.original_key,
             'bytes', m.file_size_bytes,
             'type', m.type,
             'created_at', m.created_at,
             'name', i.name,
             'attempts', i.attempts,
             'session_uri', i.session_uri,
             'session_offset', i.session_offset,
             'prior_file_id', (
               select pi.drive_file_id
                 from public.cloud_export_items pi
                 join public.cloud_exports pj on pj.id = pi.job_id
                where pi.media_id = i.media_id and pi.status = 'sent' and pj.connection_id = p_connection
                  and pj.id <> v_job.id
                order by pi.sent_at desc nulls last
                limit 1
             )
           ) order by i.position)
      into v_items
      from public.cloud_export_items i
      join public.media m on m.id = i.media_id
     where i.lease_token = v_token;

    if v_claim then
      update public.cloud_connections set refresh_claimed_until = c_now + interval '30 seconds' where id = p_connection;
    end if;
    return jsonb_build_object(
      'state', 'work',
      'lease', v_token,
      'until', c_now + c_lease,
      'job_id', v_job.id,
      'user_id', v_job.user_id,
      'event_id', v_job.event_id,
      'album_name', v_job.album_name,
      'tz', v_job.tz,
      'folder_id', v_job.folder_id,
      'items', v_items,
      'access', v_access
    );
  end loop;

  return jsonb_build_object('state', 'idle');
end;
$$;

-- THE NAMES, set at the lease: the app sends each item's stem ("2026-09-12 21.14.05 · Priya", its one naming
-- function) and extension, and this keeps the first free name in the album's folder, adding " (2)", " (3)" against
-- the names already kept for that folder (every send of the album on this connection). Only an unnamed item this
-- lease holds is named; a name, once kept, never changes (a resumed upload already carries it).
create function public.cloud_export_name_items(p_lease uuid, p_names jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_lease public.cloud_export_leases%rowtype;
  v_job public.cloud_exports%rowtype;
  v_entry jsonb;
  v_media uuid;
  v_stem text;
  v_ext text;
  v_name text;
  v_n integer;
  v_out jsonb := '{}'::jsonb;
begin
  select * into v_lease from public.cloud_export_leases l where l.token = p_lease;
  if not found or v_lease.leased_until <= now() then
    return jsonb_build_object('ok', false, 'names', v_out);
  end if;
  perform 1 from public.cloud_connections c where c.id = v_lease.connection_id for update;
  select * into v_job from public.cloud_exports j where j.id = v_lease.job_id;

  for v_entry in select * from jsonb_array_elements(coalesce(p_names, '[]'::jsonb))
  loop
    v_media := (v_entry ->> 'media_id')::uuid;
    v_stem := btrim(regexp_replace(coalesce(v_entry ->> 'stem', ''), '[[:cntrl:]]', '', 'g'));
    v_ext := lower(coalesce(v_entry ->> 'ext', ''));
    if v_stem = '' or v_ext !~ '^[a-z0-9]{1,8}$' then
      continue;
    end if;
    v_stem := left(v_stem, 300);
    perform 1 from public.cloud_export_items i
     where i.job_id = v_lease.job_id and i.media_id = v_media and i.lease_token = p_lease and i.name is null
     for update;
    if not found then
      continue;
    end if;
    v_n := 1;
    loop
      v_name := v_stem || case when v_n = 1 then '' else ' (' || v_n || ')' end || '.' || v_ext;
      exit when not exists (
        select 1
          from public.cloud_export_items oi
          join public.cloud_exports oj on oj.id = oi.job_id
         where oj.connection_id = v_lease.connection_id
           and oj.event_id is not distinct from v_job.event_id
           and oi.name = v_name
      );
      v_n := v_n + 1;
    end loop;
    update public.cloud_export_items set name = v_name where job_id = v_lease.job_id and media_id = v_media;
    v_out := v_out || jsonb_build_object(v_media::text, v_name);
  end loop;
  return jsonb_build_object('ok', true, 'names', v_out);
end;
$$;

-- THE REPORT (`/api/internal/drive/report`, every 10 seconds and at a slice's end), keyed by the lease token: a dead
-- lease's word is ignored (its items may be another lane's now), so a replay changes nothing and a `sent` stays sent.
-- Each item: sent (Drive's file id and MD5; `kept` when an earlier send's file was confirmed instead), progress (a big
-- file's session and Google's offset, which also keeps the lease), failed (backed off 1, 5, 30, 60 minutes; failed
-- for good after 5 attempts), skipped (gone, or its original missing in R2), released (back to pending, the attempt
-- not counted). A connection-level finding rides it and pauses or slows every send of the connection. Answers `stop`
-- once the send is no longer sending (canceled, paused, switched off), so a lane stops within ten seconds.
create function public.cloud_export_report(p_lease uuid, p_items jsonb, p_finding text default null, p_done boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_now constant timestamptz := now();
  v_lease public.cloud_export_leases%rowtype;
  v_conn public.cloud_connections%rowtype;
  v_job public.cloud_exports%rowtype;
  v_entry jsonb;
  v_item public.cloud_export_items%rowtype;
  v_outcome text;
  v_kept boolean;
  v_sent integer := 0;
  v_kept_n integer := 0;
  v_failed integer := 0;
  v_skipped integer := 0;
  v_sent_bytes bigint := 0;
  v_up_bytes bigint := 0;
  v_up_files integer := 0;
  v_moved boolean := false;
  v_signal text;
  v_before text;
  v_status text;
  v_stop boolean;
begin
  select * into v_lease from public.cloud_export_leases l where l.token = p_lease;
  if not found then
    return jsonb_build_object('state', 'stop', 'why', 'no_lease');
  end if;
  select * into v_conn from public.cloud_connections c where c.id = v_lease.connection_id for update;
  if not found then
    return jsonb_build_object('state', 'stop', 'why', 'no_connection');
  end if;
  if v_lease.leased_until <= c_now or v_lease.kind <> 'send' then
    return jsonb_build_object('state', 'stop', 'why', 'expired');
  end if;
  select * into v_job from public.cloud_exports j where j.id = v_lease.job_id;
  v_before := v_job.status;

  for v_entry in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    select * into v_item from public.cloud_export_items i
     where i.job_id = v_lease.job_id and i.media_id = (v_entry ->> 'media_id')::uuid
       and i.lease_token = p_lease and i.status = 'leased'
     for update;
    if not found then
      continue;
    end if;
    v_outcome := v_entry ->> 'outcome';
    if v_outcome = 'sent' and coalesce(v_entry ->> 'file_id', '') <> '' then
      v_kept := coalesce((v_entry ->> 'kept')::boolean, false);
      update public.cloud_export_items
         set status = 'sent',
             drive_file_id = left(v_entry ->> 'file_id', 200),
             drive_md5 = case when (v_entry ->> 'md5') ~ '^[0-9a-f]{32}$' then v_entry ->> 'md5' end,
             worker_md5 = case when (v_entry ->> 'worker_md5') ~ '^[0-9a-f]{32}$' then v_entry ->> 'worker_md5' end,
             kept = v_kept,
             sent_at = c_now,
             lease_token = null, leased_until = null, session_uri = null, session_offset = null, last_error = null
       where job_id = v_item.job_id and media_id = v_item.media_id;
      v_sent := v_sent + 1;
      v_sent_bytes := v_sent_bytes + v_item.bytes;
      if v_kept then
        v_kept_n := v_kept_n + 1;
      else
        v_up_bytes := v_up_bytes + v_item.bytes;
        v_up_files := v_up_files + 1;
      end if;
      v_moved := true;
    elsif v_outcome = 'progress' then
      update public.cloud_export_items
         set session_uri = left(v_entry ->> 'session_uri', 2048),
             session_offset = greatest(coalesce((v_entry ->> 'offset')::bigint, 0), 0)
       where job_id = v_item.job_id and media_id = v_item.media_id;
      v_moved := true;
    elsif v_outcome = 'failed' then
      if coalesce((v_entry ->> 'retry')::boolean, false) and v_item.attempts < 5 then
        update public.cloud_export_items
           set status = 'pending', lease_token = null, leased_until = null,
               not_before = c_now + case v_item.attempts when 1 then interval '1 minute'
                                                         when 2 then interval '5 minutes'
                                                         when 3 then interval '30 minutes'
                                                         else interval '60 minutes' end,
               last_error = left(v_entry ->> 'reason', 300),
               session_uri = case when coalesce((v_entry ->> 'keep_session')::boolean, false) then session_uri end,
               session_offset = case when coalesce((v_entry ->> 'keep_session')::boolean, false) then session_offset end
         where job_id = v_item.job_id and media_id = v_item.media_id;
      else
        update public.cloud_export_items
           set status = 'failed', lease_token = null, leased_until = null, session_uri = null, session_offset = null,
               last_error = left(coalesce(v_entry ->> 'reason', 'failed'), 300)
         where job_id = v_item.job_id and media_id = v_item.media_id;
        v_failed := v_failed + 1;
        v_signal := coalesce(v_signal, 'file_failed');
      end if;
    elsif v_outcome = 'skipped' then
      update public.cloud_export_items
         set status = 'skipped',
             skip_reason = case when v_entry ->> 'reason' = 'missing_object' then 'missing_object' else 'gone' end,
             lease_token = null, leased_until = null, session_uri = null, session_offset = null
       where job_id = v_item.job_id and media_id = v_item.media_id;
      v_skipped := v_skipped + 1;
      if v_entry ->> 'reason' = 'missing_object' then
        v_signal := coalesce(v_signal, 'missing_object');
      end if;
    elsif v_outcome = 'released' then
      update public.cloud_export_items
         set status = 'pending', lease_token = null, leased_until = null, attempts = greatest(attempts - 1, 0)
       where job_id = v_item.job_id and media_id = v_item.media_id;
    end if;
  end loop;

  if v_up_files > 0 then
    insert into public.cloud_export_sent_hours (connection_id, hour, user_id, bytes, files)
    values (v_conn.id, date_trunc('hour', c_now), v_job.user_id, v_up_bytes, v_up_files)
    on conflict (connection_id, hour) do update
      set bytes = public.cloud_export_sent_hours.bytes + excluded.bytes,
          files = public.cloud_export_sent_hours.files + excluded.files;
  end if;

  update public.cloud_exports
     set items_sent = items_sent + v_sent,
         items_kept = items_kept + v_kept_n,
         items_failed = items_failed + v_failed,
         items_skipped = items_skipped + v_skipped,
         bytes_sent = bytes_sent + v_sent_bytes,
         last_progress_at = case when v_moved then c_now else last_progress_at end,
         stuck_since = case when v_moved then null else stuck_since end
   where id = v_job.id;

  if v_sent > 0 and v_conn.throttled_since is not null then
    update public.cloud_connections set throttled_since = null where id = v_conn.id;
  end if;

  -- The connection's finding.
  if p_finding = 'drive_full' then
    update public.cloud_connections
       set full_since = coalesce(full_since, c_now), full_checked_at = c_now
     where id = v_conn.id;
    perform public.cloud_export_pause(v_conn.id, null, 'drive_full', null);
  elsif p_finding = 'daily_limit' then
    perform public.cloud_export_pause(v_conn.id, null, 'daily_limit', c_now + interval '1 hour');
  elsif p_finding = 'throttled' then
    update public.cloud_connections
       set throttled_until = c_now + interval '2 minutes',
           concurrency = 2,
           concurrency_until = c_now + interval '30 minutes',
           throttled_since = coalesce(throttled_since, c_now)
     where id = v_conn.id;
    -- A "slow down" that has not let a file through in two hours is Google's daily cap by another name.
    if v_conn.throttled_since is not null and v_conn.throttled_since < c_now - interval '2 hours' then
      perform public.cloud_export_pause(v_conn.id, null, 'daily_limit', c_now + interval '1 hour');
    end if;
  elsif p_finding = 'auth' then
    update public.cloud_connections set access_expires_at = c_now where id = v_conn.id;
  elsif p_finding = 'folder_gone' then
    perform public.cloud_export_pause(v_conn.id, v_job.id, 'folder_gone', null);
  elsif p_finding = 'domain_policy' then
    perform public.cloud_export_pause(v_conn.id, null, 'domain_policy', null);
  elsif p_finding = 'lane_failed' then
    update public.cloud_connections
       set lane_failures = case when lane_failures_on is distinct from current_date then 1 else lane_failures + 1 end,
           lane_failures_on = current_date
     where id = v_conn.id
     returning * into v_conn;
    v_signal := 'lane_failed';
    if v_conn.lane_failures >= 3 then
      perform public.cloud_export_pause(v_conn.id, null, 'failing', null);
      v_signal := 'lane_paused';
    end if;
  end if;

  if p_done then
    update public.cloud_export_items
       set status = 'pending', lease_token = null, leased_until = null, attempts = greatest(attempts - 1, 0)
     where lease_token = p_lease and status = 'leased';
    update public.cloud_export_leases set leased_until = c_now where token = p_lease;
  else
    update public.cloud_export_leases set leased_until = c_now + interval '15 minutes' where token = p_lease;
    update public.cloud_export_items
       set leased_until = c_now + interval '15 minutes'
     where lease_token = p_lease and status = 'leased';
  end if;

  v_status := public.cloud_export_settle(v_job.id);

  -- Stop means stop the slice: the send was canceled, paused or stopped, or the connection or the switch paused. A
  -- send that settled into its closing check (or ended) is no stop: the lane leases again and finds the check or
  -- nothing.
  v_stop := v_status in ('paused', 'canceled', 'stopped')
            or not coalesce((select f.enabled from public.ops_flags f where f.key = 'drive_export_enabled'), true)
            or exists (select 1 from public.cloud_connections c
                        where c.id = v_conn.id and (c.operator_paused_at is not null or c.status = 'revoked'));

  return jsonb_build_object(
    'state', case when v_stop then 'stop' else 'ok' end,
    'until', case when p_done or v_stop then null else c_now + interval '15 minutes' end,
    'job_id', v_job.id,
    'user_id', v_job.user_id,
    'before', v_before,
    'status', v_status,
    'signal', v_signal
  );
end;
$$;

-- ONE PAGE OF A SEND'S CLOSING CHECK (`/api/internal/drive/check`): the Worker asked Drive for each sent file by its
-- id. Confirmed, it stays sent; gone, in the bin or not what we sent, it goes back to pending once (sent again), then
-- fails (`missing`). The first page carries the duplicates the folder's listing counted (counted and signalled, never
-- binned: a copy she made on purpose carries our marks too). When no sent file is left past the cursor, the send ends
-- (or returns to sending for what went back). It decides the page and nothing else.
create function public.cloud_export_check_page(
  p_lease uuid,
  p_results jsonb,
  p_duplicates integer default null,
  p_finding text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_now constant timestamptz := now();
  v_lease public.cloud_export_leases%rowtype;
  v_job public.cloud_exports%rowtype;
  v_entry jsonb;
  v_item public.cloud_export_items%rowtype;
  v_back integer := 0;
  v_failed integer := 0;
  v_unsent_bytes bigint := 0;
  v_unsent integer := 0;
  v_unkept integer := 0;
  v_last uuid;
  v_status text;
  v_before text;
begin
  select * into v_lease from public.cloud_export_leases l where l.token = p_lease;
  if not found or v_lease.kind <> 'check' then
    return jsonb_build_object('state', 'stop', 'why', 'no_lease');
  end if;
  perform 1 from public.cloud_connections c where c.id = v_lease.connection_id for update;
  if not found then
    return jsonb_build_object('state', 'stop', 'why', 'no_connection');
  end if;
  if v_lease.leased_until <= c_now then
    return jsonb_build_object('state', 'stop', 'why', 'expired');
  end if;
  select * into v_job from public.cloud_exports j where j.id = v_lease.job_id;
  v_before := v_job.status;
  if v_job.status <> 'checking' then
    update public.cloud_export_leases set leased_until = c_now where token = p_lease;
    return jsonb_build_object('state', 'stop', 'why', 'not_checking', 'status', v_job.status);
  end if;

  if p_finding = 'folder_gone' then
    update public.cloud_export_leases set leased_until = c_now where token = p_lease;
    perform public.cloud_export_pause(v_lease.connection_id, v_job.id, 'folder_gone', null);
    return jsonb_build_object('state', 'stop', 'job_id', v_job.id, 'user_id', v_job.user_id,
                              'before', v_before, 'status', 'paused');
  end if;

  for v_entry in select * from jsonb_array_elements(coalesce(p_results, '[]'::jsonb))
  loop
    select * into v_item from public.cloud_export_items i
     where i.job_id = v_job.id and i.media_id = (v_entry ->> 'media_id')::uuid and i.status = 'sent'
       and (v_job.check_after is null or i.media_id > v_job.check_after)
     for update;
    if not found then
      continue;
    end if;
    if v_last is null or v_item.media_id > v_last then
      v_last := v_item.media_id;
    end if;
    if v_entry ->> 'state' = 'ok' then
      update public.cloud_export_items set confirmed_at = c_now
       where job_id = v_item.job_id and media_id = v_item.media_id;
    elsif not v_item.missing_once then
      update public.cloud_export_items
         set status = 'pending', missing_once = true, drive_file_id = null, drive_md5 = null, worker_md5 = null,
             kept = false, sent_at = null, confirmed_at = null, attempts = 0, not_before = null
       where job_id = v_item.job_id and media_id = v_item.media_id;
      v_back := v_back + 1;
      v_unsent := v_unsent + 1;
      v_unsent_bytes := v_unsent_bytes + v_item.bytes;
      if v_item.kept then
        v_unkept := v_unkept + 1;
      end if;
    else
      update public.cloud_export_items
         set status = 'failed', last_error = 'missing from her Drive after it was sent again', confirmed_at = null
       where job_id = v_item.job_id and media_id = v_item.media_id;
      v_failed := v_failed + 1;
      v_unsent := v_unsent + 1;
      v_unsent_bytes := v_unsent_bytes + v_item.bytes;
      if v_item.kept then
        v_unkept := v_unkept + 1;
      end if;
    end if;
  end loop;

  update public.cloud_exports
     set items_sent = items_sent - v_unsent,
         items_kept = items_kept - v_unkept,
         items_failed = items_failed + v_failed,
         bytes_sent = greatest(bytes_sent - v_unsent_bytes, 0),
         items_duplicated = case when p_duplicates is not null then greatest(p_duplicates, 0) else items_duplicated end,
         check_after = coalesce(v_last, check_after),
         last_progress_at = c_now
   where id = v_job.id;
  update public.cloud_export_leases set leased_until = c_now where token = p_lease;

  -- The end of the walk: nothing sent is left past the cursor. What went back is sent again from there (a later lease
  -- finds it), and the send is checked again once it has gone.
  if not exists (
    select 1 from public.cloud_export_items i
     where i.job_id = v_job.id and i.status = 'sent'
       and i.media_id > coalesce(v_last, v_job.check_after, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    if exists (select 1 from public.cloud_export_items i where i.job_id = v_job.id and i.status in ('pending', 'leased'))
    then
      update public.cloud_exports set status = 'sending', check_after = null where id = v_job.id;
      v_status := 'sending';
    else
      v_status := public.cloud_export_settle(v_job.id);
    end if;
  else
    v_status := 'checking';
  end if;

  return jsonb_build_object(
    'state', 'ok',
    'job_id', v_job.id,
    'user_id', v_job.user_id,
    'before', v_before,
    'status', v_status,
    'back', v_back,
    'failed', v_failed,
    'duplicates', p_duplicates
  );
end;
$$;

-- HER ACTS, AND AN OPERATOR'S, ON ONE SEND (`POST /api/drive/exports/<id>`, /admin/exports). Not hers is not found
-- (nothing leaks). cancel: an unfinished send ends (what reached her Drive stays; her lanes stop at their next report).
-- resume: a paused send goes again; hers only where her press can fix it (the route checked her Drive's room, or made
-- a new folder), an operator's for any reason. retry: a partly done send sends what failed again. seen: her app showed
-- the stop's flag.
create function public.cloud_export_act(p_user uuid, p_job uuid, p_act text, p_operator boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn uuid;
  v_job public.cloud_exports%rowtype;
  v_n integer;
begin
  select j.connection_id into v_conn from public.cloud_exports j
   where j.id = p_job and (p_operator or j.user_id = p_user);
  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  if v_conn is not null then
    perform 1 from public.cloud_connections c where c.id = v_conn for update;
  end if;
  select * into v_job from public.cloud_exports j where j.id = p_job for update;

  if p_act = 'cancel' then
    if v_job.status not in ('preparing', 'sending', 'paused', 'checking') then
      return jsonb_build_object('ok', false, 'code', 'not_running', 'status', v_job.status);
    end if;
    update public.cloud_exports
       set status = 'canceled', stop_reason = case when p_operator then 'operator' else 'canceled' end,
           pause_reason = null, closed_at = now(), attention_at = null, stuck_since = null
     where id = p_job;
    return jsonb_build_object('ok', true, 'status', 'canceled', 'connection_id', v_conn);
  elsif p_act = 'resume' then
    if v_job.status <> 'paused' then
      return jsonb_build_object('ok', false, 'code', 'not_paused', 'status', v_job.status);
    end if;
    if not p_operator and v_job.pause_reason not in ('drive_full', 'folder_gone') then
      return jsonb_build_object('ok', false, 'code', 'not_hers', 'reason', v_job.pause_reason);
    end if;
    if v_job.pause_reason = 'drive_full' then
      update public.cloud_connections set full_since = null, full_checked_at = null where id = v_conn;
    end if;
    update public.cloud_exports
       set status = 'sending', pause_reason = null, resume_at = null, resumed_at = now(), attention_at = null
     where id = p_job;
    return jsonb_build_object('ok', true, 'status', 'sending', 'connection_id', v_conn);
  elsif p_act = 'retry' then
    if v_job.status <> 'partly_done' then
      return jsonb_build_object('ok', false, 'code', 'nothing_failed', 'status', v_job.status);
    end if;
    if v_conn is null or v_job.event_id is null then
      return jsonb_build_object('ok', false, 'code', 'gone');
    end if;
    update public.cloud_export_items
       set status = 'pending', attempts = 0, not_before = null, last_error = null, missing_once = false
     where job_id = p_job and status = 'failed';
    get diagnostics v_n = row_count;
    update public.cloud_exports
       set status = 'sending', items_failed = greatest(items_failed - v_n, 0), closed_at = null,
           attention_at = null, resumed_at = now()
     where id = p_job;
    return jsonb_build_object('ok', true, 'status', 'sending', 'retried', v_n, 'connection_id', v_conn);
  elsif p_act = 'seen' then
    update public.cloud_exports set attention_seen_at = now() where id = p_job;
    return jsonb_build_object('ok', true, 'status', v_job.status);
  end if;
  raise exception 'cloud_export_act: unknown act %', p_act using errcode = '22023';
end;
$$;

-- "Send to a new folder" (the album's folder went to her Drive's bin): the route made a new folder; the paused send
-- takes it and goes again, and the album's next send lands there too.
create function public.cloud_export_refolder(p_user uuid, p_job uuid, p_folder_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn uuid;
  v_job public.cloud_exports%rowtype;
begin
  select j.connection_id into v_conn from public.cloud_exports j where j.id = p_job and j.user_id = p_user;
  if not found or v_conn is null or p_folder_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;
  perform 1 from public.cloud_connections c where c.id = v_conn for update;
  select * into v_job from public.cloud_exports j where j.id = p_job for update;
  if v_job.status <> 'paused' or v_job.pause_reason <> 'folder_gone' then
    return jsonb_build_object('ok', false, 'code', 'not_folder_gone', 'status', v_job.status);
  end if;
  if v_job.event_id is not null then
    insert into public.cloud_event_folders (connection_id, event_id, folder_id)
    values (v_conn, v_job.event_id, p_folder_id)
    on conflict (connection_id, event_id) do update set folder_id = excluded.folder_id;
  end if;
  -- Every file still recorded as in the old folder is asked again by the closing check; nothing is sent twice
  -- that is still hers wherever she moved it.
  update public.cloud_exports
     set status = 'sending', pause_reason = null, resumed_at = now(), attention_at = null,
         folder_id = p_folder_id, folder_url = 'https://drive.google.com/drive/folders/' || p_folder_id
   where id = p_job;
  return jsonb_build_object('ok', true, 'connection_id', v_conn);
end;
$$;

-- THE SWEEP (`/api/internal/drive/sweep`, the Worker's cron every 5 minutes; the backstop of every kick): what to kick
-- (a running send with work, no live lane and no progress for 5 minutes, a pause whose time came, a dying lane's
-- connection at most once an hour), what to ask again (a full Drive's room, every 6 hours for a week), what ended
-- (14 days running, 30 paused, a press that never got its folder), what stuck (an hour with work and no progress),
-- the breakers, the connections failing past a day or near a time-based grant's end, and the old leases and hours.
create function public.cloud_export_sweep()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  c_now constant timestamptz := now();
  v_conn record;
  v_kick jsonb := '[]'::jsonb;
  v_lanes jsonb;
  v_recheck jsonb := '[]'::jsonb;
  v_reconnect jsonb := '[]'::jsonb;
  v_breakers jsonb := '[]'::jsonb;
  v_expired jsonb := '[]'::jsonb;
  v_resumed integer := 0;
  v_stuck integer := 0;
  v_failed_start integer := 0;
  v_user record;
  v_job record;
begin
  -- A press that never got its folder.
  update public.cloud_exports j
     set status = 'stopped', stop_reason = 'failed_to_start', closed_at = c_now
   where j.status = 'preparing' and j.created_at < c_now - interval '10 minutes';
  get diagnostics v_failed_start = row_count;

  -- A pause whose time came (Google's day): sending again.
  update public.cloud_exports j
     set status = 'sending', pause_reason = null, resume_at = null, resumed_at = c_now
   where j.status = 'paused' and j.resume_at is not null and j.resume_at <= c_now
     and j.pause_reason = 'daily_limit';
  get diagnostics v_resumed = row_count;

  -- By construction nothing runs for ever: 14 days running, 30 paused.
  for v_job in
    update public.cloud_exports j
       set status = 'stopped', stop_reason = 'expired', pause_reason = null, closed_at = c_now,
           attention_at = c_now
     where (j.status in ('sending', 'checking')
            and greatest(j.started_at, coalesce(j.resumed_at, j.started_at)) < c_now - interval '14 days')
        or (j.status = 'paused' and j.paused_at < c_now - interval '30 days')
    returning j.id, j.user_id
  loop
    v_expired := v_expired || jsonb_build_array(jsonb_build_object('job_id', v_job.id, 'user_id', v_job.user_id));
  end loop;

  -- An hour with work and no progress: stuck (the /admin signal), cleared by the next progress.
  update public.cloud_exports j
     set stuck_since = c_now
   where j.status = 'sending' and j.stuck_since is null
     and coalesce(j.last_progress_at, j.started_at) < c_now - interval '1 hour'
     and exists (select 1 from public.cloud_export_items i where i.job_id = j.id and i.status in ('pending', 'leased'));
  get diagnostics v_stuck = row_count;

  -- The account breakers: running sends of an account past ten times its plan's room in 30 days pause.
  for v_user in
    select h.user_id, sum(h.bytes)::bigint as sent30
      from public.cloud_export_sent_hours h
      join public.profiles pr on pr.id = h.user_id
      left join public.cloud_connections c on c.user_id = h.user_id and c.provider = 'google_drive'
     where h.hour > greatest(c_now - interval '30 days', coalesce(c.breaker_lifted_at, '-infinity'::timestamptz))
       and exists (select 1 from public.cloud_exports j where j.user_id = h.user_id and j.status in ('sending', 'checking'))
     group by h.user_id
  loop
    if v_user.sent30 >= greatest(
         10 * (select coalesce(pr.storage_cap_bytes, l.default_storage_cap_bytes)
                 from public.profiles pr cross join lateral public.tier_limits(pr.tier) l
                where pr.id = v_user.user_id),
         5::bigint * 1024 * 1024 * 1024) then
      update public.cloud_exports j
         set status = 'paused', pause_reason = 'breaker', paused_at = c_now
       where j.user_id = v_user.user_id and j.status in ('sending', 'checking');
      v_breakers := v_breakers || jsonb_build_array(jsonb_build_object('user_id', v_user.user_id, 'sent30', v_user.sent30));
    end if;
  end loop;

  -- Connections failing past a day: their sends pause `disconnected`; a time-based grant a day from its end reads
  -- failing now, with the reconnect mail, so it never dies as a silent invalid_grant.
  for v_conn in
    update public.cloud_connections c
       set status = 'failing', failing_since = coalesce(c.failing_since, c_now), updated_at = c_now
     where c.status = 'connected' and c.refresh_expires_at is not null and c.refresh_expires_at < c_now + interval '1 day'
    returning c.id, c.user_id
  loop
    v_reconnect := v_reconnect || jsonb_build_array(jsonb_build_object('connection_id', v_conn.id, 'user_id', v_conn.user_id,
                                                                       'why', 'grant_ending'));
  end loop;
  for v_conn in
    select c.id, c.user_id from public.cloud_connections c
     where c.status = 'failing' and c.failing_since < c_now - interval '24 hours'
       and exists (select 1 from public.cloud_exports j where j.connection_id = c.id and j.status in ('sending', 'checking'))
  loop
    perform 1 from public.cloud_connections c where c.id = v_conn.id for update;
    perform public.cloud_export_pause(v_conn.id, null, 'disconnected', null);
    v_reconnect := v_reconnect || jsonb_build_array(jsonb_build_object('connection_id', v_conn.id, 'user_id', v_conn.user_id,
                                                                       'why', 'failing'));
  end loop;

  -- A full Drive's room, asked again every 6 hours for 7 days (the route asks Google and resumes on room).
  select coalesce(jsonb_agg(c.id), '[]'::jsonb) into v_recheck
    from public.cloud_connections c
   where c.full_since is not null and c.full_since > c_now - interval '7 days'
     and (c.full_checked_at is null or c.full_checked_at < c_now - interval '6 hours')
     and c.status <> 'revoked';

  -- What to kick: a running send with work and no live lane and no progress for 5 minutes, or a check with no live
  -- lane; a connection whose lane died today, at most once an hour.
  for v_conn in
    select c.id, c.lane_failures, c.lane_failures_on, c.lane_rekicked_at
      from public.cloud_connections c
     where c.status <> 'revoked' and c.operator_paused_at is null
       and (c.throttled_until is null or c.throttled_until <= c_now)
       and not exists (select 1 from public.cloud_export_leases l where l.connection_id = c.id and l.leased_until > c_now)
       and exists (
         select 1 from public.cloud_exports j
          where j.connection_id = c.id
            and ((j.status = 'sending' and coalesce(j.last_progress_at, j.resumed_at, j.started_at) < c_now - interval '5 minutes'
                  and exists (select 1 from public.cloud_export_items i
                               where i.job_id = j.id and i.status in ('pending', 'leased')
                                 and (i.not_before is null or i.not_before <= c_now)))
                 or j.status = 'checking'
                 or (j.status = 'sending' and j.resumed_at > c_now - interval '6 minutes'))
       )
  loop
    if v_conn.lane_failures_on = current_date and v_conn.lane_failures > 0
       and v_conn.lane_rekicked_at is not null and v_conn.lane_rekicked_at > c_now - interval '1 hour' then
      continue;
    end if;
    v_lanes := public.cloud_connection_kick(v_conn.id);
    if (v_lanes ->> 'lanes')::integer > 0 then
      if v_conn.lane_failures_on = current_date and v_conn.lane_failures > 0 then
        update public.cloud_connections set lane_rekicked_at = c_now where id = v_conn.id;
      end if;
      v_kick := v_kick || jsonb_build_array(jsonb_build_object('connection_id', v_conn.id, 'lanes', (v_lanes ->> 'lanes')::integer));
    end if;
  end loop;

  delete from public.cloud_export_leases l where l.leased_until < c_now - interval '1 day';
  delete from public.cloud_export_sent_hours h where h.hour < c_now - interval '31 days';

  return jsonb_build_object(
    'kick', v_kick,
    'recheck', v_recheck,
    'reconnect', v_reconnect,
    'breakers', v_breakers,
    'expired', v_expired,
    'resumed', v_resumed,
    'stuck', v_stuck,
    'failed_to_start', v_failed_start
  );
end;
$$;

-- =============================================================================================
-- 8. The switch, seeded ON (a missing row reads as on too, everywhere it is read).
-- =============================================================================================
insert into public.ops_flags (key, enabled) values ('drive_export_enabled', true)
on conflict (key) do nothing;

-- =============================================================================================
-- 9. The spend watch's readings, restated with one more section: what reached Drive over the day.
-- Byte for byte 20261003190000's body and comment but for the `drive_bytes` section (and its line in the comment).
-- =============================================================================================
create or replace function public.spend_watch_readings(p_now timestamptz, p_lifecycle_kinds text[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_since constant timestamptz := p_now - interval '24 hours';
  v_out jsonb := '{}'::jsonb;
  v_errors jsonb := '{}'::jsonb;
  v_json jsonb;
  v_n bigint;
begin
  if p_now is null then
    raise exception 'spend_watch_readings: p_now is required' using errcode = '22004';
  end if;

  -- The monthly ingress meter, this period and the last (the run diffs two snapshots, a new month whole).
  begin
    select coalesce(jsonb_object_agg(l.period, jsonb_build_array(l.bytes, l.items)), '{}'::jsonb)
      into v_json
      from (
        select sl.period,
               coalesce(sum(sl.cumulative_bytes), 0)::bigint as bytes,
               coalesce(sum(sl.photo_count + sl.video_count), 0)::bigint as items
          from public.storage_ledger sl
         where sl.period in (to_char(p_now, 'YYYY-MM'), to_char(p_now - interval '1 month', 'YYYY-MM'))
         group by sl.period
      ) l;
    v_out := v_out || jsonb_build_object('ledger', v_json);
  exception when others then
    v_errors := v_errors || jsonb_build_object('ledger', sqlerrm);
  end;

  -- Every album's change counters (a snapshot: the run diffs two).
  begin
    select coalesce(sum(s.version + s.attr_version), 0)::bigint into v_n from public.album_state s;
    v_out := v_out || jsonb_build_object('album', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('album', sqlerrm);
  end;

  -- The lifecycle mail of the day, by the kinds the app names (send-kinds.ts): none named is an error, never a zero.
  begin
    if p_lifecycle_kinds is null or cardinality(p_lifecycle_kinds) = 0 then
      raise exception 'no lifecycle kinds were named';
    end if;
    select count(*) into v_n
      from public.sent_emails e
     where e.sent_at > v_since and e.sent_at <= p_now
       and e.kind = any (p_lifecycle_kinds);
    v_out := v_out || jsonb_build_object('lifecycle_mail', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('lifecycle_mail', sqlerrm);
  end;

  -- The accounts signed in over the day.
  begin
    v_out := v_out || jsonb_build_object('sign_ins', public.spend_watch_sign_ins(v_since, p_now));
  exception when others then
    v_errors := v_errors || jsonb_build_object('sign_ins', sqlerrm);
  end;

  -- The zips minted over the day.
  begin
    select count(*) into v_n
      from public.export_log x
     where x.created_at > v_since and x.created_at <= p_now
       and x.outcome = 'minted';
    v_out := v_out || jsonb_build_object('downloads', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('downloads', sqlerrm);
  end;

  -- The purge cron's runs over the day that did work (a paused one's skipped rows cost nothing).
  begin
    select count(*) into v_n
      from public.job_runs r
     where r.job = 'purge_cron'
       and r.status <> 'skipped'
       and r.started_at > v_since and r.started_at <= p_now;
    v_out := v_out || jsonb_build_object('purge_runs', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('purge_runs', sqlerrm);
  end;

  -- What reached Google Drive over the day (20261005120000): the hours that end inside it, uploads only.
  begin
    select coalesce(sum(h.bytes), 0)::bigint into v_n
      from public.cloud_export_sent_hours h
     where h.hour > v_since - interval '1 hour' and h.hour <= p_now;
    v_out := v_out || jsonb_build_object('drive_bytes', v_n);
  exception when others then
    v_errors := v_errors || jsonb_build_object('drive_bytes', sqlerrm);
  end;

  return v_out || jsonb_build_object('errors', v_errors);
end;
$$;

comment on function public.spend_watch_readings(timestamptz, text[]) is
  'The spend watch''s readings in one call (src/lib/jobs/spend-watch.ts): the ingress meter''s platform totals for p_now''s period and the last, every album''s change counters, and over the 24 hours to p_now the lifecycle mail of p_lifecycle_kinds, the accounts signed in, the zips minted, the purge cron''s working runs and the bytes sent to Google Drive. A section that fails is named in errors and left out, never answered as zero. SECURITY INVOKER, service role only.';

-- =============================================================================================
-- Grants: every function the service role's alone (PUBLIC's default EXECUTE revoked first), the two helpers the
-- owner's alone (revoked from the service role too: no role PostgREST serves can call them). spend_watch_readings'
-- grants stand (CREATE OR REPLACE keeps them); restated so this file says them whole.
-- =============================================================================================
revoke all on function public.cloud_export_pause(uuid, uuid, text, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.cloud_export_settle(uuid) from public, anon, authenticated, service_role;

revoke all on function public.cloud_connection_upsert(uuid, text, text, boolean, text, text[], text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.cloud_connection_upsert(uuid, text, text, boolean, text, text[], text, text, timestamptz, timestamptz) to service_role;
revoke all on function public.cloud_connection_disconnect(uuid) from public, anon, authenticated;
grant execute on function public.cloud_connection_disconnect(uuid) to service_role;
revoke all on function public.cloud_connection_token(uuid) from public, anon, authenticated;
grant execute on function public.cloud_connection_token(uuid) to service_role;
revoke all on function public.cloud_connection_refreshed(uuid, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.cloud_connection_refreshed(uuid, text, timestamptz, text) to service_role;
revoke all on function public.cloud_connection_refresh_failed(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.cloud_connection_refresh_failed(uuid, text, boolean) to service_role;
revoke all on function public.cloud_connection_room(uuid, bigint, bigint, boolean) from public, anon, authenticated;
grant execute on function public.cloud_connection_room(uuid, bigint, bigint, boolean) to service_role;
revoke all on function public.cloud_connection_root(uuid, text, text) from public, anon, authenticated;
grant execute on function public.cloud_connection_root(uuid, text, text) to service_role;
revoke all on function public.cloud_connection_kick(uuid) from public, anon, authenticated;
grant execute on function public.cloud_connection_kick(uuid) to service_role;
revoke all on function public.cloud_connection_operator(uuid, text, text) from public, anon, authenticated;
grant execute on function public.cloud_connection_operator(uuid, text, text) to service_role;
revoke all on function public.cloud_export_preview(uuid, uuid[], boolean) from public, anon, authenticated;
grant execute on function public.cloud_export_preview(uuid, uuid[], boolean) to service_role;
revoke all on function public.cloud_export_create(uuid, uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.cloud_export_create(uuid, uuid, boolean, text) to service_role;
revoke all on function public.cloud_export_ready(uuid, text) from public, anon, authenticated;
grant execute on function public.cloud_export_ready(uuid, text) to service_role;
revoke all on function public.cloud_export_lease(uuid) from public, anon, authenticated;
grant execute on function public.cloud_export_lease(uuid) to service_role;
revoke all on function public.cloud_export_name_items(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.cloud_export_name_items(uuid, jsonb) to service_role;
revoke all on function public.cloud_export_report(uuid, jsonb, text, boolean) from public, anon, authenticated;
grant execute on function public.cloud_export_report(uuid, jsonb, text, boolean) to service_role;
revoke all on function public.cloud_export_check_page(uuid, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.cloud_export_check_page(uuid, jsonb, integer, text) to service_role;
revoke all on function public.cloud_export_act(uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.cloud_export_act(uuid, uuid, text, boolean) to service_role;
revoke all on function public.cloud_export_refolder(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cloud_export_refolder(uuid, uuid, text) to service_role;
revoke all on function public.cloud_export_sweep() from public, anon, authenticated;
grant execute on function public.cloud_export_sweep() to service_role;

revoke all on function public.spend_watch_readings(timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.spend_watch_readings(timestamptz, text[]) to service_role;
