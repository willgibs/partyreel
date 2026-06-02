# ADR-0010 — One link per event (consolidate qr_token + share_token)

- **Status:** Accepted (2026-06-02)
- **Phase:** One-link consolidation (Part 1) — a follow-on to the config/permissions rework,
  surfaced during Phase 3 live testing.
- **Supersedes:** the two-token capability split in [ADR-0004](0004-anonymous-guests-capability-tokens.md)
  (the capability-token mechanism itself is UNCHANGED — only the qr/share split is removed).

## Context

Every event used to expose TWO opaque links: `/e/[qr_token]` (the event page — view + upload, driven
by configs) and `/a/[share_token]` (a separate read-only album). The host UI even rendered both
side-by-side. This forced the host to choose which link to send and forced us to explain the
difference to guests — the opposite of the "just visit this link" promise. The split's only real
benefit (simultaneously sharing a public *view* link while keeping the *upload* link restricted) is a
rare case the config model handles better anyway.

## Decision

**One link per event: `/e/[qr_token]`** (what the QR already encodes). What a guest sees is driven
entirely by the host's existing configs — `visibility` (open / password / private) gates access,
`accepting_uploads` gates contributing, `require_email` gates identity. "View-only album after the
event" is just `accepting_uploads = false`, a *state* of the one page rather than a second URL.

- **`share_token` is DROPPED entirely** (column + the `/a/` route + `get_public_album`). The
  capability split retires: with one token, possession of the link grants whatever the configs allow.
  `get_saved_events` returning the qr_token is now correct (there is no view→upload escalation to
  prevent). **ADR-0004's "share_token and qr_token must not derive each other" no longer applies.**
- **RPC reworks** (one migration): `create_report` + `verify_event_password` + `save_event` all key
  off `qr_token` (drop the `p_share_token` param); `get_saved_events` returns `qr_token`;
  `get_public_album` is dropped. The unlock cookie is unchanged (already per-`event_id`). **Advisors:
  the anon SECURITY-DEFINER list shrinks by exactly one** (`get_public_album` gone) — now 8.
- **OG moves to `/e/`** (`(guest)/e/[token]/opengraph-image.tsx`) so the one link unfurls with the
  event name (private events fall back to a generic card, no name leak). The `/a/` OG is deleted.
- **Saved events / reports / host UI** relink to the single event link: saved cards → `/e/[qr_token]`;
  the report control + `create_report` use `qr_token` and the report mounts on `/e/`; the dashboard +
  create-wizard show ONE link (QR + copy) with **config-aware copy** ("view and add photos" / "view,
  uploads closed" / "view with the password" / "private"); `share-urls.ts` collapses to `eventUrl`;
  the two host metrics collapse to one "views". `MakeYourOwn` (an `/a/`-footer growth CTA) is dropped
  (the `/e/` header already carries the growth CTA).

## Consequences

- Hosts share ONE link; guests always "just open the link." The view-only "album" is a config state.
- Old `/a/[share_token]` links 404 — acceptable (pre-launch, only disposable test data existed).
- The `link_hit_kind` enum keeps the now-unused `album_view` value (don't drop enum values; the admin
  metrics still read historical counts); the host page records only `qr_scan`.
- **Part 2 (SHIPPED, commit `d4b0902`): the event-page flow redesign** — header → a quiet
  `[Save event] [Invite]` action row → upload (only when accepting) → gallery, contiguous. `GuestShare`
  became an Invite trigger + dialog (QR + copy/share/download behind one button); uploads-off removes the
  upload panel entirely (the view-only state) with a quiet "uploads closed" line; and the page RSC gates
  `needsEmailVerification` on `accepting_uploads` too (uploads-off wins → view-only, never a verify
  prompt). Shipped as the chosen "Quiet action row" (QR folded into the Invite dialog, not inline);
  the post-upload `SaveAccountPrompt` was kept. Live-verified across the full visibility × upload × auth
  matrix on prod. The poll/optimistic/session machinery is unchanged.
- Extends ADR-0004 (capability tokens stay) and refines ADR-0007 (visibility) + ADR-0009 (saved
  events now link to `/e/`).
