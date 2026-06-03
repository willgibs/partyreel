-- Custom event slugs (Phase 2) — the live availability oracle.
--
-- check_slug_available answers ONLY "is this slug free among live events?" — the one thing
-- the client can't know. Format / reserved-word / token-shape checks stay client-side in
-- eventSlugSchema; the tier gate + the authoritative uniqueness enforcement stay in
-- set_event_slug (this is advisory — a slug can be taken between the check and the save, and
-- set_event_slug's 23514/23505 rejection remains the backstop). p_event_id is excluded so a
-- host re-typing their event's CURRENT slug reads "available".
--
-- GOTCHA (see CLAUDE.md): functions created via the Supabase MCP apply_migration inherit a
-- default privilege that GRANTS EXECUTE to `anon`, so `revoke ... from public` alone is NOT
-- enough — revoke from `anon` too. This is a host-only feature; it must land on the
-- authenticated (0029) advisor list, NEVER the anon (0028) one.
create function public.check_slug_available(p_slug text, p_event_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.events
    where lower(custom_slug) = lower(trim(p_slug))
      and deleted_at is null
      and id is distinct from p_event_id
  );
$$;

revoke execute on function public.check_slug_available(text, uuid) from public, anon;
grant execute on function public.check_slug_available(text, uuid) to authenticated;
