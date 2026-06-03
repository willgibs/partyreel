-- Corrective: lock set_event_slug / clear_event_slug to authenticated-only (advisor 0029),
-- OFF the anon API (0028). They authorize via auth.uid() so anon already fails closed, but a
-- host-write RPC must never be anon-executable.
--
-- GOTCHA (see CLAUDE.md): functions created via the Supabase MCP apply_migration inherit a
-- default privilege that GRANTS EXECUTE to `anon` on new public functions, so the
-- `revoke ... from public` in the original migration (which sufficed for the older,
-- CLI-created set_event_password) did NOT remove anon's grant. has_function_privilege
-- confirmed anon could still execute these. Explicitly revoke anon. Any future host-only RPC
-- created via the MCP must `revoke ... from anon` (not just `from public`).
revoke execute on function public.set_event_slug(uuid, text) from anon;
revoke execute on function public.clear_event_slug(uuid) from anon;
