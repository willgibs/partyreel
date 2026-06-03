-- Display-name "set" semantics (Phase 2 of the profile-photos work).
--
-- Stop deriving a display_name from the email local-part: leave it NULL when the user has not
-- set a real name, so the guest "Hosted by {name}" byline (Phase 3) can show ONLY when a name
-- is genuinely set ("display_name is not null"). Google/OAuth signups still populate it from
-- full_name/name. Every existing display_name READER already tolerates null (UserMenu, admin,
-- saved-events, the byline) and falls back to the email, so nulling is safe app-wide.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    )
  );
  return new;
end;
$$;

-- One-time backfill: reclassify auto-derived names (display_name == email local-part) as
-- "unset" (null). Real names from Google (which differ from the email prefix) are preserved.
-- Edge: a Google user whose real name happens to equal their email prefix is also nulled here
-- (rare); they just re-enter it once in /account. Acceptable.
update public.profiles
set display_name = null
where display_name is not null
  and email is not null
  and display_name = split_part(email, '@', 1);
