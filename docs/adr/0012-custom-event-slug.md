# ADR-0012 — Custom event slugs (a host-chosen alias to the one event link)

- **Status:** Accepted (2026-06-03)
- **Phase:** One-off task — Phase 1 (foundation). Phase 2 (the polished live availability-feedback
  UX) is a separate planning round.
- **Extends:** [ADR-0010](0010-one-link-per-event.md) (one link per event) and
  [ADR-0004](0004-anonymous-guests-capability-tokens.md) (capability tokens). It does **not**
  supersede them: the `qr_token` stays the sole capability; the slug is a cosmetic alias.

## Context

Hosts share an event via one opaque permanent link, `/e/<qr_token>` (the QR encodes it). The 32-hex
token is unguessable but ugly to type or say out loud. Pro and Event-Pass hosts asked for a
human-friendly link they can print on an invite or text to guests ("partyreel.com/e/sarahs-wedding"),
editable anytime.

The risk: ADR-0010 had just collapsed the old two-token model to one link. A custom slug must NOT
reintroduce a second *capability* (a separate link with different permissions) — exactly the
complexity ADR-0010 removed.

## Decision

**A custom slug is an optional ALIAS to the one link, not a second capability.** It resolves through
the *same* `/e/[token]` route to the same event, and access stays entirely config-gated (visibility /
accepting_uploads / require_email). The permanent `/e/<qr_token>` link never changes and the QR always
encodes it.

- **`events.custom_slug`** (nullable text), case-insensitively unique among non-deleted events (a
  partial unique index `where custom_slug is not null and deleted_at is null`). Pro/Event-Pass only.
  RPC-write-only: the column is revoked from the host UPDATE grant; `set_event_slug` /
  `clear_event_slug` (authenticated-only SECURITY DEFINER, tier-gated) are the only writers — exactly
  the `event_password_hash` pattern.
- **Resolution:** `get_event_by_qr_token(p_qr_token)` now matches `qr_token OR lower(custom_slug)`
  (qr_token winning) and additionally RETURNS the canonical `qr_token`. The guest page threads that
  canonical token to every downstream qr_token-keyed call (the media poll, `create_guest`,
  `save_event`, `create_report`, `verify_event_password`) — a slug arrival resolves once, then behaves
  identically to a token arrival. (This threading is load-bearing: those RPCs match `qr_token` only,
  so a slug passed straight through would empty the live gallery + break save/report/join.)
- **Mutable, no redirects.** Changing or removing a slug frees the old one immediately for other
  events; there is deliberately NO old→new redirect (the old link simply 404s). Soft-deleting an event
  frees its slug too. A 32-hex slug is rejected (it could shadow the token namespace); a reserved-word
  list (brand/clarity, NOT routing) is enforced in the app layer (`lib/constants/reserved-slugs.ts`).
- **Downgrade = dormant, removable.** When a host loses Pro, the existing slug keeps resolving and can
  be Removed, but can't be Changed/Created until re-upgrade — mirroring the password feature exactly
  (never break a link a guest already holds).

## Consequences

- **URL shape is `/e/<slug>`** (chosen over a top-level `/<slug>` vanity URL): zero route-collision
  risk, reuses the existing route + its noindex + OG, least surface area. A top-level vanity URL stays
  a future option (the reserved-word list is forward-compatible).
- The `qr_token` is now exposed in the resolver's return (so the page can thread it). No privilege
  change — slug and token grant identical, config-gated access (ADR-0010), so this is not a leak.
- **Advisors:** +3 authenticated SECURITY-DEFINER functions (`set_event_slug` / `clear_event_slug` /
  `check_slug_available`), 0 new anon (the anon list stays the 8 ADR-0010 capability RPCs). Gotcha caught + fixed in a
  corrective migration: functions created via the Supabase MCP `apply_migration` inherit a default
  privilege that grants `anon` EXECUTE, so a host-only RPC needs an explicit `revoke ... from anon`
  (not just `from public`) — see CLAUDE.md.
- **Phase 2 (SHIPPED 2026-06-03, live-verified):** debounced LIVE availability as you type
  (idle→checking→available/taken/invalid via the authenticated `check_slug_available` RPC, called from
  the browser with a request-id race guard); a change/remove warning DIALOG (both break the live link,
  so both confirm); a name-derived suggestion chip (`suggestSlug`); and the editor reused in the create
  wizard's Share step. The sync classification is the pure `evaluateSlugInput`; the slug helpers live in
  `lib/slug.ts`. `EventSlugControl` was the shell these layered onto.
