-- =============================================================================================
-- THE DOORBELL SAYS WHEN A RING IS ONE WHOLE WRITE (lane `crumbs-61`, red-team 48's LOW: "Develop now reaches each guest on
-- her own 15 s beat", +0.38 s, +0.84 s and +7.2 s after the host's own screen, up to fifteen by design).
--
-- THE GAP. Every ring is the same contentless ping on the same channel: an arrival (`notify_gallery_change`, a row at a
-- time) and the ring that stands for a whole write (`album_doorbell`, which a write that moved many rows rings once after
-- holding its per-row pings: a Develop now or a develop time reached, `develop_due` and `events_develops_rewrite`, and a
-- hold released, `events_hold_released`). The album's batch clock (album-calm, `src/lib/guest/refresh-coalescer.ts`) was
-- made for a stream of arrivals, and so makes every guest learn a develop on her own beat: the cover lifts on the host's
-- screen and a guest's eyebrow says developed a few seconds to a quarter of a minute later. A develop is one moment, never
-- a stream, and a device cannot tell it from an arrival by anything the ping carries, because it carries nothing.
--
-- WHAT CHANGES, one body. `album_doorbell(uuid)` sends `{"moment": true}` where it sent `{}`: the same event ('ping'), the
-- same topic, the same exception guard, so the channel, the trigger path and every listener that ignores the payload are
-- untouched. The guest's doorbell (`src/lib/guest/use-gallery-doorbell.ts`, through `refresh-coalescer.ts`'s `isMoment`)
-- reads exactly this key (held to it by `use-gallery-doorbell.sql.test.ts`) and asks at once instead of at its next tick;
-- an arrival's ping stays `{}` (`notify_gallery_change` is not touched) and waits for the tick as before. The signature,
-- the language, the (invoker) security and the empty `search_path` are the foundation's (20261002200000), so
-- `create or replace` keeps its owner-only grants; they are restated below all the same.
--
-- AN EXPAND, in both orders. Deployed before this applies, the new client sees a ring that says nothing and batches it, as
-- today; applied before the new client deploys, the old client ignores a payload it never read. Nothing is dropped, no
-- type changes (`album_doorbell`'s is `{ Args: { p_event_id: string }; Returns: undefined }` as before), and the Realtime
-- message a ring bills is the same one message a listener.
--
-- LOCKS AT APPLY: `create or replace function` takes a brief lock on the function's own catalog row; no table is touched.
--
-- APPLY PROTOCOL (database-security.md -> Workflow):
--   (1) drift, read-only: the live body is the foundation's, `realtime.send('{}'::jsonb, 'ping', ...)`:
--         select pg_get_functiondef('public.album_doorbell(uuid)'::regprocedure);
--   (2) apply this file by name through `apply_migration` (`doorbell_moment`), then match the live body to this file's.
--   (3) `get_advisors`: nothing new (a replaced body, no grant moved).
--   (4) no types to regenerate.
-- =============================================================================================

create or replace function public.album_doorbell(p_event_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_qr text;
begin
  select e.qr_token into v_qr
    from public.events e
   where e.id = p_event_id and e.deleted_at is null;
  if v_qr is null then
    return;
  end if;
  begin
    -- `moment`: this ring stands for ONE WRITE that moved many rows (its per-row pings were held), so a listener asks at
    -- once rather than waiting for its batch tick. An arrival's ping (`notify_gallery_change`) stays contentless.
    perform realtime.send('{"moment": true}'::jsonb, 'ping', 'gallery:' || v_qr, false);
  exception when others then
    null; -- a realtime failure must never fail the write that rang
  end;
end;
$$;

comment on function public.album_doorbell(uuid) is
  'One doorbell ping for an event (gallery:<qr_token>), for a write that held its per-row pings (develop_due, a save of develops_at, a hold released). Its payload is {"moment": true}: one ring for a whole write, which a listener answers at once where an arrival''s contentless ping waits for the batch tick. Swallows a realtime failure. The owner''s alone: only definer bodies call it.';

revoke all on function public.album_doorbell(uuid) from public, anon, authenticated, service_role;

-- =============================================================================================
-- THE ROLLED-BACK CHECK. ONE `execute_sql` call of `begin;`, the FIXTURES it names (none: it rides an EXISTING disposable
-- event), then (GREEN) this file's statements verbatim, then the PROOF block below, then
-- `select n, step, ok, detail from proof order by n; rollback;`. RED: the same call WITHOUT this file's statements, on
-- today's schema, where step 1 fails on what it lacks (the ring is `{}`) and steps 2 and 3 hold (they guard what must not
-- move). Nothing persists, and nothing reaches Realtime: a message inserted in a transaction that rolls back is never
-- replicated. ★ `realtime.send` stamps its own `id` beside the payload, and every message of one transaction shares one
-- `inserted_at`, so the check reads what a step ADDED by id and compares the payload without its `id`.
-- Proved on the live schema 2026-10-03: RED 1 false, 2 true, 3 true; GREEN 1 true, 2 true, 3 true; afterwards the live body
-- was still today's, the event still had its 18 visible shots and no `moment` message had persisted.
--
-- create temp table proof (n int, step text, ok boolean, detail text);
--
-- do $$
-- declare
--   v_event uuid := 'aefb1f5d-1a6b-461a-949f-aabe44ea79a0';  -- "Reel lane probe (disposable)": any live event with an approved shot
--   v_qr text;
--   v_media uuid;
--   v_seen uuid[];
--   v_new jsonb[];
-- begin
--   select e.qr_token into v_qr from public.events e where e.id = v_event and e.deleted_at is null;
--   select m.id into v_media from public.media m
--    where m.event_id = v_event and m.status = 'approved' and m.sealed_until is null order by m.created_at limit 1;
--   if v_qr is null or v_media is null then raise exception 'the check needs a live event with an approved, unsealed shot'; end if;
--
--   -- 1. THE RING FOR A WHOLE WRITE says so.
--   begin
--     v_seen := array(select (m.payload->>'id')::uuid from realtime.messages m where m.topic = 'gallery:' || v_qr);
--     perform public.album_doorbell(v_event);
--     v_new := array(select m.payload - 'id' from realtime.messages m where m.topic = 'gallery:' || v_qr and m.event = 'ping' and (m.payload->>'id')::uuid <> all (v_seen));
--     insert into proof values (1, 'album_doorbell rings {"moment": true}', v_new = array['{"moment": true}'::jsonb], v_new::text);
--   exception when others then insert into proof values (1, 'album_doorbell rings {"moment": true}', false, sqlerrm);
--   end;
--
--   -- 2. AN ARRIVAL'S PING stays contentless: a visible shot hidden fires the per-row trigger, one `{}` ping, never a moment.
--   begin
--     v_seen := array(select (m.payload->>'id')::uuid from realtime.messages m where m.topic = 'gallery:' || v_qr);
--     update public.media set status = 'hidden' where id = v_media;
--     v_new := array(select m.payload - 'id' from realtime.messages m where m.topic = 'gallery:' || v_qr and m.event = 'ping' and (m.payload->>'id')::uuid <> all (v_seen));
--     insert into proof values (2, 'a row''s own ping stays {}', v_new = array['{}'::jsonb], v_new::text);
--   exception when others then insert into proof values (2, 'a row''s own ping stays {}', false, sqlerrm);
--   end;
--
--   -- 3. THE FUNCTION'S SHAPE is the foundation's: invoker, empty search_path, void, owner-only (no client role can run it).
--   insert into proof select 3, 'signature, security and grants unchanged',
--     (select p.prosecdef = false and p.prorettype = 'void'::regtype and p.proconfig = array['search_path=""']
--             and not has_function_privilege('anon', p.oid, 'execute') and not has_function_privilege('authenticated', p.oid, 'execute')
--             and not has_function_privilege('service_role', p.oid, 'execute')
--        from pg_proc p where p.oid = 'public.album_doorbell(uuid)'::regprocedure),
--     'invoker, void, search_path empty, revoked from every client role';
-- end $$;
--
-- select n, step, ok, detail from proof order by n;
-- rollback;
-- =============================================================================================
