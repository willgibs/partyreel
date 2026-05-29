-- Lock down trigger-only functions so they cannot be called directly as RPCs.
--
-- WHY: `handle_new_user`, `enforce_event_limit`, and `set_updated_at` are
-- SECURITY DEFINER functions wired to triggers. A trigger fires as the table
-- owner regardless of who holds EXECUTE, so revoking EXECUTE from the API roles
-- (anon/authenticated) does NOT stop the triggers — it only removes the ability
-- to invoke these functions directly via PostgREST. `get_advisors` flags any
-- SECURITY DEFINER function that anon/authenticated can execute; these three are
-- pure internal plumbing with no business reason to be callable, so we revoke.
--
-- NOTE for future agents: the four CAPABILITY-TOKEN RPCs
-- (get_event_by_qr_token, get_public_album, create_guest, create_media) are a
-- different case — they are INTENTIONALLY executable by anon/authenticated
-- because the opaque token IS the authorization (see ADR-0004). `get_advisors`
-- will keep reporting those four as WARN ("security_definer + grantable to
-- anon"); that is accepted-by-design, NOT a regression. Do not "fix" them by
-- revoking EXECUTE or you will break the entire anonymous guest flow.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_event_limit() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
