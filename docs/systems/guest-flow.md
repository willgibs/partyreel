# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the `allow_anonymous_uploads` account gate ("Enter event"), silent join, the auth-aware header island, the live gallery (doorbell + conditional poll), demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), saved-events internals (→ [notifications-analytics-growth.md](notifications-analytics-growth.md)), host-side event config (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page — ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
is driven by the host's configs. The opaque `qr_token` IS the authorization (ADR-0004); there is ONE link
per event (ADR-0010 — the old `/a/[share_token]` album + `get_public_album` are gone).
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

## Flow (top to bottom, contiguous) — the V1 redesign (Phase 4)

The ratified **left-editorial** layout ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)
is the shell): `font-heading` event name → byline ("Hosted by" name+avatar · date) → the **stats line**
("N photos & videos from M guests") → the **action block**: a full-width primary **Add photos** over a
2-col **`[Save] [Invite]`** row. The primary Add opens the OS picker directly (`uploadRef.openPicker()`);
a **floating Add pill** ([`floating-add-button.tsx`](../../src/components/guest/floating-add-button.tsx))
appears once the header Add scrolls out of view (an `IntersectionObserver` sentinel —
[`use-in-view-sentinel.ts`](../../src/lib/guest/use-in-view-sentinel.ts) — never both, never over the
empty-state CTA). `GuestShare` is the Invite trigger + dialog (QR + Copy + native Share + Download).
- **Stats**: `getGalleryStats(event)` ([`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts))
  is one admin select over approved media → `{approvedTotal, contributorCount}` (distinct uploader guests
  +1 if the host uploaded). ★ **NUMBERS ONLY ever leave the server** (never a guest_id/identity). N goes
  live via `LiveGallery`'s `onCountChange`; M is static per load. Threaded from the page RSC, NOT the poll
  route (ETag semantics untouched).
- **Masonry gallery** ([`guest-masonry.tsx`](../../src/components/guest/guest-masonry.tsx)): CSS `columns-2`
  + 3px gaps/radius, tiles at their NATURAL aspect ratio (the plumbed `width`/`height`; 1:1 fallback for
  pre-measure rows — dims ride OUTSIDE the gallery ETag hash, write-once per id). A 45ms entrance stagger
  applies to the SEED render only (`--tile-i`; doorbell/poll arrivals get 0). Videos wear a small CORNER
  play badge (the shared centered `PlayBadge` stays on other surfaces; `MediaTile` gained `playBadge="none"`).
  Guest-only — host/personal grids keep `MediaGrid`'s square grid until Phase 5.
- **Upload lives IN the gallery**: the queue machine is [`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts)
  (one-at-a-time, JIT silent join, demo sim, retry — moved verbatim, the pins encode it). `GuestUpload` is a
  thin engine (hidden input + `{openPicker, retry}` handle + `onQueueChange`); in-flight items render as
  masonry tiles with a progress bar / dimmed error + "Tap to retry" / a ~2.5s green `--success` check.
  ★ **The blob re-key**: a pending tile's object URL is keyed by queue id, re-keyed to the media id at
  approved completion (`UploadedItem.queueId`) — the SAME URL object, so the `<img src>` never changes
  (zero flicker as a pending tile becomes the optimistic tile). Hold-for-approval completions show NO
  optimistic tile (a settle toast fires; the host's approval rings the doorbell and the tile arrives).
- **Empty state** ([`gallery-empty-state.tsx`](../../src/components/guest/gallery-empty-state.tsx)): the
  photographic promise — a faint grayscale ghost mosaic (the optimized `public/guest-ghost` WebPs) with a
  centered `font-heading` CTA. At 0 items the header drops its Add (the CTA owns it).
- **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx), Phase 4
  chrome): full-bleed media, a floating top-right close, a bottom ACTION PILL (Like / Save / Share /
  Delete) over an ATTRIBUTION PILL ("[name] [Host] / Anonymous(i) · i+1 of N" — the counter always
  renders). ~30% side tap zones NAVIGATE via thirds logic in `onBackdropClick` (left→prev, right→next,
  edge→no-op, center→close); whisper scrims are pointer-events-none so they never kill the swipe. The
  **gesture machinery is verbatim** (the 17 physics pins). ★ The Share button is guest-only and shares
  the event JOIN url (`shareUrl` prop) — NEVER a presigned media URL; absent on host/personal surfaces.
- Each tile (desktop hover-reveal) + the lightbox carry a **like** button (Phase 5); a signed-out tap
  opens the create-account dialog (a `LikesProvider` wraps the gallery, replaying after sign-in). Like
  COUNTS are host-only → [host-app.md](host-app.md), [database-security.md](database-security.md).
- **PWA (manifest only, no SW)**: [`manifest.ts`](../../src/app/manifest.ts) + the ink-aperture icon set
  make an event link installable to a home screen (standalone, paper/ink theme); static + global, leaks
  nothing event-specific.

## State follows `visibility` (ADR-0007) — a 3-state enum, NOT a boolean

- **`private`** = the master lock → a locked screen (no name / gallery / upload); `generateMetadata` hides the name.
- **`password`** → access `none`: a **ghost-grid backdrop** + the real "N photos & videos inside" count tease
  (name shown — it's link-shared, not the secret) with the entry modal's password step over it, until a
  signed unlock cookie is present; then the full experience. ★ **The page passes a REDACTED `shellEvent`
  at access `none`** (`host_display_name` + `description` blanked) so they never reach the RSC flight
  payload — a locked page leaks the event NAME + COUNT only, zero media URLs (Phase 4 hardening).
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
unauthenticated, so gating only the RSC would be a trivial bypass. The guest-facing gate for these levels is the
entry modal (below). The host "Require guest accounts" relabel + live preview (P3) is the remaining phase
(→ [ROADMAP.md](../ROADMAP.md)).

## The entry modal (welcome + the gates, P2)

One `Dialog` ([`entry-modal.tsx`](../../src/components/guest/entry-modal.tsx)) drives all guest entry, with
ordered steps that adapt to the event: `welcome → password? → account?`. The CURRENT step is always the first
un-satisfied one; advancement is SERVER-DRIVEN — each step's existing form (`<PasswordGate>` / `<EnterEventPrompt>`,
reused as step bodies) calls `router.refresh()` on success, which re-runs the RSC, drops the satisfied gate from
the access-derived `gateSteps` ([`gateStepsForAccess`](../../src/lib/guest/entry-steps.ts)), and re-derives the
step. No client step-machine ([`computeEntry`](../../src/lib/guest/entry-steps.ts) is pure + unit-tested).

- **welcome** — the always-on friendly front door + mini-guide, shown on the FIRST visit per device
  (`pr_welcome_<qrToken>` via [`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts), the
  `useSyncExternalStore` pattern; server snapshot "seen" = no flash), even on a fully public event. Suppressed
  for the owner + the demo. The button reads "Continue" when a gate follows, else "View event".
- **Dismissibility fits what's behind each step** ("dismiss to what?"): welcome is freely dismissable (X /
  backdrop / Escape) to the page behind it; the **password** step is FIRM (`showCloseButton={false}` + prevented
  `onInteractOutside`/`onEscapeKeyDown`) since nothing is behind it but the locked event; the **account** step
  closes back to the browsable teaser, and the gallery's "See all N photos" button re-opens it (the
  `EntryModalHandle.openToGate` ref). Shell is Radix `Dialog` only (a swipe-away drawer would mis-signal a
  must-complete gate). Step crossfade via `[data-entry-step]` (globals.css).
- **The adaptive SHEET (Phase 4)**: on phones the dialog is a bottom-pinned sheet (the `max-sm:` utilities
  on `DialogContent` neutralize the centered translate + pin it to the bottom with action-radius top
  corners + a slide-up + safe-area padding), the centered float on sm+. A **drag-indicator bar shows on
  dismissible steps ONLY** (never the firm password step — it would promise a swipe-away it blocks). The
  step chrome is reskinned (font-heading headings, 15px copy, h-11 actions, the account step's lock mark +
  "N photos are waiting" + the host-safety framing); the MACHINE above is untouched.
- **Auto-open** when the welcome is due OR the first gate is `password` (it IS the page); an `account`-only gate
  does NOT auto-open on a return visit — the guest browses the teaser, opening the account step on desire.

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
- **The upload slot is `full`-only** (a `teaser`/`none` viewer has not entered; the entry modal owns the
  account/password gate). At `full`, while `accepting_uploads`: `needsName` (signed in, no `display_name`) → the
  required name step (the upload is attributed), else the upload panel (anonymous-friendly); uploads off → the
  view-only line. At `teaser` the slot is just the gallery + a "See all N photos" button that opens the modal's
  account step; at `none` a locked backdrop (name only). (`needsAccount` was REMOVED — `access` drives it.)

## Joining + identity

- **Silent, just-in-time, field-less for the common case:** a first-time guest picks files → `POST
  /api/guests {qr_token}` → `create_guest` issues a `session_token` (localStorage, returning-guest) behind
  the scenes → upload. Guest display names were REMOVED (cut 2b); `create_guest` is 2-arg.
- **`allow_anonymous_uploads = false` ⇒ an account is required to SEE the full gallery AND to upload** (P1
  gated the VIEW too: a signed-out viewer gets the teaser, see "Gallery access"; renamed + inverted from
  `require_email`, ADR-0015; default is ON, turning it off is Pro-gated). The account step lives in the entry
  modal (P2) as `<EnterEventPrompt>` — an email-primary "See all the photos" (the shared
  [`<EmailSignIn>`](../../src/components/auth/email-sign-in.tsx); one tap = create account OR log in) with a
  secondary password login; the teaser shows behind it. `create_guest` derives identity (`user_id` + `email`)
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

## Live gallery: the hybrid doorbell (Phase 3)

- **Architecture:** [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) owns all gallery
  state; [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is the SHELL around it
  and streams it in via `<Suspense>` (the RSC passes `loadGalleryForAccess` down UN-awaited; `use()`
  resolves it behind [`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx) so the
  presign-heavy payload never blocks the shell's paint). `key={access}` remounts it on an access flip
  (teaser → full after sign-in) — a clean re-seed, no resync effects.
- **The doorbell:** the `media_gallery_doorbell` DB trigger sends a contentless `ping` on the PUBLIC
  Realtime broadcast channel `gallery:<qr_token>` whenever the approved-visible set changes (uploads,
  moderation flips, restores, purges — pending/hidden-internal transitions stay silent). The token IS the
  channel capability (ADR-0004); the ping carries no data, the refetch is access-gated server-side.
  Client: [`use-gallery-doorbell.ts`](../../src/lib/guest/use-gallery-doorbell.ts) + a leading-edge
  coalescer ([`refresh-coalescer.ts`](../../src/lib/guest/refresh-coalescer.ts): immediate refetch, ~2 s
  suppression + jitter, one trailing flush for bursts). Measured doorbell-to-render: **<1 s live**.
- **The conditional poll:** the fallback cadence keys solely off the channel state — **60 s** while
  `SUBSCRIBED` (a safety net), **12 s** when the socket is down; paused on `document.hidden`. Every
  poll sends `If-None-Match`; the route answers an unchanged gallery with a **bare 304** (zero payload,
  zero presigns) — see the route notes in [uploads-and-r2.md](uploads-and-r2.md) and the ETag invariant
  below.
- ★ **The gallery ETag must never validate across access levels** — the fingerprint
  ([`gallery-fingerprint.ts`](../../src/lib/events/gallery-fingerprint.ts)) hashes `access` +
  `teaserTotal` + the item ids/attribution + the presign bucket id, and the not-found/private early
  return carries NO ETag. Red-teamed: a teaser validator replayed with full-access cookies must 200.
  The bucket id rolls the ETag every 30 min so clients re-pull fresh URLs before old ones expire.
- **Reconcile by id — do NOT `setState` the raw poll result:** the client keeps already-rendered items'
  URL objects by id (so `<img>`s never reload) and adopts fresh presigns only for genuinely-new items
  ([`merge-gallery-items.ts`](../../src/lib/guest/merge-gallery-items.ts)). Long-tab staleness is
  unchanged from the pre-doorbell era by design (kept-object merge).
- **Optimistic tiles only for LIVE-approved media:** a completed upload prepends a local `createObjectURL`
  tile (deduped against the next refetch by media id, then the blob is revoked) — but ONLY when
  `create_media` returned `approved`. Hold-for-approval items stay pending until the host's approval
  rings the doorbell. Upload completions reach LiveGallery through a `LiveGalleryHandle` callback ref
  (with a pre-mount buffer, since the gallery streams in async).

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
