# ADR-0009 — Saved events (accounts-from-guest growth loop)

- **Status:** Accepted (2026-06-02)
- **Phase:** Config/permissions rework — Phase 3 (final phase)

## Context

A visitor had no reason to make an account: there was no way to **save an event** to come back to
it (people paste links into Notes). Phase 2 (ADR-0008) already turns a verifying guest into a free
account; Phase 3 gives every visitor a reason to create that account. This is the growth payoff of
the rework, and it must NOT regress the zero-friction anonymous capability flow (ADR-0004) — the
upload pipeline is untouched.

## Decision

A new `saved_events(user_id, event_id, saved_at, PK(user_id, event_id))` table with both FKs
`on delete cascade` (deleting the event OR the account removes the save) and **per-user RLS**
(`auth.uid() = user_id`). "Save events" is **FREE** — it is the account-creation growth driver, not
a paid feature.

- **The Save button is the primary growth lever, shown to EVERYONE (including signed-out visitors).**
  For a signed-out visitor it IS the account-creation moment: clicking opens a "create a free account
  to save this event" dialog (the shared `<EmailSignIn>` code-first OTP + Google). It lives on the
  event page header AND the album footer, surfaced proactively (not only after an upload). A one-time
  post-upload card (`<SaveAccountPrompt>`) is the high-intent reprise; it **replaced** the separate
  newsletter email-capture prompt (the newsletter opt-in is folded into the save dialog as a checkbox
  — account-first).

- **Write = a capability RPC, never a client id.** `save_event(p_qr_token, p_share_token)` (SECURITY
  DEFINER, **authenticated-only**) resolves the event from whichever **token** the page holds (proving
  access), **refuses `private` events and your-own events** (owner → no-op), and inserts idempotently
  (`on conflict do nothing`). We do NOT accept a client-supplied `event_id` (matches the app's
  "never trust the client" stance), even though `event_id` isn't secret. Unsave + the saved-status
  check are plain per-user **RLS** calls straight from the browser client (no server round-trip needed).

- **Read honors visibility + the capability split.** `get_saved_events()` (SECURITY DEFINER,
  **authenticated-only**, `auth.uid()`-based — NO `p_user_id` arg) reads the name/host/cover of events
  the saver does NOT own (events RLS is host-only, so a plain select returns nothing). It MASKS by
  visibility: `open` → name + host + date + cover; `password` → same BUT **cover NULL** (password media
  is gated behind the unlock cookie — a thumbnail would leak it); `private` → everything NULL +
  `accessible=false`; deleted → excluded. It returns ONLY **`share_token`** (the album capability),
  **never `qr_token`** — handing a share-only saver the upload token would escalate view→upload, which
  the capability split forbids. Saved cards therefore link to `/a/[share_token]`. The cover key is
  presigned server-side (raw R2 keys never reach the browser, ADR-0003).

- **Advisors:** `save_event` + `get_saved_events` are the **only** two new functions — both appear in
  the authenticated SECURITY-DEFINER advisor list (lint 0029) and **NEVER** the anon list (0028).
  `saved_events` has an RLS policy, so it gets no `rls_enabled_no_policy` INFO. (+2 authenticated, 0
  new anon — asserted post-migration.)

- **Dashboard reframe.** "Your events" + "Saved" tabs over a shared cover-art `<EventCard>` (owned
  covers come from one batched newest-approved-media query; saved covers from the RPC). The whole
  dashboard gained cover art.

## Consequences

- Any visitor can save an event and revisit it; saving an event is the moment a free account is
  created (account-from-guest, ADR-0008). The growth loop closes.
- Anonymous, non-saving uploads are unchanged (capability tokens, no account).
- A saved event that the host later makes private shows as a disabled "Private event" card (masked);
  deleting the event removes the save (cascade).
- Extends ADR-0004 (capability tokens) + ADR-0008 (account-from-guest): the account layer sits ON TOP
  of the anonymous flow, never replacing it.
- The `/api/guests/email` route is now unreferenced (its only caller, the newsletter prompt, was
  replaced) — left in place (a valid `capture_guest_email` entry point) as a later cleanup.
