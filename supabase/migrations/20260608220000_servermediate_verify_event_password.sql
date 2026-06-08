-- Server-mediate verify_event_password (H2: unthrottled password brute-force oracle). Part B/H2.
--
-- ROOT CAUSE: verify_event_password was EXECUTE-granted to anon/authenticated, so it was directly
-- callable via PostgREST, BYPASSING the /api/guests/unlock route's venue-NAT-aware rate limiter (proven:
-- 30 unthrottled guesses, correct guess returns the event id = an online oracle vs a 4-char min).
--
-- FIX: make it SERVICE-ROLE-ONLY. The unlock route now calls it via the admin client, so EVERY attempt
-- is forced through the limiter (the limiter is now the sole, unbypassable throttle on guessing). No
-- signature change -- it's qr_token + password keyed, never reads auth.uid().
revoke execute on function public.verify_event_password(text, text) from public, anon, authenticated;
grant execute on function public.verify_event_password(text, text) to service_role;
