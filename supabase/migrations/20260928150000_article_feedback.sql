-- =============================================================================================
-- THE HELP CENTER'S FEEDBACK BEACON (lane `help-wiring`, help-center r1 `feedback=beacon`).
--
-- Will's pick: "One insert per click, visible only in admin; the reader sees the same thank-you or
-- sorry." "Did this answer your question?" used to flip local state and throw the answer away, so
-- nobody could tell which of the library's articles lose their reader. This is the count.
--
-- WHAT THIS FILE DOES:
--   1. public.article_feedback   one row a click: the article's slug, Yes or No, and when. Nothing
--                                else: no IP, no account, no device, no free text, so the row can
--                                never identify its reader. DENY-ALL (RLS on, no policy) with every
--                                client grant revoked, so `anon` and `authenticated` cannot read,
--                                write or count it through PostgREST: the only writer is the
--                                service-role route `/api/help/feedback`, behind its rate limit
--                                (`action_attempts`, kind `help_feedback`), and it answers with no
--                                body, so nothing a reader sends can be read back.
--   2. article_feedback_summary  the admin's one read: per-article Yes and No counts with the last
--                                click, newest first, as ONE jsonb value (the row cap's one-row
--                                shape; the catalog bounds the slugs anyway). SECURITY INVOKER and
--                                service-role only, so the advisor lists do not grow.
--
-- ★ NO FK AND NO SLUG TABLE: the articles are MDX files, not rows. The route refuses a slug the
-- catalog does not hold, and the CHECK below keeps anything that is not slug-shaped out even if a
-- future caller forgets to.
-- =============================================================================================

create table public.article_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  slug text not null,
  helpful boolean not null,
  constraint article_feedback_slug_shape check (
    char_length(slug) between 1 and 120
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

-- The 24h signal's head count and the page's newest-first read ride the first; the per-article
-- grouping the second.
create index article_feedback_created_idx on public.article_feedback (created_at desc);
create index article_feedback_slug_idx on public.article_feedback (slug, created_at desc);

alter table public.article_feedback enable row level security;
-- Deny-all: no RLS policy. And no client grant at all, reads included: `anon` has no table access
-- (the brief's words), where the export_log precedent left a SELECT that RLS alone refused.
revoke all on table public.article_feedback from public, anon, authenticated;
grant select, insert on table public.article_feedback to service_role;

create or replace function public.article_feedback_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'slug', s.slug,
        'helpful', s.helpful,
        'not_helpful', s.not_helpful,
        'last_at', s.last_at
      )
      order by s.last_at desc, s.slug
    ),
    '[]'::jsonb
  )
  from (
    select
      f.slug,
      count(*) filter (where f.helpful) as helpful,
      count(*) filter (where not f.helpful) as not_helpful,
      max(f.created_at) as last_at
    from public.article_feedback f
    group by f.slug
  ) s;
$$;

-- The MCP default-grant landmine: a function created through it inherits an anon EXECUTE that a bare
-- `revoke ... from public` leaves in place, so every client role is named.
revoke all on function public.article_feedback_summary() from public, anon, authenticated;
grant execute on function public.article_feedback_summary() to service_role;
