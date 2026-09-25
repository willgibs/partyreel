---
track: reel-host-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "242e0bf4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/
  - src/app/(app)/layout.tsx
  - src/app/(app)/actions.ts
  - src/components/app/
  - src/lib/dashboard/
  - src/lib/event/
  - src/lib/notifications/
  - src/app/api/host/
  - src/lib/db/queries/pulse
  - src/lib/db/queries/events
  - src/lib/db/queries/social
  - src/lib/db/queries/notifications
  - src/lib/db/mutations/social
  - src/lib/db/mutations/host-media
  - src/lib/social/notification-prefs
  - src/lib/shared/use-active-section
  - src/components/shared/app-shell
  - src/components/shared/route-skeleton
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-host.json
  - src/app/(dev)/design/sandbox/reel-host/spec.ts
  - docs/reviews/album-columns.json
  - docs/reviews/reel-screen.json
  - src/components/shared/container.tsx
  - src/components/guest/event-experience.tsx
---

# lp/reel-host-wiring

**Goal.** Build the host's side of the live reel as Will picked it on `reel-host`, and take the host's pages wide the way the album already is. The reel exists from the album's second photo, so the host reaches it by adding photos rather than by opening an empty reel; the host's reel is the guest view with the owner's extras; defaults live in the view and in a Highlight reel section of Settings. This lane hands off and waits unmerged: the reel ships in one alias build with the guest, clip, teardown and sweep lanes.

## The brief

Will's picks and notes: `docs/reviews/reel-host.json` (the board draws each).

**The Reel card** (`progress=card`): the hub's card counts to two. At 0 photos it is dashed and reads "Starts at 2 photos"; at 1 the photo sits under an overlay; at 2 it becomes the living crossfade card, labelled "Highlight reel". Before two, a tap opens guidance: what is left, an Add photos button (the host upload panel, `host-add-provider`) and, on a moderated event, the fact that guests' photos count once approved. At two or more it opens `/e/<token>?reel`, where the owner already bypasses every gate; the owner's extras inside the view (the screen link, "Set for everyone", a Close that returns where the host came from) are the guest lane's. `/dashboard/[eventId]/reel` redirects there, so the Studio route dies.

**One number** (`review=agree`): the bell's badge, the event card's chip and Review's header read the same count, and the bell's row names the event and opens that event's queue (today it lands on `/dashboard`). Nothing about review ever shows on a screen: a reel playing to a room stays clean while the host moderates from a phone.

**Settings** (`style=both`, with his amendment to `switch`): a Highlight reel section of its own, holding Show the reel, the default look (the eight moods) and the default hold. It is an instant-save card like Profile & guests, placed after Guest uploads, and Danger zone moves last. It calls `setReelDefaults` from `reel-defaults-migration`.

**The dashboard** (`pulse=band`, with his note): the "What needs you" band gains "1 more photo starts the reel on <event>", and the line leaves at two; `next-step.ts` loses "Make the reel"; `hasReel` comes to mean the reel is live (the switch on and two reel-eligible approved items). Each event card crossfades to its next still in turn, first to last and around again, one card per beat (about 3 to 4 seconds), from `event_stills`: static under reduced motion, paused off-screen and in a hidden tab, the next still preloaded.

**Wide** (his `album-columns` width note): the dashboard home takes the shell's wide opt-in (`data-app-wide`) and its cards fill more columns; the event page's header row and its loading skeleton go wide too (today the skeleton renders at 1280, then jumps); the wide pages share the album's gutter, 12px on phones and 20px up (the guest album's `BLEED` moves to the same). The shared `Container` stays as it is: it serves marketing and admin.

**The host's clip add, server side only**: `/api/host/r2/complete-upload` and `host-media` pass `reel_eligible` (`create_media_as_host` has taken `p_reel_eligible` since the expand). The client add function is the clip lane's, its only caller.

**Leaving**: `reel-panel.tsx` and the hub's reel reads (`getReelConfig`, `countReelItems`); the bulk "Add to reel" action and its toasts; the Reel feed section and its uniform mode; `notify_reel_ready`'s pref, switch and mutation (the column drops with the drop migration). The noun is "clip" wherever a person reads it.

**The ROADMAP's Host lines in your files, cleared on the way**: the dead `use-active-section.ts` and `event-filter-pills.tsx` and the comments that still name `event-feed-action-bar.tsx`; the hub's cards row running past the phone's edge at 375; the dead `ApproveAllPendingButton`; the Review peek's missing Escape; a test for `useReviewTriage`.

**Order**: start with what needs nothing new (the card's states, one number, wide, the band, the leaving list, the crumbs); `reel-defaults-migration` merges first, and once `tracks/orchestrator.md` announces it, merge `origin/launch-prep` and build Settings and the crossfade on its action and `event_stills`. Keep changes to `buildNotifications` and `EventCard` additive: lab boards import them; name any break for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

- The Reel card is labelled "Highlight reel" in all four states (the board drew "Reel"; the brief names the living card
  "Highlight reel"), its line reading "Starts at 2 photos", "1 more photo", "Live for guests" or "Off". Recommended:
  keep, one door, one name.
- Switched off, the card reads "Off" and opens Settings, where the switch lives. Recommended: keep.
- Before two, the guidance offers Add photos alone (no Share the code beside it); on a moderated event it adds that
  guests' photos count once approved and, while a queue waits, a link to it ("3 waiting in Review"). Recommended: keep.
- The band's reel step shows only at exactly one playable photo with the reel on, never at none: the event's own launch
  list covers none, and a step there would push "Print the code" out of the band the evening before. Recommended: keep.
- The bell's badge counts each waiting upload, so with an unread announcement it reads the uploads plus one; every bell
  row that goes somewhere gains a trailing chevron, as the board drew the `agree` row. Recommended: keep.
- Settings' looks are the event's own photo under each mood's `grade` (the CSS filter the engine draws a still with),
  Editorial on its paper, not engine-drawn frames: instant, no canvas, nothing CORS can break. Before the first photo a
  marketing still (`wedding-toast`) stands in and the card says so. Recommended: keep; engine frames can replace them.
- Look and Hold stay editable while the reel is off (defaults for whenever it is on); a look or a hold saves silently
  (the selection is the answer), while the switch toasts and refreshes the hub. Recommended: keep.
- The dashboard's crossfade runs on every hosted card with two stills or more, reel on or off (the dashboard's calm
  motion, not a reel signal); Guest and binned cards hold their covers; the beat is 3.5 s, the dissolve 1.4 s, and a
  card off screen passes its turn to the next one the host can see. Recommended: keep.
- At 375 the cards row is a 2x2 grid of two-line cards at rest, all four doors whole, condensing to the pill row when
  stuck (a jump of about 100px on a phone, 60px at a desk as today). Recommended: keep.
- The Reel card's four stills come from the reel's take over a spread of 96 items, not the whole album: the take is
  quadratic (48 ms at 1,200 items, a second at 6,000) and the hub renders on every arrival. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the band's reel step; the hosted cards' stills and their turns, and the grid's one home;
  the hub and the dashboard as the wide pages with the album's gutter; the cards row's Highlight reel door and its phone
  grid; Settings' order; the counted numbers without `countReelItems`; the tile verbs and bulk Like without Add to reel;
  a new section, "The highlight reel, the host's side"; the stored reel's section cut to what a later lane still needs
  (the product rules the clip inherits, the style catalog, the engine, the export and its ★ `reelOutputKey` sweep).
- `docs/systems/notifications-analytics-growth.md` (outside `owns`, this lane's fact): "The host's bell" gains the one
  number a waiting queue reads everywhere.

## Deferred (ROADMAP one-liners, bucket named)

- Host: `REEL_MINIMUM` (`lib/event/reel-progress.ts`) and the guest album's `LIVE_REEL_MINIMUM`
  (`lib/events/gallery-reel.ts`) are one number in two homes, because neither held lane could import the other's; fold
  them into one when both land.
- Host: the Reel card, the band and the reel redirect ignore `ops_flags.live_reel_enabled`, so with the lever off a
  host's live card opens an album with no reel; read the guest lane's server fact (`guest-events-admin.ts`) once it
  lands.
- Host: `RouteSkeleton`'s studio shape and the Library's demo of it (`library/patterns/interactive-demos.tsx`) outlive
  the Studio's route; they leave with the Studio's files.
- Host: `setReelGuestVisibleAction` (`dashboard/[eventId]/actions.ts`) and `queries/reel.ts` outlive the host's reel
  pieces; they leave with the Studio's publish pieces (`components/reel/publish-action.ts`).
- Host: the lightbox's pending Approve branch can never render (the ROADMAP line's second half, in
  `shared/media-lightbox`, outside this lane).
- Marketing: the curation page's bulk-select mock (`bulk-tools.tsx`, `bulk-select-mock.tsx`) still draws and names "Add
  to reel", which left the host's bulk bar.
- Design system: `design-system.md`'s action colours still name add-to-reel violet (`--reel`), an action the bulk bar no
  longer has.

## Handoff (replaces the chat report)

- **Commits, all pushed to `origin/lp/reel-host-wiring`.** Work: `890b224c` (the Reel card, one number, wide, the band,
  the leaving list, the crumbs, the host's clip add, the Review peek and the triage tests), `9884a892` (Settings'
  Highlight reel section, the cards' cover cycle), `49da73fd` (the system docs, the pips at none on a phone),
  `eb9fc184` (the card's take over a spread of the album). Sync: `847e3132` (merge `origin/launch-prep` at `2dde45e0`,
  reel-defaults-migration merged at `71cfea65`). launch-prep moved after it (clip-bench merged at `88d390b0`, records
  `34d85368`, `87d7b96a`): that touches the `reel-cut` and `reel-story` boards and `touchpoints.ts`, none of this
  lane's files or reads, and the new boards import only `GridMedia` from this lane's paths (unchanged), so no second
  sync.
- **Gates on `eb9fc184`** (this manifest aside), each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (7
  warnings, all pre-existing and in files this lane never touched: `lab/_desk/review-session.tsx`,
  `sandbox/home-hero/shared.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`, `review-switch.tsx`, `use-flip.ts`);
  `pnpm test` 0 (438 files, 4,688 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3133` 0 (289 checks, 0 failing). `board: none`, so no `lab:demo`. The PostgREST shapes were probed
  read-only against the live project (the reel progress embed with its nested logic tree answering 0, 1 or 2 per event;
  `event_stills` at most four; `event_covers`; the bell's head count on live events).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 77 paths): owned paths, this file and
  `docs/systems/notifications-analytics-growth.md` (under System-doc edits), with these exceptions:
  - `src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx`: the Library declared `HostMediaGrid`'s
    `layout` axis, the uniform mode this lane removed (the gallery test checks a declared option against the source).
  - `src/components/reel/use-reel-config.test.tsx`: its one test that read the Studio route's source (the route is a
    redirect now, the brief's "the Studio route dies"), with its header clause and two imports.
  - `src/components/ui/floating-layer.ts`, `src/components/marketing/sections/features/curation/bulk-tools.tsx`,
    `src/components/marketing/sections/shared/bulk-select-mock.tsx`: one comment line each that named the deleted
    `event-feed-action-bar.tsx` (the ROADMAP Host line the brief assigns).
  - `src/lib/use-unsaved-changes-guard.ts`: three comment lines that named the deleted `settings-with-guard.tsx`.
- **The items**:
  - The Highlight reel card counts to two (dashed, the one photo under an overlay, the living card over the reel's own
    take) and opens `/e/<token>?reel` at two; before two, guidance (what is left, Add photos into the album's upload
    panel, the approval rule and the queue on a moderated event); off, Settings (`event-feed/reel-card.tsx`, the state
    in `lib/event/reel-progress.ts`; `reel-card.test.tsx`, `reel-progress.test.ts`).
  - `/dashboard/<id>/reel` redirects into the view once live, else to the hub; its Studio skeleton left
    (`reel/page.tsx`).
  - One number: the bell counts pending media outside the bin on live events, one row per event naming it and opening
    its Review room, the badge counting uploads, the breakdown failing soft (`notifications/build.ts`,
    `queries/notifications.ts`; `build.test.ts`, `notifications.test.ts`).
  - Settings' Highlight reel section: Show the reel, the look (the eight moods over the event's photo) and the hold, an
    instant card through `setReelDefaults`, placed after Guest uploads, then Profile & guests, the Danger zone last
    (`event-settings/highlight-reel-card.tsx`; `highlight-reel-card.test.tsx`); the dead `settings-with-guard.tsx`
    left.
  - The band: "1 more photo starts the reel on <event>" at one playable photo, gone at two, never with the reel off;
    "Make the reel" and the `highlight_reels` read left (`next-step.ts`, `getReelProgress` in `queries/events.ts`;
    `next-step.test.ts`, `events.test.ts`).
  - The cards take turns: one hosted card per 3.5 s dissolves to its next still, in reading order, from
    `getEventCardStills` (`event_covers` and `event_stills`, the cover first, four at most, presigned stable); off
    screen, one still, a hidden tab or reduced motion move nothing (`dashboard/cover-cycle.tsx`, `card-facts.ts`,
    `EventCard`'s optional `living`; `cover-cycle.test.tsx`, `card-facts.test.ts`, `event-card.test.tsx`).
  - Wide: the dashboard takes `data-app-wide` and more card columns (`event-card-grid.ts`, one home with the skeleton);
    the hub's header row and both skeletons go wide; wide pages wear the album's gutter, 12px then 20px from `sm`
    (`app-shell.tsx`, the cards row's bleed). The guest album's `BLEED` is the guest lane's batch 2 (its manifest says
    so), so `event-experience.tsx` stays untouched.
  - The host's clip add, server side: `/api/host/r2/complete-upload` and `createMediaAsHost` pass `reel_eligible`
    (`route.test.ts` beside the route).
  - Leaving: `reel-panel.tsx`; the hub's `getReelConfig` and `countReelItems`; bulk Add to reel, its toasts and the
    bulk bar's `reel` colour; `HostMediaGrid`'s uniform mode; the reel-ready email's preference, switch, mutation and
    select (the parity test now subtracts a column any migration drops); "clip" is already the only noun a person reads
    in these files.
  - The ROADMAP's Host lines: the dead `use-active-section.ts` and `event-filter-pills.tsx` (and the section model's
    dead parts in `lib/event/sections.ts`) and the three comments; the cards row at 375 (a 2x2 grid at rest,
    `event-feed/room-card.ts`); `ApproveAllPendingButton` and its action; the Review peek's Escape, with focus moved in
    and back (`selectable-media-grid.test.tsx`); `useReviewTriage`'s tests (`use-review-triage.test.tsx`), which found
    the reduced-motion "All caught up" toast never firing (a ref read before any render), fixed.
  - For the Orchestrator's ROADMAP pass, the lines this lane closes: Host `use-active-section`/`event-filter-pills`
    (and code hygiene's `event-filter-pills.tsx` mention), the cards row at 375, `ApproveAllPendingButton` (the
    lightbox half stays, under Deferred), the Review peek's Escape, no test for `useReviewTriage`.
  - Additive, as asked: `buildNotifications` gains an optional `pendingByEvent` (the badge now counts uploads on both
    paths; the `reel-host` board reads only the review row's body, which is unchanged) and `EventCard` an optional
    `living`.
- **Assets requested from Will**: none (Settings' looks stand on `wedding-toast` before an event's first photo).
- **Board ideas**:
  - The cards row's condensation jumps the album about 100px on a phone (the 2x2 grid to the pill row) and 60px at a
    desk; a stuck row that keeps its resting height would retire the jump.
  - The guest album's tile runs the whole take on the device (`tileStills`, `lib/guest/reel-tile.ts`): quadratic,
    measured a second at 6,000 items on a desk and slower on a phone; planning it over a spread like the hub's card
    (`spreadSample`) keeps it flat.
  - Settings' looks could be engine-drawn frames of the event's own photo (the board's), lazily in the sheet, once the
    swatches have met a real host.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the ten under Questions.
- **Look at first** (on the stretch's alias build; localhost cannot sign in, so this lane's visual pass ran on a local,
  uncommitted harness mounting the real components at 1440 and in 375 frames):
  1. The hub at 1440 and 375 for an event at none, one and two photos, and with the reel off: the card's four faces,
     the guidance and its Add photos, the living card opening the view, Close landing back on the hub.
  2. The bell with queues on two events: two rows, each naming its event and opening its Review room; the badge, the
     cards' chips and Review's headers reading the same numbers; a binned event's queue in none of them.
  3. Settings: the order (the form and its Save, Highlight reel, Profile & guests, Danger zone); Show the reel off turns
     the hub's card to Off; a look and a hold survive a reload, and a guest's view starts on them.
  4. The dashboard at 1440 and 1920: wide, four and five columns, one card dissolving per 3.5 s in a foreground tab,
     nothing moving under reduced motion; the band's "1 more photo starts the reel on" an event at one photo, gone at
     two.
  5. `/dashboard/<id>/reel`: the view when live, the hub otherwise.
