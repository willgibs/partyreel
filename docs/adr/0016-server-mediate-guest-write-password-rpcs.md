# ADR-0016: Server-mediate the guest write/password RPCs

**Status:** Accepted (2026-06-08). Hardens the anon-RPC posture of [ADR-0014](0014-data-layer-security-posture.md) for the guest WRITE/password path; the READ RPCs and the capability-token model ([ADR-0004](0004-anonymous-guests-capability-tokens.md)) are unchanged.

## Context

The guest capability RPCs were `EXECUTE`-granted to `anon` so the passwordless guest flow (ADR-0004) could call them with the public anon key. A live black-hat pentest (2026-06-08) proved this grant IS the attack surface: each RPC is directly callable via PostgREST (`/rest/v1/rpc/<fn>` + the public anon key), **bypassing every route-level guard**.

- **H1 (critical):** `create_media` / `create_media_as_host` trusted the client `p_file_size_bytes`, bypassing the ADR-0014 R2-HEAD authority. The storage cap + monthly-ingress meters are `SUM(file_size_bytes)`, so a spoofed size = cap evasion = a cost bomb (a single anon call with `-1 TiB` drove the meters to −1 TiB; the `415962b` CHECK then blocked the negative case, but `size=1` undercount remained).
- **H2 (high):** `verify_event_password` bypassed the unlock route's venue-NAT-aware rate limiter (30 unthrottled guesses) → an online password oracle against a 4-char minimum.
- **H3 (medium):** `create_report` / `create_guest` / `capture_guest_email` had no DB-layer rate limit; `capture_guest_email` additionally trusted a client `p_email` (victim newsletter poisoning).

ADR-0014's size fix (R2-HEAD at complete) lived ONLY in the Next route — which the anon RPC bypassed. **The lesson: enforce at the boundary the attacker actually reaches; an anon RPC grant IS the attack surface, not the route wrapping it.**

## Decision

**Server-mediate** the six write/password RPCs: `revoke execute … from public, anon, authenticated` (service-role-only), and have the existing Next route handlers invoke them via the **service-role admin client** (`createAdminClient`) with **server-derived trusted values**:

- R2-HEAD `file_size_bytes` (the complete-upload routes already derive it).
- `create_media_as_host` takes a trusted `p_host_id` (was `auth.uid()`, which is NULL under the admin client) from the route's `getUser()`; the RPC's ownership join uses it.
- `create_guest` takes a trusted `p_user_id` from `getUser()`; the verified email is read SERVER-side from `auth.users` for that id (the client `p_email` param is dropped — it was the only injection surface).
- `capture_guest_email` gets a new `/api/guests/capture-email` route that derives the email from the verified session, never the client body.

The **READ** RPCs stay anon (`get_event_by_qr_token`, `get_event_media_by_qr_token`, `get_upload_context`) — they only read visibility-gated state. **Anonymous uploads remain a first-class feature** (identical UX): the `session_token` is still the capability, now validated inside a service-role-only RPC.

Adjacent hardening: the unlock limiter keeps its fail-OPEN posture (availability-first; bcrypt + the password are the gate) but now **Sentry-alerts** on a limiter-store error (a silent outage would be an open window); a **client-side unlock pre-throttle** keeps honest-traffic cost off Vercel; the password **minimums are kept** (8 accounts / 4 events) with a soft live **strength meter** as guidance rather than character-class rules.

**Deferred:** a venue-NAT-aware per-IP rate limit for `create_guest` / `create_report`. A naive per-IP cap would block legitimate venue crowds (a wedding behind one WiFi NAT = many legit joins/IP), so it needs the unlock limiter's count-failures/clear-on-success design — its own pass. Vercel's edge firewall is the volumetric backstop meanwhile.

## Consequences

- No meaningful Vercel-cost change (five of six already route through Next; +1 thin capture-email route). Only the internal DB credential changes (anon → service-role).
- The advisor `0028` anon set shrinks 8 → 3 (reads only); the six become service-role-only (in NEITHER 0028 nor 0029). [database-security.md](../systems/database-security.md) updated to match.
- The `415962b` `media.file_size_bytes` CHECK `[0, 10 GiB]` remains the belt-and-braces floor.
- **Verified live** (2026-06-08): each pentest attack now returns `42501 permission denied`; legit host upload (5.7 MB), guest upload (10 MB), anonymous join, report, newsletter opt-in, and password unlock (200 + cookie; limiter 20→429) all still work.
