---
track: header-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/components/guest/guest-header
  - src/components/guest/guest-action-dock
  - src/components/guest/guest-share
  - src/components/guest/guest-bar
  - src/components/guest/guest-upload
  - src/components/guest/upload-tracker
  - src/components/guest/reel/
  - src/app/(guest)/e/[token]/page
  - src/app/(app)/dashboard/[eventId]/page
  - src/app/(app)/dashboard/[eventId]/loading
  - src/app/(app)/dashboard/[eventId]/reel/
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/checklist
  - src/components/app/event-feed/event-hub
  - src/components/app/event-feed/host-album
  - src/components/app/event-feed/edge-fade-scroller
  - src/components/app/event-feed/event-gallery
  - src/components/app/event-feed/feed-section-header
  - src/components/app/share/
  - src/components/app/host-upload
  - src/lib/guest/use-upload-queue
  - src/lib/db/queries/head
  - src/components/ui/shutter
  - src/components/ui/code-mat
  - src/components/ui/code-chip
  - src/components/ui/glyph-count
  - src/components/ui/button
  - src/components/ui/badge
  - src/app/(dev)/design/(shell)/library/
  - src/components/marketing/help/step-screens/
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/app/(dev)/design/sandbox/event-header/
  - docs/systems/reel.md
  - src/lib/event/sections.ts
  - docs/systems/uploads-and-r2.md
  - src/components/guest/upload/intent-sheet.tsx
---

# lp/header-wiring

**Goal.** Wire event-header's three picks into production: the guest album opens on the cover, Maya's hub wears that same head with its sticky bar, and the shutter stands at the foot with his scroll fade and a matching right-hand button; the heads' new atoms are built in src/components/ui/ under the one contract identity r2 styles.

## The brief

**Why.** Will answered `event-header` r1 on 2026-10-02 (`docs/reviews/event-header.json`): `guest=cover`, `host=shared`, `stays=shutter`, each the board's recommendation. The drawings are `src/app/(dev)/design/sandbox/event-header/` (read only: its r2 lane is cut after you merge). His notes, verbatim:
- on `host=shared`: "Still don't love how we're presenting some of the metadata under the title (item counts, date, live, etc). Love how they're captured into a sticky menu on scroll for page-wide access. Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow, etc. Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back from a guest page, for example. Wonder if there's a better way to redesign the action cards to pair with this new host head direction?"
- on `stays=shutter`: "Maybe a gradient overlay from the bottom, between the album and shutter/share controls, when there is more to scroll, both hinting to continue scrolling and providing more contrast between the gallery and UI. Could also add another button to the right side of the shutter (similar secondary design as other side) to visually balance those controls symmetrically."

**What to build.**
1. **The album's head is the cover**, on every event: the reel's own stills dissolving edge to edge under the name; Add photos standing white on them, the reel and Invite beside it. The board's three carried calls are taken: the reel's tile above the album goes (the reel lives in the head: its stills and its numeral); counts are glyphs with their words on hover and a tap; over the cover the guest's header stands on the photograph in white with no rule, elsewhere it is today's. An empty album shows the house light, as drawn. A **sealed** album (disposable mode, whose server lands in a parallel lane: its stills read `event_stills`, which will exclude sealed shots) shows the house light the same way until it develops. Reduced motion stands the cover still on its first still.
2. **The hub wears the same head** (`host=shared`): one head component on both sides of the code, with Maya's counts and link on it, the code on its white mat, and the room cards under it. The sticky bar he loved carries the facts once the head scrolls away. Leave today's facts line under the title and the rooms' handling as they are: `event-header` r2, cut after you merge, redesigns both from his note above. One exception: if the reel's door from the hub can open straight into its player without first painting the guest album (`[eventId]/reel/` is the old room's redirect), fix that flash at its cause.
3. **What stays is the shutter**: one round Add at the foot's centre in the album's light; while hers send, its ring is their progress. His two notes are part of the pick: a gradient rising from the foot under the controls while more album lies below (it hints the scroll and gives the controls contrast over photographs) and gone at the album's end; and a matching secondary on the shutter's right, Invite's twin on its left. **Call, his to overrule:** the right-hand one plays the Highlight reel, so the foot mirrors the head's three acts (Invite, Add, the reel); say in your Questions what that slot holds before an album has a reel.

**The atom contract** (header-wiring builds these in `src/components/ui/`; identity r2 styles exactly these hooks in the lab at the same time, so the names are fixed):

| Hook | What it is |
| --- | --- |
| `data-slot="shutter"` | the round Add: `data-state` `idle`, `sending` or `done`, its progress in `--progress` (0 to 1) |
| `data-surface="photo"` | any container standing on a photograph |
| Button `data-variant="on-photo"` | the white primary on a photograph |
| Button `data-variant="glass"` | the glass round on a photograph (usually `size="icon"`) |
| `data-slot="code-mat"` | the code on its white mat |
| `data-slot="code-chip"` | the code as a chip in the sticky bar |
| `data-slot="glyph-count"` | an icon and a number, its words on hover and a tap |
| Badge `data-variant="live"` | the live mark |

Each is a real primitive (its states, keyboard and reduced motion, a Library catalog entry) used by the heads. The board's other new atoms (photo-filled type, the number door) are not in the picks: leave them unbuilt.

**Folded in:**
- red-team 40's LOW: opening or closing the hub's code card in a hidden tab throws two `InvalidStateError: Transition was aborted` (its view transition): a hidden document skips the transition.
- `HostUpload` still `router.refresh()`es the hub when a batch drains though the hub's album is the live store (the ROADMAP's Host line): drop it if the store already brings the batch.

**For the next lane.** `door-reveal` is cut after you merge: its walk-through grows the doorway past the screen and settles the album's photographs into place on your cover. Leave a named landing (the cover's first stills addressable by a stable hook) and name it in your Handoff.

**Boundaries.**
- `use-upload-queue.ts` is imported by twelve files (`door/wait-picks.tsx` among them): the ring's progress is an additive export, a derived selector; the queue's API does not move.
- The Add sheet itself (`upload/intent-sheet.tsx`) stays as it is: identity r2 draws it.
- `src/components/guest/door/` is door-reveal's next and the dashboard is `dashboard-wiring`'s now: never touched. A new read goes in a new file under `src/lib/db/queries/head*`, never in a shared queries file.
- System docs: `guest-flow.md` (the album's head, what stays), `host-app.md`'s event page section, `design-system.md` (the new atoms and the contract).

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; every head read in a headless Chrome of your own at 1440 and 375 with reduced motion honoured: the album full, empty and scrolled deep (the fade, the shutter, the right-hand button), the hub tonight and the week before, the sticky bar; sign-in and upload cannot run on localhost, so name those steps for build 43's red-team in your Handoff.

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
