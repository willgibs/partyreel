# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the `allow_anonymous_uploads` account gate ("Enter event"), silent join, the auth-aware header island, the live gallery polling, demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), saved-events internals (→ [notifications-analytics-growth.md](notifications-analytics-growth.md)), host-side event config (→ [host-app.md](host-app.md)).
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
Each gallery tile (a desktop hover-reveal) + the lightbox carry a **like** button (Phase 5 — a favorite on
one media, distinct from the event-level Save); a signed-out tap opens the SAME create-account dialog as
Save (a `LikesProvider` wraps the gallery, replaying the like after sign-in). Like COUNTS are host-only, so
they're never shown here → [host-app.md](host-app.md), [database-security.md](database-security.md).

## State follows `visibility` (ADR-0007) — a 3-state enum, NOT a boolean

- **`private`** = the master lock → a locked screen (no name / gallery / upload); `generateMetadata` hides the name.
- **`password`** → a `<PasswordGate>` (name shown — it's link-shared, not the secret) until a signed unlock
  cookie is present, then the full experience.
- **`open`** → the full experience, UNLESS account-required (`allow_anonymous_uploads=false`): a signed-out
  viewer then gets a teaser (see "Gallery access" below).
- **`accepting_uploads=false`** = the **view-only STATE** of the one page: the upload panel is removed
  entirely (a quiet "uploads closed" line), leaving the action row + gallery.

## Gallery access: `none` / `teaser` / `full` (the gated VIEW, P1)

Viewing is no longer all-or-nothing. A pure `resolveGalleryAccess(event, {isOwner, isAuthed, isUnlocked})`
([`gallery-access.ts`](../../src/lib/events/gallery-access.ts)) maps a viewer to one level, enforced
IDENTICALLY by the RSC and the poll via the server-only `loadGalleryForAccess`
([`gallery-access.server.ts`](../../src/lib/events/gallery-access.server.ts)):

- **`full`** — the whole gallery. The owner (host), any signed-in viewer of an account-required event, an
  unlocked viewer of a password event with no account gate, and the demo. Open + anonymous-allowed is always
  full (unchanged).
- **`teaser`** — the newest `TEASER_LIMIT` (9) approved PHOTOS + a total count (a "+N more" caption); the rest
  withheld. Shown to a NOT-signed-in viewer of an account-required event (open, or password AFTER unlock). The
  account is the incentive to see the rest.
- **`none`** — nothing real. A password event BEFORE the unlock cookie. The privacy rule: real teaser photos
  appear ONLY once the password is proven (never before it).

★ **The withheld set never reaches the browser** — the teaser is a capped server read (`getApprovedPhotoTeaser`,
self-guarded by visibility, photos-only, `count:'exact'` for the total), NOT a CSS blur over a loaded gallery,
so dev-tools or a direct poll call can't reveal it. ★ **The poll enforces the SAME level** — it was previously
unauthenticated, so gating only the RSC would be a trivial bypass. This is P1; the unified entry modal (P2,
folding in `<PasswordGate>` + `<EnterEventPrompt>`) and the host "Require guest accounts" relabel (P3) follow
(→ [ROADMAP.md](../ROADMAP.md)).

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
- **The page calls `getUser()` for every non-private, non-demo event** (to resolve the access level + the
  identity gates — the gate must know whether the viewer is signed in; P1 relaxed this from the old
  upload-path-only call). With NO session it's a cheap LOCAL null (no network), so an anonymous event crowd
  behind one venue-NAT IP doesn't each pay an auth round-trip; the owner check (`isEventOwner`, an explicit
  `host_id = uid` match — NOT reliant on the open-event RLS read) runs ONLY when signed in. The header island
  still resolves its own auth with a LOCAL `getSession()`.
- **Upload slot follows the access level + `accepting_uploads`** (a closed event is view-only, never gated):
  `access === 'teaser'` → swap the slot for the account step (`<EnterEventPrompt>`, the path to `full`);
  otherwise, while accepting, `needsName` (signed in but no `display_name`) → the required name step (the upload
  is attributed), else the upload panel. Anonymous uploaders on an anonymous-allowed event are never gated.
  (`needsAccount` was REMOVED — the `teaser` access state subsumes it.)

## Joining + identity

- **Silent, just-in-time, field-less for the common case:** a first-time guest picks files → `POST
  /api/guests {qr_token}` → `create_guest` issues a `session_token` (localStorage, returning-guest) behind
  the scenes → upload. Guest display names were REMOVED (cut 2b); `create_guest` is 2-arg.
- **`allow_anonymous_uploads = false` ⇒ an account is required to SEE the full gallery AND to upload** (P1
  gated the VIEW too: a signed-out viewer gets the teaser, see "Gallery access"; renamed + inverted from
  `require_email`, ADR-0015; default is ON, turning it off is Pro-gated). The account step swaps the upload
  slot for `<EnterEventPrompt>` — an email-primary "Enter event" (the shared
  [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx); one tap = create account OR log in) with a
  secondary password login; the gallery stays visible. `create_guest` derives identity (`user_id` + `email`)
  from `auth.uid()`, NEVER the client, and raises when `not allow_anonymous_uploads` and there's no confirmed
  session; on a session it stamps `guests.user_id` (account-from-guest). No verification-only paths exist — an
  account simply proves ownership. A signed-in uploader with no `display_name` then hits the required name step.
- **Claiming anonymous uploads on sign-in (P3):** an anonymous upload is a `guests` row with `user_id IS
  NULL`; the browser still holds its `session_token` in `localStorage` (`pr_session_{qr_token}`). When the
  visitor later authenticates, a client helper ([`claim-uploads.ts`](../../src/lib/guest/claim-uploads.ts))
  enumerates those tokens (by the shared `SESSION_PREFIX` in [`session-tokens.ts`](../../src/lib/guest/session-tokens.ts))
  and calls the authenticated `claim_anonymous_uploads(text[])` RPC, which stamps `user_id = auth.uid()` onto
  the still-unclaimed matches (`user_id IS NULL` ⇒ never steals an owned row; ≤1000 bound; never writes
  `email`, preserving the verified-at-join invariant). Fires from a mount in the `(app)` layout (a loud "added
  your uploads" toast) + the guest `EventExperience` (silent, so it never stacks with the "Saved" toast) + the
  in-page sign-in handlers; module-level guards dedupe, and the RPC's `IS NULL` makes a reload's re-run a
  silent 0-op (no sessionStorage flag). P4's Uploads tab will key on the `guests.user_id` this populates.

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
so the visitor STAYS on the event page and an account-required event re-gates to `<EnterEventPrompt>` (the
shared-device-bleed fix).

## Demo mode

Env-gated (`NEXT_PUBLIC_DEMO_QR_TOKEN`; [`demo.ts`](../../src/lib/demo.ts)): `isDemo` is threaded from the
page through `event-experience.tsx`; the ~12 s poll is paused, the silent join skips `POST /api/guests`, and
the queue skips the real upload — `simulateUpload` returns a synthetic `approved` outcome so the optimistic
tile appears but is **never persisted**. The marketing side of the demo → [marketing-content.md](marketing-content.md).

## See also

[ADR-0004](../adr/0004-anonymous-guests-capability-tokens.md) · [ADR-0007](../adr/0007-event-visibility-password-protection.md) · [ADR-0008](../adr/0008-account-from-guest-verified-email.md) · [ADR-0010](../adr/0010-one-link-per-event.md) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
