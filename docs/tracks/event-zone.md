---
track: event-zone
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8bb4e103"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005220000_event_zone.sql
  - src/lib/event/zone
  - src/lib/validation/event
  - src/lib/db/mutations/events.ts
  - src/lib/db/queries/events.ts
  - src/lib/events/gallery-access.server
  - src/app/(guest)/e/[token]/page
  - src/components/guest/gallery-order
  - src/components/guest/live-gallery
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/
  - src/app/(app)/dashboard/[eventId]/as-guest.server
  - src/components/app/share/as-guest-view
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - src/lib/shared/album-order.ts
  - src/lib/dashboard/viewer-day.ts
---

# lp/event-zone

**Goal.** Every guest's album turns at the same moment: the party keeps its own time zone, so the night in order and the develop's 9 am are one morning, the party's, for every reader wherever they are.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**Will's ask (2026-10-05):** "It feels unfair to unlock the album at different times for certain guests based on geographical location. Is there a way to standardize this?" Today the album's turn (album-order, merged: newest first while the party is on, the night in order from 9 am the morning after its last day) happens in each READER's zone: the guest page feeds `albumTurnAt(facts, zone)` (`src/lib/shared/album-order.ts`) the zone `resolveViewerZone` reads from the request, so a guest in London sees the night in order eight hours before one in Los Angeles. A disposable's develop is already one instant for everyone (`events.develops_at`, a timestamptz), but its 9 am default is the host's browser zone at the moment she picked it (the ROADMAP's develop-zone line: a destination wedding set from home develops in the home morning).

Each change pinned by a test that fails on the old code:
1. **One moment for everyone.** The party keeps its own zone: `events.time_zone`, an IANA name, in one migration (`supabase/migrations/20261005220000_event_zone.sql`): additive, nullable for the rows that exist, the host's column-locked write re-granted exactly (database-security.md's workflow; a rolled-back check at its foot). Milestone 37's live build shares the database and never reads it. The Orchestrator has the Advisor read the file before the apply. Every reader's album turns at one instant: 9 am the morning after the last day in the party's zone, computed once on the server and handed to the page as an instant (never a zone), so no reader's clock or geography moves it. A row with no zone (test data only) keeps one fallback, said in one place.
2. **Captured, never asked.** Create writes the host's own zone (her browser's `Intl` zone, validated on the server against the runtime's supported zones) with the event's dates; a Settings date edit keeps it, or writes it where it is missing. A host who never travels never sees a zone.
3. **The develop's 9 am reads the party's zone too** (Create's develop row and Settings' camera page), so the default develop and the turn are the same morning; the ROADMAP's develop-zone line closes.
4. **A party far from home (a call, recommended):** where Settings shows a time (the develop's hour) and the party's zone is not the host's own, the time names its place ("9:00 AM in Mexico City"), and Settings offers the party's zone as one quiet choice for a host planning from away: never in Create, never a raw IANA list as the first thing she meets. If it costs more than it is worth now, build 1 to 3 and write 4 as a Deferred line with its reason.
5. **See it as a guest** shows the guests' order after the turn (ROADMAP: `as-guest-view.tsx` hands `LiveGallery` no order): hand it the same server-computed instant.
6. **Edge cases, each a test:** a range (its LAST day); both DST nights in the party's zone; a party in Auckland read from Los Angeles and London (one instant); a zone the runtime cannot read, refused by the server; a row without a zone; a disposable (the develop instant wins, as today); a date edited in Settings from another zone (recommended: a date edit never moves the party's zone; only the explicit choice in 4 does).

**Coordination with the open lanes:** `src/lib/shared/album-order.ts` is capture-time's this round (its `takenAtOf`); `albumTurnAt` already takes a zone, so call it with the party's, and write any change it truly needs under Questions. `src/app/(app)/dashboard/actions.ts` is crumbs-82's: carry the zone on the validated values (`src/lib/validation/event.ts`) into `src/lib/db/mutations/events.ts`; if the action itself must change, write it under Questions and the Orchestrator sequences it after crumbs-82's merge. `src/lib/dashboard/viewer-day.ts` (crumbs-82's) stays the dashboard's own day rule; the guest page stops reading it for the turn. `src/lib/db/types.ts` is regenerated by the Orchestrator after the apply: a narrow typed seam until then, named in your Handoff.

The docs say the new truth, each in its home: guest-flow.md (the turn is one moment, the party's), disposable-mode.md (the develop's zone), host-app.md (Create and Settings: the zone captured, the far-from-home choice). Wiring rigor: the whole gate; the guest page walked on your port at 375 and 1440 from two emulated zones (CDP `Emulation.setTimezoneOverride` in a headless Chrome of your own), the turn landing at the same instant; Create and Settings need port 3000's sign-in: list those walks for the Orchestrator's desk walk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
