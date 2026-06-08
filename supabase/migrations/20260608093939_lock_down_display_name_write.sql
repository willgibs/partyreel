-- Phase 1 (uploader-attribution identity): display_name is shown publicly, so its required +
-- profanity + reserved-name checks (updateDisplayNameAction) must be authoritative. Make the column
-- service-role-write-only so a direct client UPDATE can't bypass them. Revoke the TABLE-level UPDATE
-- first (a column-level revoke is a silent no-op while a table grant stands), then re-grant only the
-- columns the client legitimately self-updates -- dropping display_name. (markWelcomed + the
-- notification bell write welcomed_at / announcements_seen_at via the RLS client; email is never
-- client-written but stays granted to keep the change minimal.)
revoke update on public.profiles from authenticated;
grant update (email, announcements_seen_at, welcomed_at) on public.profiles to authenticated;

-- handle_new_user: leave display_name NULL for ALL signups (including OAuth). Onboarding prefills the
-- still-required, profanity-checked name input from user_metadata, so EVERY stored display_name flows
-- through the one guarded write path -- no unfiltered OAuth name can ever land. (Was a coalesce of
-- display_name / full_name / name from raw_user_meta_data.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;
