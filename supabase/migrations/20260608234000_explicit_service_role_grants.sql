-- Grant-explicitness hygiene for the server-mediated RPCs (ADR-0016 follow-up).
--
-- WHY: when create_media / create_report / capture_guest_email were locked to service-role-only, the
-- migration REVOKED execute from public/anon/authenticated but did NOT re-grant to service_role explicitly —
-- they kept working only via Supabase's IMPLICIT default-privilege grant to service_role. Verified live
-- (has_function_privilege('service_role', …) = true), so this is NOT a live break — it's an auditability /
-- robustness gap: the least-privilege model should be EXPLICIT, and an explicit grant survives any future
-- default-privilege change. (create_guest, create_media_as_host, verify_event_password already grant
-- explicitly.) No behavior change.

grant execute on function public.create_media(
  text, uuid, public.media_type, text, bigint, text, double precision, integer, integer
) to service_role;

grant execute on function public.create_report(text, uuid, text) to service_role;

grant execute on function public.capture_guest_email(text, text, boolean) to service_role;
