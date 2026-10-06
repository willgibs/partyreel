-- =============================================================================================
-- SEND TO GOOGLE DRIVE, THE WALK'S FINDINGS (lane `drive-fixes`, 2026-10-05; the first live walk's ledger, the system
-- doc docs/systems/drive-export.md). Three changes to 20261005120000's half, nothing else of it touched:
--
--   1. ★ ONLY A CHECK THAT RAN CLOSES A CHECKING SEND (`cloud_export_settle`). The walk's first send said "every one
--      checked" with no check run: a lane's timed report carried the batch's last file, the settle moved the send to
--      `checking`, and the batch's closing report (`done`, no items) reached the settle again, which closed the
--      `checking` send as done. A checking send now closes only when its walk is through: no sent file left past the
--      check's cursor, which only the check page (moving the cursor) or a lease finding nothing left to ask can make
--      true. Everything else about the settle is as it was.
--   2. DISCONNECT FORGETS EVERY DRIVE ID (`cloud_connection_forget`, the owner's alone, read by
--      `cloud_connection_disconnect` and by `cloud_connection_upsert`'s other-account branch, each before the
--      connection row goes). The sends kept their folder ids out of the way already; their items kept the files' ids,
--      Drive's MD5s and any upload session (a week-long capability). Now they go too, and a file still on its way is
--      given back. The items keep their states and the sends their counts: what reached her Drive is still said,
--      only no longer where. A sent item may now hold no file id once forgotten (`forgotten_at`, the CHECK restated),
--      and the walk's 93 items a Disconnect already left are forgotten here.
--   3. ★ A DYING LANE COUNTS ONCE (`cloud_connection_lane_failed`, now taking the lane's Queue message id). It was the
--      one internal word whose replay was no no-op: three of one signed word inside its five minutes paused her
--      sends until an operator's Resume. The last twenty message ids counted ride the connection
--      (`lane_failed_messages`), and a word naming one counts nothing.
--
-- DEPLOYED BUILDS: partyreel.com's and the alias's older builds call the settle, the disconnect and the upsert by
-- their unchanged names and signatures (the bodies change under them). The two-argument `cloud_connection_lane_failed`
-- is dropped: its one caller is the Drive Worker's dying lane, through `/api/internal/drive/lanefail`, and no
-- deployment runs that Worker yet, so nothing in use loses anything. ★ APPLY BEFORE THE CODE: this lane's lanefail
-- route sends `p_message`, which PostgREST finds only once this file is applied.
--
-- LOCKS AT APPLY: two ADD COLUMNs (nullable / a constant default: catalog only) and a CHECK dropped and added on
-- cloud_export_items (ACCESS EXCLUSIVE while it scans a few hundred rows), one CHECK added on cloud_connections (its
-- handful of rows), one UPDATE of the walk's 93 items, and the functions (catalog only). No hot table is touched.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) Drift, read-only: 20261005120000 is applied and none of this file's objects exists:
--         select column_name from information_schema.columns where table_schema = 'public'
--            and ((table_name = 'cloud_export_items' and column_name = 'forgotten_at')
--              or (table_name = 'cloud_connections' and column_name = 'lane_failed_messages'));       -- no rows
--         select to_regprocedure('public.cloud_connection_forget(uuid)');                               -- null
--         select to_regprocedure('public.cloud_connection_lane_failed(uuid, text)');                    -- not null
--       and the replaced bodies are still 20261005120000's (hash each prosrc against that file's).
--   (2) Apply verbatim.
--   (3) get_advisors (security): NO DELTA (25 rls_enabled_no_policy; nothing new in 0028 or 0029: the new function is
--       the owner's alone, the restated one the service role's).
--   (4) Regenerate src/lib/db/types.ts (cloud_connection_lane_failed's p_message, the two columns, the helper), then
--       drop the typed seam in src/lib/db/queries/drive.ts (`recordLaneFailed`'s cast).
--   (5) The rolled-back check at the foot, in one execute_sql call; it ends in a deliberate raise.
-- =============================================================================================

-- =============================================================================================
-- 1. The closing check is the only way out of `checking`
-- =============================================================================================

-- Where a send stands once nothing of it is pending or leased: the closing check when anything went, else its end
-- (partly done when a file would not go, done otherwise; a file skipped because it left the album is no failure).
create or replace function public.cloud_export_settle(p_job uuid)
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
  -- ★ ONLY A CHECK THAT RAN CLOSES A CHECKING SEND: its walk is through, no sent file left past its cursor (the check
  -- page's own end, or a lease that finds nothing left to ask). A batch's closing report reaching here just after its
  -- timed report moved the send to checking (the walk: "every one checked" said of five files nobody asked Drive
  -- about) leaves it checking, for the next lease to hand out its first page.
  if v_job.status = 'checking' and exists (
       select 1 from public.cloud_export_items i
        where i.job_id = p_job and i.status = 'sent'
          and (v_job.check_after is null or i.media_id > v_job.check_after)) then
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
  'Moves a send with nothing pending or leased to its closing check, or to done / partly_done; a checking send closes only once its walk is through (no sent file past its cursor). The owner''s alone, read inside the cloud_* bodies.';

-- =============================================================================================
-- 2. Disconnect forgets every Drive id
-- =============================================================================================

-- A sent item names its file in her Drive, until a Disconnect (or another Google account's connect) forgets it.
alter table public.cloud_export_items add column forgotten_at timestamptz;
alter table public.cloud_export_items drop constraint cloud_export_items_sent_with_file;
alter table public.cloud_export_items add constraint cloud_export_items_sent_with_file
  check (status <> 'sent' or drive_file_id is not null or forgotten_at is not null);

-- FORGETTING A DRIVE (Disconnect, and another Google account's connect, each holding the connection row and each
-- before that row goes): every Google identifier the connection's sends hold goes, so nothing a later connection
-- reads can name another Drive's file: on the items the files' ids, Drive's MD5s and the upload sessions (a session is
-- a week-long capability), and on the sends their folders (the album folders' rows go with the connection). A file
-- still on its way is given back (its lane's next word finds no lease and stops). The items keep their states and the
-- sends their counts: what reached her Drive is still said, only no longer where. Items first, then the sends, as
-- every body orders them.
create function public.cloud_connection_forget(p_connection uuid)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_n integer;
begin
  update public.cloud_export_items i
     set drive_file_id = null,
         drive_md5 = null,
         session_uri = null,
         session_offset = null,
         status = case when i.status = 'leased' then 'pending' else i.status end,
         lease_token = null,
         leased_until = null,
         forgotten_at = now()
   where i.job_id in (select j.id from public.cloud_exports j where j.connection_id = p_connection)
     and (i.drive_file_id is not null or i.drive_md5 is not null or i.session_uri is not null
          or i.lease_token is not null);
  get diagnostics v_n = row_count;
  update public.cloud_exports j
     set folder_id = null, folder_url = null
   where j.connection_id = p_connection;
  return v_n;
end;
$$;

comment on function public.cloud_connection_forget(uuid) is
  'Forgets every Google id a connection''s sends hold (files, Drive''s MD5s, upload sessions, folders) and gives back what was leased, keeping states and counts. The owner''s alone: read by cloud_connection_disconnect and cloud_connection_upsert, each holding the connection row.';

-- Her Google account, connected or connected again (the callback, after the code exchange and every check of the
-- token's scope, refresh token and ID token). The same Google account (`sub`) keeps the row and its id, takes the
-- new tokens and resumes what paused on it; ★ the replaced token is NOT revoked: Google revokes a token's whole grant
-- (user and client), which the new token rides. Another Google account replaces the row whole (a new id, so nothing
-- sent to the old account is mistaken for the new one's): its unfinished sends end ("your send to old@ stopped when
-- you connected new@"), its finished ones forget every id of the old Drive (`cloud_connection_forget`), and its
-- refresh ciphertext comes back for the app to revoke (a different grant).
create or replace function public.cloud_connection_upsert(
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
    -- Another Google account: the old one's unfinished sends end, and every send of it forgets the old Drive.
    update public.cloud_exports j
       set status = 'canceled', stop_reason = 'account_changed', pause_reason = null, closed_at = now(),
           attention_at = null
     where j.connection_id = v_old.id and j.status in ('preparing', 'sending', 'paused', 'checking');
    get diagnostics v_ended = row_count;
    perform public.cloud_connection_forget(v_old.id);
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

-- Disconnect (Account, an operator's for an account's recovery, account deletion): her running sends end, every send
-- of the connection forgets every Google identifier (`cloud_connection_forget`) and keeps its counts, then the row and
-- its folders go. The ciphertexts come back so the app revokes at Google after the row is gone (a revoke Google does
-- not answer never keeps a key here).
create or replace function public.cloud_connection_disconnect(p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_ended integer := 0;
  v_forgotten integer := 0;
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
  v_forgotten := public.cloud_connection_forget(v_conn.id);
  delete from public.cloud_connections where id = v_conn.id;
  return jsonb_build_object(
    'found', true,
    'connection_id', v_conn.id,
    'ended', v_ended,
    'forgotten', v_forgotten,
    'refresh_ct', v_conn.refresh_ct,
    'access_ct', v_conn.access_ct
  );
end;
$$;

-- The sends a Disconnect already left behind (the walk's: their connection is gone, their items still named files in
-- P3's Drive): forgotten now, as every Disconnect forgets from here on.
update public.cloud_export_items i
   set drive_file_id = null,
       drive_md5 = null,
       session_uri = null,
       session_offset = null,
       status = case when i.status = 'leased' then 'pending' else i.status end,
       lease_token = null,
       leased_until = null,
       forgotten_at = now()
 where i.job_id in (select j.id from public.cloud_exports j where j.connection_id is null)
   and (i.drive_file_id is not null or i.drive_md5 is not null or i.session_uri is not null
        or i.lease_token is not null);

-- =============================================================================================
-- 3. A dying lane counts once
-- =============================================================================================

-- The last twenty Queue messages whose dying lane was counted: ample for a word's five minutes, since three dying lanes
-- in a day pause the connection.
alter table public.cloud_connections add column lane_failed_messages text[] not null default '{}';
alter table public.cloud_connections add constraint cloud_connections_lane_failed_messages_len
  check (cardinality(lane_failed_messages) <= 20);

drop function public.cloud_connection_lane_failed(uuid, text);

-- A LANE THAT DIED (`/api/internal/drive/lanefail`, a lane's last attempt, with or without a lease): the day's dead
-- lanes counted on the connection, and at three its sends pause `failing` until an operator resumes (a poison
-- connection pauses itself and never loops). ★ ONE COUNT A LANE: the word names its Queue message, and a message
-- already counted counts nothing, so the same word said again (a replay inside its five minutes, a post retried) can
-- never add up to a pause.
create function public.cloud_connection_lane_failed(p_connection uuid, p_error text, p_message text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_conn public.cloud_connections%rowtype;
  v_paused integer := 0;
  v_message text := left(btrim(coalesce(p_message, '')), 128);
begin
  if v_message = '' then
    raise exception 'cloud_connection_lane_failed: the dying lane''s message id is required' using errcode = '22004';
  end if;
  select * into v_conn from public.cloud_connections c where c.id = p_connection for update;
  if not found then
    return jsonb_build_object('found', false);
  end if;
  if v_message = any (v_conn.lane_failed_messages) then
    return jsonb_build_object('found', true, 'failures', v_conn.lane_failures, 'paused', 0,
                              'user_id', v_conn.user_id, 'repeat', true);
  end if;
  update public.cloud_connections
     set lane_failures = case when lane_failures_on is distinct from current_date then 1 else lane_failures + 1 end,
         lane_failures_on = current_date,
         lane_failed_messages = (lane_failed_messages || v_message)[greatest(cardinality(lane_failed_messages) - 18, 1):],
         last_error = left(p_error, 500),
         updated_at = now()
   where id = p_connection
   returning * into v_conn;
  if v_conn.lane_failures >= 3 then
    v_paused := public.cloud_export_pause(p_connection, null, 'failing', null);
  end if;
  return jsonb_build_object('found', true, 'failures', v_conn.lane_failures, 'paused', v_paused,
                            'user_id', v_conn.user_id, 'repeat', false);
end;
$$;

-- =============================================================================================
-- Grants: PUBLIC's default revoked first, then exactly the service role (the helpers no served role), restated for the
-- replaced bodies too, so this file says every grant it leaves.
-- =============================================================================================
revoke all on function public.cloud_export_settle(uuid) from public, anon, authenticated, service_role;
revoke all on function public.cloud_connection_forget(uuid) from public, anon, authenticated, service_role;
revoke all on function public.cloud_connection_upsert(uuid, text, text, boolean, text, text[], text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.cloud_connection_upsert(uuid, text, text, boolean, text, text[], text, text, timestamptz, timestamptz) to service_role;
revoke all on function public.cloud_connection_disconnect(uuid) from public, anon, authenticated;
grant execute on function public.cloud_connection_disconnect(uuid) to service_role;
revoke all on function public.cloud_connection_lane_failed(uuid, text, text) from public, anon, authenticated;
grant execute on function public.cloud_connection_lane_failed(uuid, text, text) to service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. Run it AFTER the apply, in one execute_sql call; it ends in a deliberate raise, so nothing it
-- touches persists (database-security.md, Workflow). The classes, pins and grants of what this file wrote, the old
-- lane word gone; the two columns and the restated CHECK; a send whose timed report moved it to checking staying
-- checking through its closing report and a direct settle, its next lease the check's first page, the page confirming
-- every file and closing it done (a two-page walk closing only at its end); a re-send whose files were all kept
-- carrying its bytes once, so the album's largest send is what is in her Drive; Disconnect forgetting every Google id
-- (files, MD5s, a session, a lease given back) and keeping states and counts; another Google account forgetting the
-- old Drive the same way; a dying lane's word said twice counting once, three messages pausing. The error it ends on
-- must read `ROLLED BACK: every cloud_export_fixes check held {...}`.
-- The lane ran it on the live project BEFORE the apply: the file's statements at the head of the same transaction,
-- rolled back (the Handoff).
-- =============================================================================================
-- do $check$
-- declare
--   v_host uuid := gen_random_uuid();
--   v_event uuid;
--   v_conn uuid;
--   v_job uuid;
--   v_job2 uuid;
--   v_r jsonb;
--   v_lease uuid;
--   v_items jsonb;
--   v_n integer;
--   v_report jsonb := '{}'::jsonb;
-- begin
--   -- ── 1. Classes, pins and grants ──
--   if not exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.cloud_connection_forget(uuid)')
--                   and p.prosecdef and p.proconfig @> array['search_path=""']) then
--     raise exception 'FAIL 1: cloud_connection_forget is not a pinned SECURITY DEFINER';
--   end if;
--   if not exists (select 1 from pg_proc p where p.oid = to_regprocedure('public.cloud_connection_lane_failed(uuid, text, text)')
--                   and p.prosecdef and p.proconfig @> array['search_path=""']) then
--     raise exception 'FAIL 1: cloud_connection_lane_failed(uuid, text, text) is not a pinned SECURITY DEFINER';
--   end if;
--   if to_regprocedure('public.cloud_connection_lane_failed(uuid, text)') is not null then
--     raise exception 'FAIL 1: the two-argument lane word still stands';
--   end if;
--   if has_function_privilege('service_role', 'public.cloud_connection_forget(uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.cloud_connection_forget(uuid)', 'execute')
--      or has_function_privilege('anon', 'public.cloud_connection_forget(uuid)', 'execute')
--      or has_function_privilege('service_role', 'public.cloud_export_settle(uuid)', 'execute') then
--     raise exception 'FAIL 1: a helper is executable by a served role';
--   end if;
--   if not has_function_privilege('service_role', 'public.cloud_connection_lane_failed(uuid, text, text)', 'execute')
--      or has_function_privilege('authenticated', 'public.cloud_connection_lane_failed(uuid, text, text)', 'execute')
--      or has_function_privilege('anon', 'public.cloud_connection_lane_failed(uuid, text, text)', 'execute')
--      or not has_function_privilege('service_role', 'public.cloud_connection_disconnect(uuid)', 'execute')
--      or has_function_privilege('authenticated', 'public.cloud_connection_disconnect(uuid)', 'execute') then
--     raise exception 'FAIL 1: a grant is not the service role''s alone';
--   end if;
--   if has_column_privilege('authenticated', 'public.cloud_exports', 'folder_id', 'select') then
--     raise exception 'FAIL 1: the progress grant widened';
--   end if;
--
--   -- ── Fixtures: a host on Pro, an album of 12 shown photographs, her connection ──
--   insert into auth.users (id, aud, role, email, email_confirmed_at)
--   values (v_host, 'authenticated', 'authenticated', 'drive-fixes-' || v_host || '@example.com', now());
--   update public.profiles set display_name = 'Maya', tier = 'pro', storage_cap_bytes = 50::bigint * 1024 * 1024 * 1024
--    where id = v_host;
--   insert into public.events (host_id, name) values (v_host, 'Maya & Jay') returning id into v_event;
--   insert into public.media (event_id, type, status, original_key, file_size_bytes, created_at)
--   select v_event, 'photo', 'approved', 'events/' || v_event || '/photo/' || gen_random_uuid() || '/original.jpg',
--          1000 + g, now() - make_interval(mins => 100 - g)
--     from generate_series(1, 12) g;
--   v_conn := (public.cloud_connection_upsert(v_host, 'sub-a', 'a@example.com', true, null, '{}', 'v1.k.r.ct',
--              'v1.k.a.ct', now() + interval '1 hour', null) ->> 'connection_id')::uuid;
--   v_job := (public.cloud_export_create(v_host, v_event, false, 'UTC') ->> 'job_id')::uuid;
--   perform public.cloud_export_ready(v_job, 'folder-1');
--
--   -- ── 2. A timed report carries the batch's last files (checking); the closing report and a settle leave it
--   --       checking; the next lease is the check's first page; the page confirms every file and closes it ──
--   -- Ten of the twelve in one lane's batch, reported on its timed beat; the last two in a second lane's.
--   v_r := public.cloud_export_lease(v_conn);
--   v_lease := (v_r ->> 'lease')::uuid;
--   select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'outcome', 'sent', 'file_id', 'f-' || (e ->> 'media_id'),
--                                       'md5', repeat('a', 32))) into v_items from jsonb_array_elements(v_r -> 'items') e;
--   perform public.cloud_export_report(v_lease, v_items, null, false);
--   v_r := public.cloud_export_lease(v_conn);
--   v_lease := (v_r ->> 'lease')::uuid;
--   select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'outcome', 'sent', 'file_id', 'f-' || (e ->> 'media_id'),
--                                       'md5', repeat('a', 32))) into v_items from jsonb_array_elements(v_r -> 'items') e;
--   v_r := public.cloud_export_report(v_lease, v_items, null, false);
--   if v_r ->> 'status' <> 'checking' then raise exception 'FAIL 2: the timed report did not settle into checking: %', v_r; end if;
--   -- That lane's batch ends: its closing report, done, nothing left to say.
--   v_r := public.cloud_export_report(v_lease, '[]'::jsonb, null, true);
--   if v_r ->> 'status' <> 'checking' or (select j.status from public.cloud_exports j where j.id = v_job) <> 'checking' then
--     raise exception 'FAIL 2: ★ the closing report closed a checking send nobody checked: %', v_r;
--   end if;
--   if public.cloud_export_settle(v_job) <> 'checking' then raise exception 'FAIL 2: a settle closed an unchecked send'; end if;
--   v_r := public.cloud_export_lease(v_conn);
--   if v_r ->> 'state' <> 'check' or not (v_r ->> 'first')::boolean or jsonb_array_length(v_r -> 'items') <> 12 then
--     raise exception 'FAIL 2: the next lease is not the check''s first page: %', v_r;
--   end if;
--   -- A walk part-way (a page that answered for its first six): still checking, and a settle mid-walk closes nothing.
--   select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'state', 'ok')) into v_items
--     from (select x from jsonb_array_elements(v_r -> 'items') x limit 6) s(e);
--   v_r := public.cloud_export_check_page((v_r ->> 'lease')::uuid, v_items, 0, null);
--   if v_r ->> 'status' <> 'checking' or public.cloud_export_settle(v_job) <> 'checking' then
--     raise exception 'FAIL 2: a walk part-way closed the send: %', v_r;
--   end if;
--   v_r := public.cloud_export_lease(v_conn);
--   if v_r ->> 'state' <> 'check' or (v_r ->> 'first')::boolean or jsonb_array_length(v_r -> 'items') <> 6 then
--     raise exception 'FAIL 2: the walk''s second page: %', v_r;
--   end if;
--   select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'state', 'ok')) into v_items
--     from jsonb_array_elements(v_r -> 'items') e;
--   v_r := public.cloud_export_check_page((v_r ->> 'lease')::uuid, v_items, null, null);
--   if v_r ->> 'status' <> 'done'
--      or exists (select 1 from public.cloud_export_items i where i.job_id = v_job and i.status = 'sent' and i.confirmed_at is null) then
--     raise exception 'FAIL 2: the check did not confirm every file and close it: %', v_r;
--   end if;
--
--   -- ── 3. A re-send whose files were all kept carries its bytes once: the album's largest send is what is in her
--   --       Drive (the Account card's sum), never the two sends added ──
--   v_job2 := (public.cloud_export_create(v_host, v_event, false, 'UTC') ->> 'job_id')::uuid;
--   perform public.cloud_export_ready(v_job2, 'folder-1');
--   for v_n in 1..5 loop
--     v_r := public.cloud_export_lease(v_conn);
--     exit when v_r ->> 'state' <> 'work';
--     select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'outcome', 'sent', 'file_id', e ->> 'prior_file_id',
--                                         'kept', true)) into v_items from jsonb_array_elements(v_r -> 'items') e;
--     perform public.cloud_export_report((v_r ->> 'lease')::uuid, v_items, null, true);
--   end loop;
--   if (select j.items_kept from public.cloud_exports j where j.id = v_job2) <> 12
--      or (select j.bytes_sent from public.cloud_exports j where j.id = v_job2)
--         <> (select j.bytes_sent from public.cloud_exports j where j.id = v_job)
--      or (select sum(b) from (select max(j.bytes_sent) as b from public.cloud_exports j where j.user_id = v_host
--            group by j.event_id) a) <> (select j.bytes_sent from public.cloud_exports j where j.id = v_job) then
--     raise exception 'FAIL 3: a kept re-send''s bytes: %', (select jsonb_agg(row_to_json(j)) from public.cloud_exports j where j.user_id = v_host);
--   end if;
--   v_report := v_report || jsonb_build_object('in_drive', (select j.bytes_sent from public.cloud_exports j where j.id = v_job));
--
--   -- ── 4. Disconnect forgets every Google id: files, MD5s, a live session, a lease given back; states and counts kept ──
--   perform public.cloud_export_act(v_host, v_job2, 'cancel', false);
--   update public.cloud_export_items set status = 'leased', lease_token = gen_random_uuid(), leased_until = now() + interval '5 minutes',
--          session_uri = 'https://up/s', session_offset = 4096, drive_file_id = null, drive_md5 = null
--    where job_id = v_job2 and media_id = (select i.media_id from public.cloud_export_items i where i.job_id = v_job2
--                                          order by i.media_id limit 1);
--   update public.cloud_exports set items_sent = items_sent - 1, items_kept = items_kept - 1 where id = v_job2;
--   v_r := public.cloud_connection_disconnect(v_host);
--   if not (v_r ->> 'found')::boolean or (v_r ->> 'forgotten')::integer < 24 then raise exception 'FAIL 4: disconnect: %', v_r; end if;
--   if exists (select 1 from public.cloud_export_items i join public.cloud_exports j on j.id = i.job_id
--               where j.user_id = v_host and (i.drive_file_id is not null or i.drive_md5 is not null
--                     or i.session_uri is not null or i.lease_token is not null or i.status = 'leased')) then
--     raise exception 'FAIL 4: ★ a Google id outlived the Disconnect';
--   end if;
--   if (select count(*) from public.cloud_export_items i where i.job_id = v_job and i.status = 'sent' and i.forgotten_at is not null) <> 12
--      or (select j.items_sent from public.cloud_exports j where j.id = v_job) <> 12
--      or (select j.folder_url from public.cloud_exports j where j.id = v_job) is not null then
--     raise exception 'FAIL 4: the finished send lost its states or counts, or kept its folder';
--   end if;
--
--   -- ── 5. Another Google account forgets the old Drive the same way ──
--   v_conn := (public.cloud_connection_upsert(v_host, 'sub-a', 'a@example.com', true, null, '{}', 'v1.k.r2.ct',
--              'v1.k.a2.ct', now() + interval '1 hour', null) ->> 'connection_id')::uuid;
--   v_job2 := (public.cloud_export_create(v_host, v_event, false, 'UTC') ->> 'job_id')::uuid;
--   perform public.cloud_export_ready(v_job2, 'folder-2');
--   v_r := public.cloud_export_lease(v_conn);
--   select jsonb_agg(jsonb_build_object('media_id', e ->> 'media_id', 'outcome', 'sent', 'file_id', 'g-' || (e ->> 'media_id')))
--     into v_items from jsonb_array_elements(v_r -> 'items') e;
--   perform public.cloud_export_report((v_r ->> 'lease')::uuid, v_items, null, false);
--   v_r := public.cloud_connection_upsert(v_host, 'sub-b', 'b@example.com', true, null, '{}', 'v1.k.r3.ct', null, null, null);
--   if v_r ->> 'outcome' <> 'other'
--      or exists (select 1 from public.cloud_export_items i where i.job_id = v_job2
--                  and (i.drive_file_id is not null or i.lease_token is not null))
--      or (select j.stop_reason from public.cloud_exports j where j.id = v_job2) <> 'account_changed' then
--     raise exception 'FAIL 5: another account kept the old Drive''s ids: %', v_r;
--   end if;
--   v_conn := (v_r ->> 'connection_id')::uuid;
--
--   -- ── 6. A dying lane's word said twice counts once; three messages pause ──
--   v_job2 := (public.cloud_export_create(v_host, v_event, false, 'UTC') ->> 'job_id')::uuid;
--   perform public.cloud_export_ready(v_job2, 'folder-3');
--   v_r := public.cloud_connection_lane_failed(v_conn, 'boom', 'msg-1');
--   v_r := public.cloud_connection_lane_failed(v_conn, 'boom', 'msg-1');
--   v_r := public.cloud_connection_lane_failed(v_conn, 'boom', 'msg-1');
--   if (v_r ->> 'failures')::integer <> 1 or not (v_r ->> 'repeat')::boolean
--      or (select j.status from public.cloud_exports j where j.id = v_job2) <> 'sending' then
--     raise exception 'FAIL 6: ★ a word said three times counted again: %', v_r;
--   end if;
--   perform public.cloud_connection_lane_failed(v_conn, 'boom', 'msg-2');
--   v_r := public.cloud_connection_lane_failed(v_conn, 'boom', 'msg-3');
--   if (v_r ->> 'failures')::integer <> 3 or (select j.pause_reason from public.cloud_exports j where j.id = v_job2) <> 'failing' then
--     raise exception 'FAIL 6: three lanes did not pause: %', v_r;
--   end if;
--   begin
--     perform public.cloud_connection_lane_failed(v_conn, 'boom', null);
--     raise exception 'FAIL 6: a word with no message was counted';
--   exception when null_value_not_allowed then null;
--   end;
--   v_report := v_report || jsonb_build_object('lane_failures', (v_r ->> 'failures')::integer);
--
--   raise exception 'ROLLED BACK: every cloud_export_fixes check held %', v_report;
-- end
-- $check$;
