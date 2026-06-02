# ADR-0007 — 3-state album visibility + Pro password protection

- **Status:** Accepted (2026-06-02)
- **Phase:** Config/permissions rework — Phase 1

## Context

Album access was a single `events.is_public` boolean — a "master lock": off → the guest `/e/`
page renders a locked screen and `/a/` 404s; on → anyone with the link can view. Hosts of
semi-private events wanted a middle ground: a shareable album gated by a password. This is
**Phase 1** of a larger, deliberate config/permissions rework (access → uploads/identity →
accounts/saved events; see the master plan).

## Decision

Replace `is_public` with a 3-state `event_visibility` enum (`open | password | private`) and a
**Pro-only** password middle ground.

- **Schema:** `events.visibility` (enum, default `open`) + `events.event_password_hash` (bcrypt,
  nullable). The hash column is **revoked from the host's UPDATE grant**; it is written ONLY by two
  host-authenticated SECURITY DEFINER RPCs — `set_event_password` / `clear_event_password` — which
  re-check ownership + non-free tier + a min length, and flip `visibility` atomically.
  `set_event_password` is the ONLY path to `visibility='password'`. `clear` reverts to `open` only
  when currently `password` (never private → open).
- **The bcrypt hash NEVER leaves the DB.** RPCs expose `has_password = (… IS NOT NULL)` only, and
  the host reads (`getEvent`/`listEvents`) drop the hash before returning a hash-free `HostEvent`
  to the client.
- **The anon media RPCs gate on `visibility = 'open'`** (NOT `<> 'private'`). A password event's
  media must never stream through `get_event_media_by_qr_token` / `get_public_album`; it is served
  only via a server-side **admin-read** (service-role) AFTER a signed unlock cookie is verified
  (`getApprovedMediaForUnlock`, self-guarded by `isUnlocked`).
- **Unlock:** a 9th anon capability RPC `verify_event_password(qr|share, password)` returns the
  event id on a bcrypt match. `/api/guests/unlock` then sets a signed, httpOnly, event-scoped
  cookie — `pr_unlock_<eventId>` = HMAC of `{eid,exp}` with `UNLOCK_COOKIE_SECRET` (~12 h). The
  page/poll verify the cookie (timing-safe) and admin-read the media. The cookie NAME is not the
  boundary — the signed `eid` is.
- **Page state machine:** private → locked screen (master lock); password + no cookie →
  `<PasswordGate>` (name shown — link-shared, not the secret); password + cookie → full content via
  admin-read; open → unchanged.

## Consequences

- **+** A real middle ground (shareable + gated) without weakening the capability model — the
  password layers ON TOP of the existing tokens, not a replacement; the contribution pipeline is
  untouched.
- **+** The hash never reaches a browser (host or guest). The unlock cookie is forge/replay-safe
  (signed eid + exp inside the MAC, timing-safe verify, fails closed if `UNLOCK_COOKIE_SECRET` is
  unset).
- **⚠ Accepted:** `verify_event_password` is the **9th** anon SECURITY DEFINER RPC in the
  `get_advisors` list (extends ADR-0004's accepted set). `set/clear_event_password` are
  authenticated-only (revoked from PUBLIC), so they appear only in the authenticated advisor list.
  A shared album password is a bearer secret (a party shares it widely); bcrypt cost is the only
  brute-force throttle for v1 (accepted; an explicit rate-limit is a deferred follow-up).
- **−** A password event reads media via the service-role admin client behind the cookie check —
  one more privileged read path, kept self-guarded.
- **Human prereq:** `UNLOCK_COOKIE_SECRET` must be set in Vercel + `.env.local` before unlock works
  live (the app builds without it; the route fails closed if unset).
