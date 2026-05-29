# ADR-0004 — Anonymous guests via capability tokens + security-definer RPCs

- **Status:** Accepted (2026-05-28)
- **Phase:** 0 (RPCs authored), 2 (guest flow wired)

## Context

The entire product thesis is **zero-friction guest contribution**: scan a QR,
type a name, upload. That means guests must act **without an account** — no
Supabase Auth user, so `auth.uid()` is `NULL` for them. RLS policies key off
`auth.uid()`, so an anonymous guest has no identity to authorize against, and we
must **never** open direct table access to the `anon` role (that would expose
every event's data).

We need guests to do a constrained set of things — join an event, read its
public album, create media — scoped to exactly one event, with caps enforced.

## Decision

Use **capability tokens** validated inside **`security definer` RPCs**:

- Each event has opaque, unguessable tokens: `qr_token` (join/upload) and
  `share_token` (public album). Possession of a token is the authorization — it
  is a **capability key**, not an identity.
- Guests never touch tables directly. They call a small set of `security definer`
  functions that run as the table owner and validate the token before doing
  anything:
  - `get_event_by_qr_token(qr_token)` — event info for the join screen.
  - `get_public_album(share_token)` — approved media only (returns R2 keys for
    server-side presigning; see ADR-0003).
  - `create_guest(qr_token, display_name, email?)` — issues a 256-bit
    `session_token`.
  - `create_media(session_token, …)` — validates the session, checks the event
    is accepting uploads, re-checks universal + tier caps, sets status from the
    event's moderation mode, and atomically updates the storage ledger.
- All functions pin `search_path = ''` and fully-qualify object names to prevent
  search-path hijacking. `grant execute … to anon, authenticated` on exactly
  these four.
- Trigger-only functions (`handle_new_user`, `enforce_event_limit`,
  `set_updated_at`) had their EXECUTE **revoked** from `anon`/`authenticated` —
  triggers still fire (they run as owner) but the functions can't be called
  directly.

## Consequences

- **+** Guests contribute with no account and no JWT; the DB enforces scope and
  caps even though the client is untrusted.
- **+** Tokens are easy to rotate/revoke per event (regenerate the column).
- **⚠ Accepted trade-off:** `get_advisors` flags the four RPCs as "SECURITY
  DEFINER, executable by anon." **This is intentional and must not be
  'fixed.'** The token is the auth; revoking EXECUTE breaks the guest flow. This
  is documented in CLAUDE.md and STATUS.md so future advisor runs don't alarm.
- **−** Security lives in SQL function bodies — they must be written carefully
  (validate the token first, defend the key prefix, enforce caps) and reviewed as
  security-critical code.
- **−** Tokens in URLs are bearer credentials: anyone with the link can act
  within that capability. That's the intended sharing model, but it means links
  must be treated as secrets and surfaces should avoid leaking them.
