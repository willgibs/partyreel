-- Reel COMPOSER config — turns the highlight_reels scaffold into the host's editable reel settings.
--
-- The curation foundation (reel_items) holds the ordered media; this adds the COMPOSITION config the
-- live @remotion/player reads: theme (a kit id), seed (shuffle), length cap, cover (opening shot). One
-- reel per event (the composer assumes a single reel — the unique index enables the upsert's on-conflict).
--
-- Security: status/output_key are set by the RENDER pipeline (slice 3, service-role/RPC), NOT the host.
-- So we LOCK DOWN host table writes here (the column-lock guardrail: revoke the TABLE write grants — a
-- column-level revoke is a silent no-op while a table grant stands), and route the config write through
-- the SECURITY DEFINER upsert below (mirrors add_to_reel / reorder_reel). SELECT stays (RLS-gated to the
-- host's own event via the existing highlight_reels_host_all policy).

alter table public.highlight_reels
  add column theme          text   not null default 'classic',  -- a THEMES kit id (validated app-side; no enum so new kits add freely)
  add column seed           bigint not null default 0,          -- shuffle: a new seed = a new deterministic take
  add column length_seconds int,                                -- null = auto (theme/clip-count default)
  add column cover_media_id uuid references public.media(id) on delete set null;  -- pinned opener; cleared if that media is deleted

-- One reel per event (the composer is single-reel; multiple-reels is a deferred Pro upgrade). Required
-- for the upsert's `on conflict (event_id)`.
create unique index highlight_reels_one_per_event on public.highlight_reels (event_id);

-- Covering index for the cover FK (speeds the on-delete-set-null check when a cover media is deleted).
create index highlight_reels_cover_media_id_idx on public.highlight_reels (cover_media_id);

-- Lock the host out of direct writes (status/output_key are render-pipeline-only). SELECT remains.
revoke insert, update, delete on table public.highlight_reels from authenticated;

-- upsert_reel_config — lazy create-or-update the host's reel config. The reel row is created on the
-- first compose edit. Mirrors reorder_reel: a host-owns-the-event check, a jsonb {ok, reason?} return,
-- the locked-down grant. A cover that isn't a media row of THIS event is softly nulled (a removed or
-- crafted cover degrades gracefully instead of failing the whole save).
create function public.upsert_reel_config(
  p_event_id       uuid,
  p_theme          text,
  p_seed           bigint,
  p_length_seconds int  default null,   -- null = auto length
  p_cover_media_id uuid default null    -- null = no pinned cover (opener = first in order)
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_owns  boolean;
  v_cover uuid := p_cover_media_id;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  -- The caller must HOST the event (and it must not be deleted). Mirrors reorder_reel's event check.
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Soft-validate the cover belongs to this event, else null it (graceful, never rejects the save).
  if v_cover is not null and not exists (
    select 1 from public.media m where m.id = v_cover and m.event_id = p_event_id
  ) then
    v_cover := null;
  end if;

  insert into public.highlight_reels
    (event_id, theme, seed, length_seconds, cover_media_id, status)
  values
    (p_event_id, p_theme, p_seed, p_length_seconds, v_cover, 'pending')
  on conflict (event_id) do update
    set theme          = excluded.theme,
        seed           = excluded.seed,
        length_seconds = excluded.length_seconds,
        cover_media_id = excluded.cover_media_id,
        updated_at     = now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Lockdown identical to reorder_reel: revoke the implicit grants (incl. the anon EXECUTE a Supabase-MCP
-- create would add), then grant ONLY to authenticated.
revoke all on function public.upsert_reel_config(uuid, text, bigint, int, uuid) from public, anon, authenticated;
grant execute on function public.upsert_reel_config(uuid, text, bigint, int, uuid) to authenticated;
