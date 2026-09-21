# Guest flow — the `/e/[token]` event page

> ROLE: what a guest (or a signed-in visitor) experiences on the one event link, and how joining/uploading is gated.
> BELONGS HERE: the `/e/[token]` page, the 3-state visibility machine, capability tokens, the password gate + unlock cookie, the `require_verified_email` switch (its gate and its name-only door), silent join, the auth-aware header island, the live gallery (doorbell + conditional poll), the guest reel (card / overlay / download), demo mode. · NOT HERE: the upload pipeline + R2 + lightbox mechanics (→ [uploads-and-r2.md](uploads-and-r2.md)), saved-events internals (→ [notifications-analytics-growth.md](notifications-analytics-growth.md)), host-side event config + reel curation/Studio (→ [host-app.md](host-app.md)).
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
full-width **`[Invite]`** row. Every Add opens the ADD SHEET (`uploadRef.openAdd()`; `tap=sheet`, below).
`GuestShare` is the Invite trigger + sheet (QR + Copy + native Share + Download).
★ **THE ROW ON LANDING, A DOCK ONCE IT LEAVES** (Will, `chrome=both`, 2026-09-20: "you see the actions
higher on the page when first landing, and then keep them visible as you continue"). The row above is
unchanged; [`guest-action-dock.tsx`](../../src/components/guest/guest-action-dock.tsx) takes its place at
the foot the moment the row's `IntersectionObserver` sentinel
([`use-in-view-sentinel.ts`](../../src/lib/shared/use-in-view-sentinel.ts)) leaves the viewport, carrying
BOTH actions over a gradient scrim and inside the safe area. It is `inert` rather than unmounted while the
row is on screen, so it travels in and back out, and the page root reserves its height for as long as it is
MOUNTED (never only while it is visible, or the page would grow under a thumb mid-scroll). The dock carries
exactly what the row carries: Add drops out of both together (uploads closed, a teaser, an empty album whose
own CTA is the primary). **The floating Add pill is retired**:
[`floating-add-button.tsx`](../../src/components/shared/floating-add-button.tsx) stays on disk for the three
lab surfaces still drawing it, and nothing in the product mounts it. Round one's `chrome=dock` ALONE was
refused for the reason a dock alone still earns ("one of the last places a guest's eye will reach"), so the
dock is never a guest's first sight of Add.
★ **SAVE IS NOT IN THIS ROW** (Will, `account=after`, 2026-09-20: "Moving Save makes it feel more natural
after upload rather than a random button above an album for guests"). The account is asked once at the door,
and keeping the album is a one-tap offer AFTER a guest's first photograph lands
([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx) → `ClaimHandlePrompt` → `SaveAccountPrompt`,
wearing `SaveEventButton`), never a form above the album. Where a guest's actions finally live is `chrome`
round two, which draws this block with Save already gone.
★ **THAT OFFER IS THE CAPTURE FLOW NOW** (the identity reshape, 2026-09-21; Will's `collision=offer`: "a flow
for us to capture non-user guests after their uploads to save the event/uploads to a profile, follow
host/other guests"). `ClaimHandlePrompt` owns the whole post-upload slot, ONE card at a time, and the ladder
is: signed out → the offer card, counting what just landed; **just confirmed** →
[`follow-moment-card.tsx`](../../src/components/guest/follow-moment-card.tsx) (what they now hold, the host
to follow, "Claim your handle" folded in as its second line); signed in without a handle → the handle card
as before; with one → nothing. ★ **"Just confirmed" is a MARKER, not a guess**: `SaveAccountPrompt` writes
`pr_pending_offer_<qr_token>` when the door OPENS (as `pr_pending_save_` already does, and for the same
reason — once a magic link or Google redirect happens, no code of ours is running), and the slot's owner
consumes it on the next mount and deletes it in the same breath, so the in-page code and a full reload land
the SAME beat, exactly once. ★ The follow moment offers the HOST alone: the other guests are already on this
page with their own Follow on each handled chip ([`guest-list.tsx`](../../src/components/social/guest-list.tsx)),
and a second copy of those names inside the card would be one list twice on one screen. Its card comes from
`getHostCard(eventId)` resolved in the page RSC; no card resolved means no host row, never a stub.
★ **THE GUEST'S OVERLAYS WEAR THE ONE RESPONSIVE SHEET** (`dialogs=stands`, 2026-09-20, deferring to
`settings=sheet`'s "apply this sheet concept everywhere"): `SheetContent responsive`
([`ui/sheet.tsx`](../../src/components/ui/sheet.tsx)) — a side panel at a desk, a bottom sheet in a hand.
Invite ([`guest-share.tsx`](../../src/components/guest/guest-share.tsx)) and Report
([`report-dialog.tsx`](../../src/components/guest/report-dialog.tsx)) are on it. The DOOR is on it from 640 up
too now (`welcome=sheet`, below); its phone half stays vaul-backed, and "Download all" (`ExportDialog`) + Save
(`SaveEventButton`) are shared with host surfaces, so they follow in their owning lanes. ⚠ Report is the one with a FIELD in it, and the responsive
Sheet's phone half has never held a focused input on a real iPhone — if the keyboard covers the textarea the
fix is the Sheet's phone half becoming vaul-backed for every consumer, one change, never a per-dialog exception.
- **Stats**: `getGalleryStats(event)` ([`guest-events-admin.ts`](../../src/lib/db/queries/guest-events-admin.ts))
  is one admin select over approved media → `{approvedTotal, contributorCount}` (distinct uploader guests
  +1 if the host uploaded). ★ **NUMBERS ONLY ever leave the server** (never a guest_id/identity). N goes
  live via `LiveGallery`'s `onCountChange`; M is static per load. Threaded from the page RSC, NOT the poll
  route (ETag semantics untouched).
- **Masonry gallery** ([`guest-masonry.tsx`](../../src/components/guest/guest-masonry.tsx)): the SHARED column
  rule `GALLERY_COLUMNS` ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)), read and never
  re-typed — a column WIDTH, never a count, so a wider window means MORE photographs and not bigger ones: two
  columns at a phone, then `--album-column` (220px, a tile of about 240) from 640 up, measured at 5 / 6 / 8
  columns at 1280 / 1512 / 1920 (Will's `tile=240`, 2026-09-19)
  + the ONE gallery gap and the photograph's corner (`--gap-gallery` pinned to `--radius-tile`, 4px under the
  corner ladder's family C; the vertical gap is each tile's bottom margin on the same token), tiles at their NATURAL aspect ratio (the plumbed `width`/`height`; 1:1 fallback for
  pre-measure rows — dims ride OUTSIDE the gallery ETag hash, write-once per id). A 45ms entrance stagger
  applies to the SEED render only (`--tile-i`; doorbell/poll arrivals get 0). Videos wear a small CORNER
  play badge (the shared centered `PlayBadge` stays on other surfaces; `MediaTile` gained `playBadge="none"`).
  ★ **The page root is no longer a column** (`width=full` + `words=edge`, same ruling):
  [`event-experience.tsx`](../../src/components/guest/event-experience.tsx) carries two boxes, `COLUMN`
  (632px of reading measure pinned LEFT, on the header logo's own 20px line) and `BLEED` (the 20px gutter
  alone), and the ALBUM ALONE takes the second — the reel card, the action block, the upload panel, the guest
  list, the locked ghost grid and the empty state all keep the column, the last because its river is square
  and would otherwise draw a window-wide box of nothing. The streaming skeleton
  ([`gallery-skeleton.tsx`](../../src/components/guest/gallery-skeleton.tsx)) reads the same rule and carries
  12 more tiles from 640 up, so a wide album never loads as one thin row.
- **The upload act** (the `guest-upload` board, ruled whole 2026-09-21). The queue machine is
  [`use-upload-queue.ts`](../../src/lib/guest/use-upload-queue.ts) (one-at-a-time, JIT silent join, demo sim,
  retry — moved verbatim, the pins encode it); `GuestUpload`
  ([`guest-upload.tsx`](../../src/components/guest/guest-upload.tsx)) is a thin engine over it with a
  `{openAdd, retry}` handle and `onQueueChange`, and it renders no tile of its own. The act has three
  surfaces:
  - ★ **THE ADD SHEET** (`tap=sheet`): every Add affordance opens
    [`upload/intent-sheet.tsx`](../../src/components/guest/upload/intent-sheet.tsx) on the one responsive
    Sheet — *Take a photo* over *Choose from your album*, with the terms line
    ([`upload-terms.ts`](../../src/components/guest/upload/upload-terms.ts): the kinds and the ceiling from
    `media/limits.ts`; nothing about rights, ever) beneath. TWO hidden inputs INSIDE `SheetContent`, because
    `capture` cannot be both: the camera row is `accept="image/*" capture="environment"` and takes ONE
    photograph (iOS ignores `multiple` under `capture`, Android adds a Camera/Camcorder chooser the moment
    video is accepted), the album row is `accept="image/*,video/*" multiple`. ★ **Each is `.click()`ed
    SYNCHRONOUSLY from its row's tap** — one `await` in between and Safari silently drops the picker.
  - ★ **THE REVIEW STEP** (`warning=both`, his "allow guests to catch an accidental selection"): the picker
    returns INTO the same sheet ([`upload/review-step.tsx`](../../src/components/guest/upload/review-step.tsx))
    as tiles with a one-tap remove and a `Send N` primary; only then does `addFiles(kept)` run. A file the
    browser cannot draw (an iPhone `.mov`, a HEIC outside Safari) is drawn as a NAMED stand-in with its size
    ([`upload/pick-preview.tsx`](../../src/components/guest/upload/pick-preview.tsx)) rather than the empty
    black box it used to be. ★ Object URLs are minted and revoked by ONE owner in one effect
    ([`use-pick-urls.ts`](../../src/components/guest/upload/use-pick-urls.ts)): mint-in-render plus
    revoke-in-cleanup paints a revoked URL on React's StrictMode remount and every preview falls to the
    stand-in (measured on `pnpm dev`).
  - ★ **THE FAILURE SHEET** (`failed=sheet`): nothing interrupts while files go, and when the RUN ENDS
    (nothing queued, nothing uploading) with anything refused,
    [`upload/failure-sheet.tsx`](../../src/components/guest/upload/failure-sheet.tsx) opens itself once with
    a line per file — the name, the SERVER's own sentence, a Retry — over one `Retry all`. No tile is drawn
    for a refused file and **both upload toasts retired** (the error toast and "Sent, waiting for host
    approval"); only the JOIN's own failure still toasts, because nothing was ever queued. ★ **A dismissed
    failure LEAVES THE QUEUE, it does not just leave the screen**: `useUploadQueue`'s `dismiss(ids)` drops
    those items outright, and "Not now" plus the sheet's own close (backdrop, Escape) call it for every id
    the sheet is currently listing — the run-end effect only ever looks at what is STILL in the queue, so a
    failure once dismissed cannot resurrect itself on a later, unrelated run's end. `dismiss` re-checks each
    id's LIVE status rather than trusting the list it was called with, which is what keeps it from also
    eating the ids `Retry all` just re-queued a moment earlier in the same close.
  - ★ **THE FLIP, MID-RUN** (the identity reshape, 2026-09-21). A host can turn Require verified emails ON
    while a guest is halfway through twelve files; the routes then answer 403 `verification_required`, which
    the uploader carries up as `UploadOutcome.code` (the ONE code the queue reads by name). It is a spent
    SESSION, not one refused file, so: a CONFIRMED viewer re-joins silently ONCE (their uid mints a verified
    row and the run continues on the new token, and they never learn it happened, because nothing about them
    changed); a name-only guest cannot, so the session is dropped, everything still queued is failed in place
    with the SERVER's own sentence, the failure sheet opens once for all of it, and the page refreshes so the
    NEXT Add meets the gate rather than a token that cannot work.
  ★ **The blob re-key**: an in-flight tile's object URL is keyed by queue id, re-keyed to the media id at
  approved completion (`UploadedItem.queueId`) — the SAME URL object, so the `<img src>` never changes
  (zero flicker as an in-flight tile becomes the optimistic tile).
- **Empty state** ([`gallery-empty-state.tsx`](../../src/components/guest/gallery-empty-state.tsx)): the
  photographic promise — the RIVER (`shared/river`, Will's `guest-photos=ghost`, 2026-09-18) in a square
  box the width of the column, the `public/guest-ghost` WebPs pouring down under a centered `font-heading`
  title and CTA. The fade (grayscale 0.85 at 40%) is a filter on the WRAPPER, never a layer over the
  photographs, and NOTHING sits at the top of the flow: a demo code inside a host's own album is what bible 4
  refuses. At 0 items the header drops its Add (the CTA owns it, opening the same add sheet). ★ **That wrapper is `GhostRiver`, exported
  from this file and the ONE home of the depth**, because the locked page draws the same picture
  (`nothing=river`) and two copies of the fade are how the two screens drifted apart the first time.
- **Lightbox** (the SHARED [`media-lightbox.tsx`](../../src/components/shared/media-lightbox.tsx)):
  full-bleed media, a floating top-right close, a bottom ACTION PILL (Like / Save / Share /
  Delete) over an ATTRIBUTION PILL ("[name] [mark] [Host] · i+1 of N" — the counter always
  renders). ★ **EVERY UPLOAD CARRIES A NAME** (the identity reshape, 2026-09-21): a confirmed guest's
  profile name stands plain, a typed one wears [`unverified-mark.tsx`](../../src/components/shared/unverified-mark.tsx)
  (MineMark's material, tap to open, the host's own extra sentence, and on YOUR OWN credit a "Confirm your
  email" that opens the `save` wear), and a row minted before the reshape reads **"A guest"** (his to
  overrule; nothing minted after it can reach that branch). "Anonymous" and its `(i)` are gone with the
  concept; [`anonymous-info.tsx`](../../src/components/shared/anonymous-info.tsx) stays on disk for the
  Library gallery alone. ★ The mark carries its OWN door rather than a prop, because the credit sits
  three modules deep under `shared/masonry.tsx` and a way out threaded through all of them would simply
  not exist where Will expects a guest to want it; "is this mine" is the `canDelete` seam the lightbox
  already has, never a second one. ~30% side tap zones NAVIGATE via thirds logic in `onBackdropClick` (left→prev, right→next,
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
- **`password`** → access `none`: the **ghosted RIVER backdrop** (`GhostRiver`, the empty album's own picture
  at the empty album's own depth — Will's `nothing=river`, 2026-09-20: one absence, one picture, where the
  locked page used to draw nine empty squares) + the real "N photos & videos inside" count tease
  (name shown — it's link-shared, not the secret) with the entry modal's password step over it, until a
  signed unlock cookie is present; then the full experience. The river's frames are the local `guest-ghost`
  pack, never this event's media, so a locked page still leaks exactly what it leaked before. `GhostGrid`
  stays on disk, imported only by the `guest-shape` board. ★ **The page passes a REDACTED `shellEvent`
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
`dismissible={false}` rubber-bands) and, from 640 up, the ONE product Sheet (`SheetContent responsive`)
as a full-height panel from the right edge. ★ **NO CENTRED FLOAT AT A DESK** (Will, `welcome=sheet`,
2026-09-20: "Aligning to the bottom rather than centering as a modal gives much more blurred visual
preview of the album awaiting above to incentivize/tease through the welcome gates"). Round one ruled the
SEQUENCE and said so in the same breath ("this is directly approving the welcome then gate, not this sheet
design"); round two ruled the SHELL, and the sequence below is untouched by it. The phone half keeps vaul
because the gates TYPE into this surface and `repositionInputs` is the only thing keeping a focused field
off the keyboard; what it took from the Sheet is the posture, `max-h-[85svh]`, so the album still shows
above the door. The dismissability table is identical on both halves. The step machine is
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
  presence; `[data-entry-drawer] [data-welcome-step]`); the desk panel is full height already, so the rule
  stays drawer-scoped and the content sits at the panel's top the way every other product sheet's does.
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
- **A guest's OWN-photograph removal is never a client claim, and never a client list.** The two RPCs decide
  ownership inside themselves (`auth.uid()`, or the session token matched against the media's own guest row)
  and the "mine" list that decides whether the control APPEARS is a server read on both paths. Three things
  that must stay true: `anon` never gets EXECUTE on `remove_my_upload_by_session` (service-role only, reached
  through `/api/guests/remove` behind the join limiter); a session token never travels in a URL; and a guest
  row with `user_id` set is untouchable by the session path, so a shared phone's stale token can never delete
  a signed-in person's photograph. A withdrawal is final for the host (`removed_by_uploader`), his answer.

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
  `create_media` returned `approved`. Upload completions reach LiveGallery through a `LiveGalleryHandle`
  callback ref (with a pre-mount buffer, since the gallery streams in async).
- **What THIS DEVICE draws at the album's head**, in the grid's `prefix` slot
  ([`guest-masonry.tsx`](../../src/components/guest/guest-masonry.tsx)), and nowhere else:
  - ★ **ONE stack for a pick in flight** (`batch=one`):
    [`upload/stack-tile.tsx`](../../src/components/guest/upload/stack-tile.tsx) draws the file actually in
    the air (the queue runs one at a time) with two ghost edges behind it and, at its foot, everything the
    tile SAYS — "N to go" and the progress bar on one pane. Twelve files used to take twelve tiles with
    eleven bars at zero. A single file is a stack of one and says no count.
  - ★ **A WAITING tile per held file** (`held=tile`): a completed upload on a `hold_for_approval` event sits
    dimmed under a clock mark with "Waiting for the host" until the poll shows it approved (its `mediaId`
    rides on the queue item for exactly that comparison) or the session ends. It used to draw NOTHING, which
    reads as a failure. Only this device ever sees it; nothing here asserts anything to the server.
  - ★ **Nothing at all for a file that did not go** (`failed=sheet`), and nothing for one already in the
    album.
  ★ Both tiles wear the album tile's `data-lit` bright edge, bound by
  [`lit-edge-contract.test.ts`](../../src/components/shared/lit-edge-contract.test.ts)'s closed list, so a
  photograph never gains or loses an edge at the moment it finishes uploading. The pane both read on is the
  ONE glass material at the marks' blur with its tint re-pointed to an alpha MEASURED at 4.5:1 for white over
  a pure-white photograph (4.78:1; the board's plain black/45 wash read 3.35:1, which is the number behind
  his "the text is currently hard to read").
- **The ARRIVAL, one grammar for a guest and a host alike** (Will, `live=land` 2026-09-20 and
  `landing=sweep` 2026-09-21: "This should be consistent across guest and host arrival experiences"). TWO
  marks, and the whole difference is whose photograph it is: `data-arrived` is the glow a photograph takes
  when it appeared by ITSELF, `data-landed` is the one pass of light a guest's OWN landing takes. Both are
  written by the ONE grid ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)) from two sets the
  surface hands down, both are drawn by [`shared/arrival.css`](../../src/components/shared/arrival.css) (it
  lives beside the grid now, not in the guest's own folder, which is what made it shareable), and both read
  their life from [`lib/shared/arrival.ts`](../../src/lib/shared/arrival.ts), written onto the album box as
  `--arrival-glow-ms` / `--arrival-sweep-ms` so the attribute and the keyframe can never disagree.
  `newArrivalIds(prev, next)`
  ([`reconcile-gallery-items.ts`](../../src/lib/guest/reconcile-gallery-items.ts)) reports the ids that were
  NOT on screen a moment ago — the only definition that catches every route into the album (a doorbell
  arrival, a held item approved an hour later, a burst after a hidden tab wakes) — and `arrivalMarks()`
  (pure, contract-tested) splits them: one's OWN landings are subtracted from the glow and the NEWEST of them
  takes the sweep. ★ The glow holds PER ID (two guests a beat apart each get a full life); the sweep is
  EXCLUSIVE, so a batch landing faster than the light runs never stacks it up the gallery — measured at two
  at once before that rule, which is the beginning of what Will banked the shimmer to avoid. ★ Three things
  never glow: the SEED render (`prev` empty; the album's own entrance stagger is that moment's motion), a
  rolled presign, and this guest's OWN upload (it sweeps instead). The green `--success` check RETIRED with
  the sweep. The GROWTH is the existing `[data-media-tile]` entrance in `globals.css`, deliberately not
  re-declared, and the album re-flows around an arrival for real now (the grid's explicit columns).
  Reduced motion = a plain appearance, neither mark paints.
- **A guest's own photographs, removable ever** (Will, `yours`, 2026-09-20; final for the host too):
  two identities, one control. SIGNED IN → `removeMyUploadGuestAction`
  ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)) on the existing `remove_my_upload`
  (`auth.uid()`, any device, for ever); ANONYMOUS → `POST /api/guests/remove` → the service-role-only
  `remove_my_upload_by_session`, which validates the device-bound session token INSIDE the function against
  the media's own guest row (unclaimed, same event, event live). ★ **"Mine" is ALWAYS a server read, never a
  client claim**: the signed-in list is one indexed read in the page RSC (`listAccountMediaIds`), the
  anonymous list is `POST /api/guests/mine` (`listSessionMediaIds`, the token in the BODY, cached per mount);
  both live in [`mutations/guest-media.ts`](../../src/lib/db/mutations/guest-media.ts). It is deliberately NOT
  in the gallery payload or its ETag — that fingerprint is per ACCESS and shared between viewers, this list is
  per person — which also means uploads made before this shipped are covered. The ids reach the grid as
  `canDelete`, gating the lightbox's Trash per item. A removal marks `removed_by_uploader`, so the host's bin
  never shows it and `restore_media` refuses it; the purge cron reclaims the bytes on the usual 30-day path.
- **And WHICH tiles are a guest's own** (Will, `theirs=mark`, 2026-09-20): the same server-read set reaches
  the grid a second time as `mineIds`, and the ONE grid
  ([`shared/masonry.tsx`](../../src/components/shared/masonry.tsx)) writes `data-mine` on those tile boxes
  and gives each a FOURTH mark in the marks' own material (`GLASS_MARK` + the `glass-mark-lit` halo, the
  play mark's exact recipe). It takes the tile's TOP-LEFT corner, the only one free at every width: the play
  and like marks own the two bottom corners and the desk's hover row owns the top right. A tap toggles the
  **Yours filter** ([`yours-filter.ts`](../../src/components/guest/yours-filter.ts), pure): the album narrows
  to that set under a "Showing yours · Show all" line, the event's own count line keeps saying how big the
  WHOLE album is, and the filter cannot stay live once the guest owns nothing in the list — removing your
  last photograph can never strand you in an empty view. A LINE and not a chip, on his own note: "rather
  than just adding more and more configs here"; Yours now joins tile size inside the ONE View menu
  (`controls-home=view-menu`, [`view-menu.tsx`](../../src/components/shared/view-menu.tsx), the host
  gallery's own object) mounted beside "Download all" in
  [`live-gallery.tsx`](../../src/components/guest/live-gallery.tsx): a Showing group (Everyone's / Yours (n))
  present only while the guest owns something on the album, beside a Tile size group disabled below 640 with
  the hint "Wider screens" (`masonry.tsx`'s `PHONE_MAX` forces two columns there regardless of
  `--album-column`, so the control would otherwise be dead) — this line stays as the filter's own receipt and
  its only exit besides tapping a mark again. ★ **THE SIZE ITSELF IS SERVER-RESOLVED, NEVER A CLIENT-ONLY
  READ**: the guest page reads the same shared `pr_tile_size` cookie the host dashboard does
  ([`tile-size-cookie.ts`](../../src/lib/shared/tile-size-cookie.ts)'s `resolveTileSize`) and threads it down
  as `initialTileSize` through `EventExperience` to `LiveGallery`, so the first paint is already the size a
  returning guest picked; the write rides `setTileSizeAction`
  ([`actions.ts`](<../../src/app/(guest)/e/[token]/actions.ts>)), the host action's mirror on the guest page.
  Omitted wherever Remove is (the demo, a locked gallery), so a surface with no removal has no marks either.

## Auth-aware header island

[`guest-header.tsx`](../../src/components/guest/guest-header.tsx): logged-out → a quiet "Start for free"
CTA (the SSR default → zero flash for the anonymous majority); logged-in → the visitor's account menu
([`guest-account-menu.tsx`](../../src/components/guest/guest-account-menu.tsx)), fetched via `GET
/api/me/menu?event=<id>` ONLY when a session exists (the avatar is the viewer's public Storage URL; event-ownership
is an RLS-scoped select → the owner-only "Manage event" deep link). The menu's **Sign out** clears the guest
capability (`setStoredSession(qrToken, null)` via the module-singleton `emit()` in
[`use-stored-session.ts`](../../src/lib/guest/use-stored-session.ts)), signs out, then `router.refresh()`s —
so the visitor STAYS on the event page and a verified-email event re-gates to `<EnterEventPrompt>` (the
shared-device-bleed fix).

★ **A THIRD STATE, for the commonest person at a name-only party** (the identity reshape, 2026-09-21):
signed out WITH a stored name, the header wears
[`guest-name-menu.tsx`](../../src/components/guest/guest-name-menu.tsx) instead of the stranger's CTA —
the name, "Name not verified" (read from the mark, so the two cannot drift), then Confirm your email
(the `save` wear), Change name, and Sign in (the new `signin` wear). An ACCOUNT always wins the slot: a
signed-in visitor's menu is the truer answer to "who am I here" and their credit is not marked at all.
**No Sign out row**, because there is no session to end: the capability is a token in this browser's
storage, and clearing it would orphan the photographs this device can still remove. ★ Change name cannot
reach the entry modal's handle (this header is a SIBLING island of `EventExperience`), so it goes through
[`name-door.ts`](../../src/lib/guest/name-door.ts) — the same module-singleton shape, for the same reason,
as the stored session's own `emit()`.

## Demo mode

Env-gated (`NEXT_PUBLIC_DEMO_QR_TOKEN`; [`demo.ts`](../../src/lib/demo.ts)): `isDemo` is threaded from the
page through `event-experience.tsx`; the ~12 s poll is paused, the silent join skips `POST /api/guests`, and
the queue skips the real upload — `simulateUpload` returns a synthetic `approved` outcome so the optimistic
tile appears but is **never persisted**. The marketing side of the demo → [marketing-content.md](marketing-content.md).

**The demo's own arrival, framing and turn** (`arrival=role` etc., `docs/design/rulings.md` the sixth batch,
2026-09-20; `demo-wiring`). The demo is no longer the one visitor `computeEntry` (`entry-steps.ts`) skips: it
falls through the SAME welcome-then-nothing path as a public event (one `welcome` step, no gate behind it —
`resolveGalleryAccess` always resolves it `full`), and `entry-modal.tsx` reads its own `isDemo` prop to swap
that step's content for `RoleStep` (a role, not an invitation: whose party this is, that the visitor stands
exactly where a guest stands, the one thing to try). `guest-header.tsx`'s `isDemo` prop pins the header to the
top of the screen and adds a Demo mark beside the wordmark, so the admission survives the first scroll (it used
to be a banner in the album that scrolled away with it). A completed (simulated) upload surfaces `TurnCard`
(`guest-upload.tsx`) directly above the album's first tile — the photograph the visitor just added, since the
album is newest-first — and `event-experience.tsx`'s action row fills the slot a real guest's Save left behind
with "Start your own" beside Invite; a closing card repeats the offer below the whole album, in the report
footer's place (hidden for the demo).

**`phone=pair`: one broadcast channel, no stored bytes, no new table** (`lib/demo.ts`, `event-experience.tsx`).
A demo tab that did NOT arrive via a scanned link mints its own id (`crypto.randomUUID()`) and folds it into
its own Invite sheet's link (`?pair=<id>`); a tab that loads WITH that param is the phone side. Both open a
Supabase Realtime BROADCAST channel keyed by the id (`demo-pair:<id>`, never the shared `gallery:<qr_token>`
channel every stranger on the public demo shares) — the doorbell's own MECHANISM, never its channel. The phone
sends its upload's downscaled thumbnail (`fileToPairThumbnail`, a canvas-encoded JPEG, `httpSend` over REST so
no subscribe/teardown dance for an occasional message) the moment its own (simulated) upload lands; the laptop,
listening, decodes it back to a `File` (`pairThumbnailToFile`) and feeds it through the SAME optimistic-tile
path a real upload uses (`LiveGallery`'s `notifyUploaded`). A video carries no thumbnail (no cheap client-side
poster frame): the laptop's line says it arrived without a tile. Nothing here is persisted; the channel forgets
everything the moment either tab closes.

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
