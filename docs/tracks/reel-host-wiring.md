---
track: reel-host-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
