# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the `allow_anonymous_uploads` account gate ("Enter event"), silent join, the auth-aware header island, the live gallery (doorbell + conditional poll), the guest reel (card / overlay / download), demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), saved-events internals (→ [notifications-analytics-growth.md](notifications-analytics-growth.md)), host-side event config + reel curation/Studio (→ [host-app.md](host-app.md)).
> GROWS BY: integrate-in-place.

## What it does

`/e/[token]` ([`page.tsx`](../../src/app/(guest)/e/[token]/page.tsx)) is the scanned-QR landing page — ONE
unified event page ([`event-experience.tsx`](../../src/components/guest/event-experience.tsx)) whose state
is driven by the host's configs. The opaque `qr_token` IS the authorization; there is ONE link
per event (the old `/a/[share_token]` album + `get_public_album` are gone).
`get_event_by_qr_token` resolves `qr_token` OR `custom_slug` (token wins) and returns the canonical
`qr_token`, which the page threads to every downstream qr-keyed RPC.

★ **THE GUEST'S WORD IS "ALBUM", THE CODE'S WORD IS "GALLERY", AND THAT SPLIT IS DELIBERATE.** Will's
`noun=album` pick (2026-09-17) swept every string a guest reads onto the site's one noun, because a guest
who becomes a host used to meet both words. The CODE noun deliberately did NOT move with it: `/api/guests/gallery`,
`gallery-access*`, `getGalleryStats`, `LiveGallery`, `GalleryPayload`, the RPCs and the columns keep their
names, since renaming a live route buys a guest nothing and risks the one flow with no account behind it.
Do not "fix" the mismatch in either direction: new guest copy says album, new code says whatever the
neighbouring code says.

## Flow (top to bottom, contiguous)

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
  + the ONE gallery gap and the photograph's corner (`--gap-gallery` pinned to `--radius-tile`, 4px under the
  corner ladder's family C; the vertical gap is each tile's bottom margin on the same token), tiles at their NATURAL aspect ratio (the plumbed `width`/`height`; 1:1 fallback for
  pre-measure rows — dims ride OUTSIDE the gallery ETag hash, write-once per id). A 45ms entrance stagger
  applies to the SEED render only (`--tile-i`; doorbell/poll arrivals get 0). Videos wear a small CORNER
  play badge (the shared centered `PlayBadge` stays on other surfaces; `MediaTile` gained `playBadge="none"`).
  Guest-only; host/personal grids keep `MediaGrid`'s square grid.
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
- **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx)):
  full-bleed media, a floating top-right close, a bottom ACTION PILL (Like / Save / Share /
  Delete) over an ATTRIBUTION PILL ("[name] [Host] / Anonymous(i) · i+1 of N" — the counter always
  renders). ~30% side tap zones NAVIGATE via thirds logic in `onBackdropClick` (left→prev, right→next,
  edge→no-op, center→close); whisper scrims are pointer-events-none so they never kill the swipe. The
  **gesture machinery is verbatim** (the 17 physics pins). ★ The Share button is guest-only and shares
  the event JOIN url (`shareUrl` prop) — NEVER a presigned media URL; absent on host/personal surfaces.
- Each tile (desktop hover-reveal) + the lightbox carry a **like** button; a signed-out tap
  opens the create-account dialog (a `LikesProvider` wraps the gallery, replaying after sign-in). Like
  COUNTS are host-only → [host-app.md](host-app.md), [database-security.md](database-security.md).
- **PWA (manifest only, no SW)**: [`manifest.ts`](../../src/app/manifest.ts) + the ink-aperture icon set
  make an event link installable to a home screen (standalone, paper/ink theme); static + global, leaks
  nothing event-specific.

## State follows `visibility`: a 3-state enum, NOT a boolean

- **`private`** = the master lock → a locked screen (no name / gallery / upload); `generateMetadata` hides the name.
- **`password`** → access `none`: a **ghost-grid backdrop** + the real "N photos & videos inside" count tease
  (name shown — it's link-shared, not the secret) with the entry modal's password step over it, until a
  signed unlock cookie is present; then the full experience. ★ **The page passes a REDACTED `shellEvent`
  at access `none`** (`host_display_name` + `description` + `event_date` blanked) so they never reach the
  RSC flight payload: a locked page leaks the event NAME + COUNT only, zero media URLs. The date is
  blanked too, because the welcome byline renders it.
- **`open`** → the full experience, UNLESS account-required (`allow_anonymous_uploads=false`): a signed-out
  viewer then gets a teaser (see "Gallery access" below). ★ **The OG description is ONE invitation for every
  open event** — "Photos and videos from the day. Add yours." It used to fork on `allow_anonymous_uploads`
  and announce the email step in the chat; Will's `unfurl=join` pick (2026-09-17) dropped that warning WITH
  its cost in front of him ("More taps, and a share of them bounce at the email step"), so a pasted link
  invites and the gate stays honest where it happens, at the entry modal's account step. Do not hedge it back.
- **`accepting_uploads=false`** = the **view-only STATE** of the one page: the upload panel is removed
  entirely (a quiet "uploads closed" line), leaving the action row + gallery.

## Gallery access: `none` / `teaser` / `full` (the gated VIEW)

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

## The ARRIVAL (the entry surface: welcome + the gates)

The gated arrival is the PRIMARY first experience (most events gate; a guest arrives from a QR with
zero context) and plays as a four-act narrative on the ruled "Calm + 700ms" choreography
([design-system.md](design-system.md)): **the stage** (the page settles: name/lock-line/ghost-grid rise via
`data-arrive` + `--arrive-i`) → **the invitation** (after the ARRIVAL BEAT the sheet rises) → **the
threshold** (the warm gate) → **the reveal** (the success morph, then the gallery rises as the sheet
exits).

One shell ([`entry-shell.tsx`](../../src/components/guest/entry-shell.tsx)) renders a REAL Vaul
drawer on phones (drag physics, `repositionInputs` lifts a focused field above the iOS keyboard,
`dismissible={false}` rubber-bands) and the centered Radix `Dialog` on sm+; the step machine is
unchanged: steps adapt `welcome → password? → account?`, the CURRENT step is the first un-satisfied
one, advancement is SERVER-DRIVEN — each gate form calls `router.refresh()` on success, which
re-runs the RSC, drops the satisfied gate from `gateSteps`
([`gateStepsForAccess`](../../src/lib/guest/entry-steps.ts)), and re-derives the step. No client
step-machine ([`computeEntry`](../../src/lib/guest/entry-steps.ts) is pure + unit-tested).

- **The ARRIVAL BEAT** ([`use-arrival-beat.ts`](../../src/lib/guest/use-arrival-beat.ts), ratified
  700ms / password re-visit 350ms / reduced-motion 0): only the AUTO-open waits (the page settles
  first); `proceeded`/`openToGate` opens stay instant, so the pinned "account-return never
  auto-opens" semantic is untouched.
- **welcome = THE INVITATION** — "You're invited to" eyebrow over the event name as a 28px
  Instrument Serif hero, the host byline (avatar + name + date; self-hiding on locked pages via the
  redacted shellEvent), the count as social proof, two warm `text-base` rows, shown on the FIRST
  visit per device (`pr_welcome_<qrToken>` via
  [`use-welcome-seen.ts`](../../src/lib/guest/use-welcome-seen.ts); server snapshot "seen" = no
  flash). Suppressed for the owner + the demo. Primary reads "Continue" when a gate follows, else
  "View the album". Inside the drawer the welcome stands `min-height: 55svh` (the ratified "tall"
  presence; `[data-entry-drawer] [data-welcome-step]`).
- **THE HONEST-AFFORDANCE TABLE** (dismissal exists only when there is something to dismiss TO):
  welcome-before-PASSWORD = held (the continuous invitation→gate flow; the old X "closed" it only
  for the firm gate to instantly re-open); password = held (it IS the page); welcome-before-account
  + account = free (real swipe-to-dismiss + the `Drawer.Handle`, which renders ONLY when dragging
  dismisses, + "Just browsing"); ANY step while the success beat holds = held; a closed/exiting
  shell = held (no affordance pop-in mid-exit). The account step closes to the browsable teaser and
  the gallery's "See all" re-opens it (`EntryModalHandle.openToGate`, a no-op mid-hold).
- **The CONTINUOUS step container**
  ([`entry-step-transition.tsx`](../../src/components/guest/entry-step-transition.tsx)): a
  ResizeObserver feeds the content's px height into a 300ms height glide (step swaps AND same-step
  growth, e.g. the error line); steps slide directionally (`[data-entry-step][data-dir]`); the
  outgoing step leaves an inert attribute-stripped clone that fades opposite (`[data-entry-exit]`;
  `el.isConnected` discriminates real deletions from dev StrictMode cycles). Gate steps carry a
  back chevron that re-shows the welcome as a transient VIEW over the machine (never touches
  markSeen/steps).
- **The SUCCESS HOLD + REVEAL**
  ([`use-success-hold.ts`](../../src/lib/guest/use-success-hold.ts), min beat 900ms): on unlock the
  gate blurs the field (the keyboard retracts during the beat, never mid-exit), fires `onUnlocked`
  (idempotent) + `router.refresh()` in parallel; the sheet HOLDS while the gate stays PLANTED and
  its own button morphs `--success` green ("You're in" + `data-unlock-success`) — the ratified
  in-place morph; the ACCOUNT hold shows the centered SuccessStep instead (no single button to
  morph in the OTP machinery — a recorded judgment call). Release = beat done AND the refresh
  landed (`current` moved off the held step). Full unlock → the sheet exits (250ms via the
  `animation-duration` override — vaul's close is a KEYFRAME, not a transition) while the REVEAL
  CURTAIN lifts (`[data-reveal-curtain]` via `onHoldingChange`): the freshly mounted header
  byline/stats/description/actions rise (`data-reveal`, 150ms + 50ms steps) and the masonry stagger
  cascades — the reveal plays AS the sheet exits, never invisibly behind it. password→account =
  the lighter path: no exit, the held view hands FORWARD (`handleUnlocked` sets `proceeded`, so a
  returning guest is carried too). Never strands: slow >1.5s = "Opening the gallery"; the 8s
  watchdog turns the button into Retry (the unlock cookie is set; the form never re-enables). The
  display latch keeps the last open-state view mounted through the exit (no empty-strip deflate).
- **Auto-open** when the welcome is due OR the first gate is `password` (it IS the page); an
  `account`-only gate does NOT auto-open on a return visit — the guest browses the teaser, opening
  the account step on desire.
- **No autofocus anywhere in the gates** (the iOS keyboard ambush fix): the keyboard rises on an
  intentional tap; gate inputs are h-11/16px (16px also stops the iOS focus auto-zoom).

## Invariants (don't break)

- **The opaque token IS the authorization** — never give `anon` direct table access; the guest
  RPCs validate the token internally. → [database-security.md](database-security.md).
- **A link, and an event password, are BEARER credentials.** Possession is the authorization, which is the
  intended sharing model: whoever holds the link acts within whatever the configs allow, and a password
  handed round a party is as shared as the party. So a surface may never leak one (no token in an OG tag,
  a log line, a referrer or an analytics row), and the defenses that matter are the ones that survive a
  leaked link: the config gates, the per-request re-checks, and a host's ability to rotate.
- **The anon media RPCs gate on `visibility = 'open'`, NOT `<> 'private'`.** A password event's media must
  NEVER stream through `get_event_media_by_qr_token` / the anon path; it is served ONLY via the server
  admin-read (`getApprovedMediaForUnlock`, self-guarded by the unlock cookie) after `/api/guests/unlock`
  verifies the password. The bcrypt hash never leaves the DB (RPCs expose `has_password` only).
- **The unlock cookie is a signed HMAC of `{eid,exp}`** (`UNLOCK_COOKIE_SECRET`, ~12 h) — the cookie *name*
  isn't the boundary, the **signed eid** is. It fails CLOSED when the secret is unset. Password is
  set/cleared ONLY by `set_event_password` / `clear_event_password` (host-auth SECURITY DEFINER; the column
  is revoked from the host UPDATE grant), and those two own the STATE as well as the hash:
  `set_event_password` is the only path INTO `visibility='password'` (it flips hash and state atomically,
  which is what keeps the `events_password_requires_hash` CHECK satisfiable), and `clear_event_password`
  reverts to `open` only FROM `password`, never turning a `private` event public.
- **The page calls `getUser()` for every non-private, non-demo event** (to resolve the access level + the
  identity gates, because the gate must know whether the viewer is signed in; it is not an
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
- **The localStorage `session_token` is the dedupe, and `guests` deliberately has NO unique
  `(event_id, user_id)`.** One person may join the same event more than once (a second device, a cleared
  browser), and an account is optional, so a uniqueness constraint there would break anonymous multi-join
  rather than tidy anything.
- **Supabase anonymous sign-ins stay OFF.** Capability tokens already give a guest immediate, scoped use,
  so a per-scan `auth.users` row would be pure DB bloat; and an anonymous session carries no email, so it
  could not satisfy the account gate it would supposedly serve. The account layer AUGMENTS the anonymous
  flow and never replaces it: the contribution pipeline runs identically whether the uploader is anonymous
  or signed in.
- **`allow_anonymous_uploads = false` ⇒ an account is required to SEE the full gallery AND to upload** (P1
  gated the VIEW too: a signed-out viewer gets the teaser, see "Gallery access"; renamed + inverted from
  `require_email`; the default is ON and FREE on every tier, see [host-app.md](host-app.md);
  turning it off is the opt-in, behind a consequence-confirm, not a paid feature). The account step lives in the entry
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

## Live gallery: the hybrid doorbell

- **Architecture:** [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx) owns all gallery
  state; [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) is the SHELL around it
  and streams it in via `<Suspense>` (the RSC passes `loadGalleryForAccess` down UN-awaited; `use()`
  resolves it behind [`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx) so the
  presign-heavy payload never blocks the shell's paint). `key={access}` remounts it on an access flip
  (teaser → full after sign-in) — a clean re-seed, no resync effects.
- **The doorbell:** the `media_gallery_doorbell` DB trigger sends a contentless `ping` on the PUBLIC
  Realtime broadcast channel `gallery:<qr_token>` whenever the approved-visible set changes (uploads,
  moderation flips, restores, purges — pending/hidden-internal transitions stay silent). The token IS the
  channel capability; the ping carries no data, the refetch is access-gated server-side.
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

## The guest reel

Guests see the host's highlight reel on `/e/` **only after the host shares it** (`highlight_reels.guest_visible`,
the host-side publish seam → [host-app.md](host-app.md)). Server resolution is
[`getGuestReelContext(event, access)`](../../src/lib/reel/guest-reel.ts), awaited by the page (one indexed
read; a streamed top card would CLS the keepsake hero):

- **Access matrix (structural, not cosmetic):** `access !== "full"` ⇒ **null FIRST** — a `teaser` viewer
  (account-required, signed out) and a locked password page get NO card, NO payload, even when published.
  **Open events** ride the anon RPC `get_event_reel_by_qr_token` on the USER client (the page exercises the
  exact anon contract; its RETURNS TABLE is the 8-key allow-list → [database-security.md](database-security.md)).
  **Password events** cannot use it (the RPC can't see the unlock cookie): the `isUnlocked` check runs INSIDE
  a self-guarded admin arm. Unpublished/empty ⇒ zero rows, indistinguishable from absent (no publish-state
  oracle). Length comes back tier-DERIVED, watermark tier-derived, items `approved`-only (the TIMELINE
  predicate).
- **Two ruled placements**, a function of the event's lifecycle: while `accepting_uploads` the card sits
  **under the action block** (uploading is still the page's job; the reel is the reward on the way past);
  once uploads close the reel is **the KEEPSAKE HERO above the header** (the link IS the album now). Both are
  [`guest-reel-card.tsx`](../../src/components/guest/guest-reel-card.tsx) over the shared `PosterCard`
  (cover presigned server-side, `preview_key ?? original_key`, failure degrades to a styled frame).
- **The overlay** ([`guest-reel-overlay.tsx`](../../src/components/guest/guest-reel-overlay.tsx),
  React.lazy per the EntryModalLazy precedent): the guest ARRIVAL CUT is the ratified composite's back half
  (flash → expand → title → settled) over a full-res `CanvasReelPlayer`; reelProps come from
  `buildReelProps` over the SAME `galleryPromise` the album consumes (no second presign). ★ **The cut waits
  for the player's `onAssetsReady`** (2.5s cap): the engine re-fetches clips `cache: "no-store"`, so a cold
  first open decodes everything and animating over that work was on-device jitter (`6bc779d`). Reduced
  motion skips to settled, player paused with controls. Closing aborts any in-flight encode.
- **Download** (settled row; guests are MEANT to take the mp4 away, because watch-only would throttle the
  growth loop at its strongest link while protecting nothing a screen recorder defeats, and the free-tier
  watermark was designed for exactly this distribution) — `POST /api/reel/download` re-derives EVERYTHING from the qr_token
  (access must be `full`; `no_reel` = 404 oracle-free; the artifact must pass the same blessing as the
  host cache path) and answers per the pure
  [`guest-download-plan.ts`](../../src/lib/reel/guest-download-plan.ts) ladder: **fresh artifact** →
  presigned GET · **stale + WebCodecs** → the guest's device self-encodes the EXACT shown props (freshness
  LOSES to a local encode, WINS over nothing; zero server writes) · **stale, no WebCodecs** → the stale
  artifact · **nothing + no WebCodecs** → the ask-the-host copy. ★ Guests NEVER get a write path
  (`/api/reel/upload` stays host-authed); the `reel_guest_download` limiter guards breadth/scope
  (→ [database-security.md](database-security.md)); each grant logs `guest_download` to `reel_render_log`
  for `/admin/reels`. Share = `navigator.share` with the **joinUrl** (guests share the ALBUM, never a
  video url).

## See also

[database-security.md](database-security.md) (the capability-RPC inventory) · [auth-accounts.md](auth-accounts.md) (the sign-in the account gate uses) · [uploads-and-r2.md](uploads-and-r2.md) · [notifications-analytics-growth.md](notifications-analytics-growth.md).
