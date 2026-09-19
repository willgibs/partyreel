-- profile_rpc_anon_viewer_gate (2026-09-19, the Orchestrator, after profile-wiring's 20260919120000):
-- that migration replaced get_public_profile from the June body (20260708120000) and dropped the
-- QA #36 clause 20260729180000 had added to the attended arm (an open but account-required album
-- hides its guest list from an anonymous viewer, so this reverse surface must too). The body below
-- is the July definition plus the bio key: every gate, in the July order, and nothing else.
create or replace function public.get_public_profile(p_slug text) returns jsonb
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'display_name', p.display_name,
    'bio', p.bio,
    'avatar_updated_at', p.avatar_updated_at,
    'created_at', p.created_at,
    'hosted_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date,
               'visibility', e.visibility,
               'qr_token', e.qr_token,
               'custom_slug', e.custom_slug
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.host_id = p.id
        and e.display_in_profile
        and e.deleted_at is null
    ), '[]'::jsonb),
    'attended_events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id,
               'name', e.name,
               'event_date', e.event_date
             ) order by e.event_date desc nulls last, e.created_at desc)
      from public.events e
      where e.deleted_at is null
        and e.show_guest_list
        -- open-only: gated (password/private) events never leak name/date or
        -- attendance to anonymous profile viewers.
        and e.visibility = 'open'
        -- QA #36: open BUT account-required resolves to `teaser` for an anonymous viewer, and the
        -- album hides its Guests section below `full`. Mirror that here so this reverse surface
        -- never discloses membership the album itself withholds from the same viewer.
        and (e.allow_anonymous_uploads or (select auth.uid()) is not null)
        and e.host_id <> p.id
        and exists (
          select 1
          from public.guests g
          join public.media m on m.guest_id = g.id and m.status = 'approved'
          where g.event_id = e.id and g.user_id = p.id
        )
        and not exists (
          select 1 from public.profile_hidden_events h
          where h.user_id = p.id and h.event_id = e.id
        )
    ), '[]'::jsonb)
  )
  from public.profiles p
  where p.slug is not null
    and p.slug = lower(trim(p_slug));
$$;

revoke execute on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
