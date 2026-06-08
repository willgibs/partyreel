# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the `require_email` OTP gate, silent join, the auth-aware header island, the live gallery polling, demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), saved-events internals (→ [notifications-analytics-growth.md](notifications-analytics-growth.md)), host-side event config (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page — ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
is driven by the host's configs. The opaque `qr_token` IS the authorization (ADR-0004); there is ONE link
per event (ADR-0010 — the old `/a/[share_token]` album + `get_public_album` are gone).
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

## Flow (top to bottom, contiguous)

Auth-aware header → event header ("Hosted by" name+avatar) → a quiet **`[Save event] [Invite]` action
row** → the upload panel (only when accepting) → the live gallery. The share is no longer wedged between
upload and gallery (one-link Part 2, ADR-0010). `GuestShare` ([`guest-share.tsx`](../../src/components/guest/guest-share.tsx))
is an **Invite trigger + dialog** (QR + Copy link + native Share + Download), not an inline card.

## State follows `visibility` (ADR-0007) — a 3-state enum, NOT a boolean

- **`private`** = the master lock → a locked screen (no name / gallery / upload); `generateMetadata` hides the name.
- **`password`** → a `<PasswordGate>` (name shown — it's link-shared, not the secret) until a signed unlock
  cookie is present, then the full experience.
- **`open`** → the full experience.
- **`accepting_uploads=false`** = the **view-only STATE** of the one page: the upload panel is removed
  entirely (a quiet "uploads closed" line), leaving the action row + gallery.

## Invariants (don't break)

- **The opaque token IS the authorization (ADR-0004)** — never give `anon` direct table access; the guest
  RPCs validate the token internally. → [database-security.md](database-security.md).
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`.** A password event's media must
  NEVER stream through `get_event_media_by_qr_token` / the anon path; it is served ONLY via the server
  admin-read (`getApprovedMediaForUnlock`, self-guarded by the unlock cookie) after `/api/guests/unlock`
  verifies the password. The bcrypt hash never leaves the DB (RPCs expose `has_password` only).
- **The unlock cookie is a signed HMAC of `{eid,exp}`** (`UNLOCK_COOKIE_SECRET`, ~12 h) — the cookie *name*
  isn't the boundary, the **signed eid** is. Password is set/cleared ONLY by `set_event_password` /
  `clear_event_password` (host-auth SECURITY DEFINER; the column is revoked from the host UPDATE grant).
- **The page calls `getUser()` ONLY when `event.require_email`** — an anonymous event crowd behind one
  venue-NAT IP must not each pay a server auth round-trip (rate-limit risk). The header island resolves
  auth with a LOCAL `getSession()` (no network); do NOT add a server `getUser()` to the page RSC.
- **`needsEmailVerification` is gated on `accepting_uploads`** in the page RSC (`accepting_uploads &&
  require_email && !isDemo`) — a closed event NEVER shows `<VerifyEmailPrompt>` (uploads-off wins →
  view-only). Don't drop the `accepting_uploads &&`.

## Joining + identity

- **Silent, just-in-time, field-less for the common case:** a first-time guest picks files → `POST
  /api/guests {qr_token}` → `create_guest` issues a `session_token` (localStorage, returning-guest) behind
  the scenes → upload. Guest display names were REMOVED (cut 2b); `create_guest` is 2-arg.
- **`require_email` = a VERIFIED email via OTP** (ADR-0008): a PAGE-LEVEL gate swaps the upload slot for
  `<VerifyEmailPrompt>` (the shared [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx) — 6-digit
  code + magic-link), the gallery stays visible. `create_guest` derives identity (`user_id` + `email`) from
  `auth.uid()`, NEVER the client — `require_email` = "a confirmed session"; on verify it stamps
  `guests.user_id` (account-from-guest). The require-email collection is a page gate, not a just-in-time prompt.

## Live gallery + optimistic uploads

- The gallery seeds from an SSR batch then **polls `/api/guests/gallery` every ~12 s** (paused on
  `document.hidden`) + refetches on each upload. **Reconcile by id — do NOT `setState` the raw poll
  result:** each poll re-presigns, so URLs change every call; replacing wholesale re-downloads every `<img>`
  every 12 s. Keep existing items' URLs by id; presign only genuinely-new items
  ([`merge-gallery-items.ts`](../../src/lib/guest/merge-gallery-items.ts)).
- **Optimistic tiles only for LIVE-approved media:** a completed upload prepends a local `createObjectURL`
  tile (deduped against the poll by media id, then the blob is revoked) — but ONLY when `create_media`
  returned `approved`. Hold-for-approval items stay pending. The queue reads a `sessionRef` synced in an
  effect (refs can't be written in render).

## Auth-aware header island

[`guest-header.tsx`](../../src/components/guest/guest-header.tsx): logged-out → a quiet "Start for free"
CTA (the SSR default → zero flash for the anonymous majority); logged-in → the visitor's account menu
([`guest-account-menu.tsx`](../../src/components/guest/guest-account-menu.tsx)), fetched via `GET
/api/me/menu?event=<id>` ONLY when a session exists (the avatar is the viewer's public Storage URL; event-ownership
is an RLS-scoped select → the owner-only "Manage event" deep link). The menu's **Sign out** clears the guest
capability (`setStoredSession(qrToken, null)` via the module-singleton `emit()` in
[`use-stored-session.ts`](../../src/lib/guest/use-stored-session.ts)), signs out, then `router.refresh()`s —
so the visitor STAYS on the event page and a `require_email` event re-gates to `<VerifyEmailPrompt>` (the
shared-device-bleed fix).

## Demo mode

Env-gated (`NEXT_PUBLIC_DEMO_QR_TOKEN`; [`demo.ts`](../../src/lib/demo.ts)): `isDemo` is threaded from the
page through `event-experience.tsx`; the ~12 s poll is paused, the silent join skips `POST /api/guests`, and
the queue skips the real upload — `simulateUpload` returns a synthetic `approved` outcome so the optimistic
tile appears but is **never persisted**. The marketing side of the demo → [marketing-content.md](marketing-content.md).

## See also

[ADR-0004](../adr/0004-anonymous-guests-capability-tokens.md) · [ADR-0007](../adr/0007-event-visibility-password-protection.md) · [ADR-0008](../adr/0008-account-from-guest-verified-email.md) · [ADR-0010](../adr/0010-one-link-per-event.md) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
