-- =============================================================================================
-- DRIVE'S CRUMBS (lane `drive-crumbs`, before Send to Google Drive goes live at milestone 38). Two lines a real host
-- could meet after a first connect and send:
--
--   1. ★ A RE-SEND AFTER A RECONNECT ADDS ONLY WHAT IS MISSING. A Disconnect forgets every Google id
--      (`cloud_connection_forget`), so a same-account Connect knew no album folder and no file: sending again sent the
--      album whole into a second same-named folder. The app now marks each album folder it makes (`appProperties`
--      `pr_event`, as the Partyreel folder carries `pr_root`) and a press that knows no live folder finds it by that
--      mark (src/lib/drive/google.ts `findAlbumFolder`). A send whose folder was FOUND rather than made says so in
--      `cloud_exports.folder_found` (set by `cloud_export_ready`'s new third argument), and its lease carries it, so the
--      Worker looks each file up by its own `pr_media` mark before sending it (a file already there is kept).
--   2. ★ "EVERY ONE CHECKED" MEANS EVERY ONE ANSWERED. A closing check's `files.get` that Google did not answer
--      (`unknown`: a slow down past the Worker's pace, its own trouble) was dropped by the check route while the cursor
--      walked past it, so a send could close "every one checked" over a file nobody confirmed. `cloud_export_check_page`
--      now takes `unknown` and holds the cursor at the first one (asked again on the next page; the page's lease kept a
--      minute so the lanes pace it), takes the check's own slow down as the connection's (`throttled`, as a report
--      does), and an hour of pages answering nothing marks the send stuck for /admin.
--
-- What changes:
--   - `cloud_exports.folder_found boolean not null default false` (catalog-only with a constant default; no client
--     grant: the progress columns are granted by name, and this is not one).
--   - `cloud_export_ready`: DROP and CREATE (an argument list cannot change in place), the body from 20261005120000
--     but for a defaulted third argument `p_found boolean default false` written to the send. Its grants restated
--     exactly (a DROP re-inherits PUBLIC's EXECUTE): the service role's alone.
--   - `cloud_export_lease`: CREATE OR REPLACE, verbatim from 20261005200000_capture_time but for one key on a send's
--     lease, `folder_found`. Its ACL restated as it stands.
--   - `cloud_export_check_page`: CREATE OR REPLACE, from 20261005120000 with the hold, the throttle and the stuck mark
--     (the same signature; its ACL restated as it stands).
--
-- ★ WHAT THE OLDER BUILD MEETS (partyreel.com runs milestone 37, where Drive reads "not set up"; the Worker is not
-- deployed): an expand. Its press calls `cloud_export_ready` by two names, which PostgREST resolves to the new
-- function with `p_found` at its default. A lease's new key is one no older build reads. Its check route drops
-- `unknown` before the call, as it always did, so the old walk stands until this lane's build ships.
-- ★ APPLY BEFORE PUSH: this lane's build names `p_found` (a PGRST202 on every press without it) and sends `unknown`
-- results, which the OLD check_page would read as missing and send again. The reverse order is safe.
--
-- LOCKS AT APPLY: the ADD COLUMN takes ACCESS EXCLUSIVE on cloud_exports for a catalog write (no rewrite: a constant
-- default since PG 11); the DROP/CREATE and the two replaces take no table lock.
--
-- THE PROTOCOL (database-security.md, "Workflow"): the drift read first, each body this file restates hashed live as
-- md5(btrim(regexp_replace(prosrc, '\s+', ' ', 'g'))) against its newest repo definition:
--   cloud_export_ready       (20261005120000_cloud_export)
--   cloud_export_lease       c92cf0439d5b687adb6ca61da496c0aa  (20261005200000_capture_time, its "applied" hash)
--   cloud_export_check_page  (20261005120000_cloud_export)
-- and `cloud_exports.folder_found` absent. ★ NOT YET RUN: this lane had no SQL access (the Orchestrator's word); the
-- drift read and the rolled-back proof at the foot are written ready to run, with the result each must show. Then
-- apply verbatim; get_advisors (EXPECTED DELTA: none: no function added, every grant restated as it stands); then
-- regenerate src/lib/db/types.ts (`cloud_exports.folder_found`, `p_found`), which drops the lane's one typed seam
-- (`markReady` in src/lib/db/queries/drive.ts: its argument folds back into the call).
-- =============================================================================================

-- =============================================================================================
-- 1. A send whose album folder was found by its mark
-- =============================================================================================
alter table public.cloud_exports add column folder_found boolean not null default false;

comment on column public.cloud_exports.folder_found is
  'The press found the album''s folder by its pr_event mark (a reconnect knows no ids) rather than made it: each item is looked up by its pr_media mark before it is sent, so a re-send adds only what is missing. Not a progress column: no client reads it.';

-- =============================================================================================
-- 2. cloud_export_ready: the folder, made or found
-- =============================================================================================
drop function public.cloud_export_ready(uuid, text);

-- THE FOLDER, MADE OR FOUND: a `preparing` send gets the album's folder and starts (`sending`); the folder is kept for
-- the album's next send on this connection. `p_found`: the press found it by its mark, so its files may be there.
create function public.cloud_export_ready(p_job uuid, p_folder_id text, p_found boolean default false)
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
         folder_found = coalesce(p_found, false),
         started_at = now()
   where id = p_job;
  return jsonb_build_object('ok', true, 'connection_id', v_conn);
end;
$$;

revoke all on function public.cloud_export_ready(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.cloud_export_ready(uuid, text, boolean) to service_role;

-- =============================================================================================
-- 3. cloud_export_lease: a send's lease says whether its folder was found
-- =============================================================================================
create or replace function public.cloud_export_lease(p_connection uuid)
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
  -- (each answer names the account the seals are bound to: their associated data, `tokens.server.ts`)
  if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '20 minutes' then
    v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                   'expires_at', v_conn.access_expires_at, 'user_id', v_conn.user_id);
  elsif v_conn.refresh_claimed_until > c_now then
    if v_conn.access_ct is not null and v_conn.access_expires_at > c_now + interval '12 minutes' then
      v_access := jsonb_build_object('state', 'cached', 'access_ct', v_conn.access_ct,
                                     'expires_at', v_conn.access_expires_at, 'user_id', v_conn.user_id);
    else
      return jsonb_build_object('state', 'wait', 'why', 'refresh');
    end if;
  else
    v_claim := true;
    v_access := jsonb_build_object('state', 'refresh', 'refresh_ct', v_conn.refresh_ct, 'user_id', v_conn.user_id);
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
             'captured_at', m.captured_at,
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
      -- drive-crumbs: the press found the album's folder by its mark (a reconnect), so a file may already be there.
      'folder_found', v_job.folder_found,
      'items', v_items,
      'access', v_access
    );
  end loop;

  return jsonb_build_object('state', 'idle');
end;
$$;

revoke all on function public.cloud_export_lease(uuid) from public, anon, authenticated;
grant execute on function public.cloud_export_lease(uuid) to service_role;

-- =============================================================================================
-- 4. cloud_export_check_page: the cursor holds at the first file Google did not answer for
-- =============================================================================================

-- ONE PAGE OF A SEND'S CLOSING CHECK (`/api/internal/drive/check`): the Worker asked Drive for each sent file by its
-- id. Confirmed, it stays sent; gone, in the bin or not what we sent, it goes back to pending once (sent again), then
-- fails (`missing`); unknown (Google did not answer) holds the walk there. The first page carries the duplicates the
-- folder's listing counted (counted and signalled, never binned). When no sent file is left past the cursor, the send
-- ends (or returns to sending for what went back). It decides the page and nothing else.
create or replace function public.cloud_export_check_page(
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
  v_hold uuid;
  v_answered integer := 0;
  v_conn public.cloud_connections%rowtype;
  v_status text;
  v_before text;
begin
  select * into v_lease from public.cloud_export_leases l where l.token = p_lease;
  if not found or v_lease.kind <> 'check' then
    return jsonb_build_object('state', 'stop', 'why', 'no_lease');
  end if;
  select * into v_conn from public.cloud_connections c where c.id = v_lease.connection_id for update;
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

  -- ★ THE HOLD (drive-crumbs): the first file Google did not answer for (`unknown`: a slow down past its pace, its own
  -- trouble) is where the cursor stops, so "every one checked" follows an answer for every one. What was answered past
  -- it is kept (a confirmation, or a file gone back to be sent again) and the held one is asked again on the next page.
  select min(i.media_id) into v_hold
    from jsonb_array_elements(coalesce(p_results, '[]'::jsonb)) r
    join public.cloud_export_items i
      on i.job_id = v_job.id and i.media_id = (r ->> 'media_id')::uuid and i.status = 'sent'
         and (v_job.check_after is null or i.media_id > v_job.check_after)
   where r ->> 'state' = 'unknown';

  -- Google's slow down on the check's own asks paces the whole connection, as a send's does (`cloud_export_report`).
  if p_finding = 'throttled' then
    update public.cloud_connections
       set throttled_until = c_now + interval '2 minutes',
           concurrency = 2,
           concurrency_until = c_now + interval '30 minutes',
           throttled_since = coalesce(throttled_since, c_now)
     where id = v_conn.id;
    if v_conn.throttled_since is not null and v_conn.throttled_since < c_now - interval '2 hours' then
      perform public.cloud_export_pause(v_conn.id, null, 'daily_limit', c_now + interval '1 hour');
    end if;
  end if;

  for v_entry in select * from jsonb_array_elements(coalesce(p_results, '[]'::jsonb))
  loop
    if v_entry ->> 'state' not in ('ok', 'missing') then
      continue;
    end if;
    select * into v_item from public.cloud_export_items i
     where i.job_id = v_job.id and i.media_id = (v_entry ->> 'media_id')::uuid and i.status = 'sent'
       and (v_job.check_after is null or i.media_id > v_job.check_after)
     for update;
    if not found then
      continue;
    end if;
    v_answered := v_answered + 1;
    if (v_hold is null or v_item.media_id < v_hold) and (v_last is null or v_item.media_id > v_last) then
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
         -- A page Google answered nothing of is no progress: an hour of them marks the send stuck for /admin (the
         -- sweep's own mark reads only sends still sending), and the next answer clears it.
         last_progress_at = case when v_answered > 0 then c_now else last_progress_at end,
         stuck_since = case
                         when v_answered > 0 then null
                         when stuck_since is null
                              and coalesce(last_progress_at, resumed_at, started_at) < c_now - interval '1 hour'
                           then c_now
                         else stuck_since
                       end
   where id = v_job.id;
  -- A held page keeps its lease a minute: the lanes pace the held file's next ask rather than spin on it, and take
  -- other work meanwhile (the lease skips a send whose check is leased).
  update public.cloud_export_leases
     set leased_until = case when v_hold is not null then c_now + interval '1 minute' else c_now end
   where token = p_lease;

  -- A slow down that paused the connection (Google's day by another name) leaves the send paused where it stands.
  select j.status into v_status from public.cloud_exports j where j.id = v_job.id;
  if v_status = 'checking' then
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
  end if;

  return jsonb_build_object(
    'state', 'ok',
    'connection_id', v_lease.connection_id,
    'job_id', v_job.id,
    'user_id', v_job.user_id,
    'before', v_before,
    'status', v_status,
    'back', v_back,
    'failed', v_failed,
    'held', v_hold is not null,
    'duplicates', p_duplicates
  );
end;
$$;

revoke all on function public.cloud_export_check_page(uuid, jsonb, integer, text) from public, anon, authenticated;
grant execute on function public.cloud_export_check_page(uuid, jsonb, integer, text) to service_role;
