-- Reel Phase 2: the style catalog (media-first moods + stylized treatments) + a portrait/landscape orientation,
-- persisted per reel. Additive: adds style_id + orientation to highlight_reels (backfilled from the legacy
-- `theme` column, whose values are all valid mood styleIds), and adds a NEW upsert_reel_config overload taking
-- p_style_id + p_orientation. The OLD (p_theme) overload is KEPT so the currently-deployed composer keeps
-- working during the deploy window (PostgREST disambiguates the two by their named args); a follow-up drops it
-- once the new composer is live. The render path derives the ReelTheme from style_id via the pure style-registry.

alter table public.highlight_reels
  add column if not exists style_id    text not null default 'classic',
  add column if not exists orientation text not null default 'portrait';

update public.highlight_reels set style_id = theme where theme is not null;

alter table public.highlight_reels drop constraint if exists highlight_reels_orientation_chk;
alter table public.highlight_reels
  add constraint highlight_reels_orientation_chk check (orientation in ('portrait','landscape'));

create or replace function public.upsert_reel_config(
  p_event_id uuid,
  p_style_id text,
  p_orientation text,
  p_seed bigint,
  p_length_seconds int default null,
  p_cover_media_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid    uuid := (select auth.uid());
  v_owns   boolean;
  v_cover  uuid := p_cover_media_id;
  v_orient text := case when p_orientation in ('portrait','landscape') then p_orientation else 'portrait' end;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'unauthorized');
  end if;

  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.host_id = v_uid
      and e.deleted_at is null
  ) into v_owns;
  if not v_owns then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_cover is not null and not exists (
    select 1 from public.media m where m.id = v_cover and m.event_id = p_event_id
  ) then
    v_cover := null;
  end if;

  insert into public.highlight_reels
    (event_id, style_id, theme, orientation, seed, length_seconds, cover_media_id, status)
  values
    (p_event_id, p_style_id, p_style_id, v_orient, p_seed, p_length_seconds, v_cover, 'pending')
  on conflict (event_id) do update
    set style_id       = excluded.style_id,
        theme          = excluded.theme,
        orientation    = excluded.orientation,
        seed           = excluded.seed,
        length_seconds = excluded.length_seconds,
        cover_media_id = excluded.cover_media_id,
        updated_at     = now();

  return jsonb_build_object('ok', true);
end;
$function$;

revoke all on function public.upsert_reel_config(uuid, text, text, bigint, int, uuid) from public;
revoke all on function public.upsert_reel_config(uuid, text, text, bigint, int, uuid) from anon;
grant execute on function public.upsert_reel_config(uuid, text, text, bigint, int, uuid) to authenticated;