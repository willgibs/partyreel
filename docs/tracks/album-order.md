---
track: album-order
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/album-order
  - src/components/shared/album-window
  - src/components/guest/gallery-
  - src/components/guest/event-experience
  - src/components/app/event-feed/event-gallery
  - src/components/app/event-feed/host-album
  - src/lib/event/hub-album.ts
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/customize.json
  - src/lib/events/album-wire.ts
  - src/app/(dev)/design/sandbox/customize/spec.ts
---

# lp/album-order

**Goal.** The album turns once the party is over, guests keep a simple sort and filter, and arrivals that land out of sight are said without ever moving what she is looking at.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**From Will's desk 3 answer:** customize r1's order = turns ("Newest first while the party is on; from the morning after its last day, or its develop, the night in order"). His note: "I like this, but it would feel weird to scroll backwards through time if we have a good idea of when the event is over to flip, which we usually do. However, guests should always have sort/filter available to browse the gallery as they'd like, doesn't need to be overcomplicated." And his question, which this lane answers in the product: "for any gallery not sorted by most recent, when a new media item/batch lands not first into the gallery, what is that animation and how does it constantly impact a user's gallery experience when they are scrolled down? Don't want anything new to push out what they're looking at, especially at big events with more frequent uploads. You're in the gallery looking at a group of photos, then 200 new ones come in and you have to scroll for ages to find what you were looking at again."

Each pinned by a test that fails on the old code:
1. **The turn, as presentation:** newest first while the party is on; in order from 9 am the morning after its last day (the event's zone: the zone the develop time was picked in) or at its develop for a disposable; an undated album stays newest first (a host's "in order now" for it is a Deferred line: no column now). "In order" runs on ARRIVAL (`created_at`): a kept capture time is Will's open privacy question (X7), never assumed; it also keeps the in-order album append-only. The wire stays as it is (`album-wire.ts` bakes `(created_at desc, id desc)` into the manifest and the delta protocol; the CDN-cached version lever rides it): reverse and filter client-side over the same manifest; the engine lays rows from whatever order it is handed.
2. **The guest's sort and filter:** Newest/Oldest and Photos/Videos/Yours, nothing more, reusing the host's control (`event-gallery.tsx`'s `HubSort`), remembered per device, defaulting to the turn. No person filter, no date groups.
3. **The arrivals pill:** the album already holds the reader's place by hand (`album-window.tsx`: nothing a reader is looking at moves; Safari included; a flick's momentum waited out). Add one quiet "N new" pill, shown only when arrivals land out of view, under the bar (never over the album's head), with the direction it takes her, cleared when she reaches them, reduced motion landing at once; the host's hub album too. A carried call Will may overrule: draw it once in your Handoff's capture.
4. **Edge cases, each a test:** undated and never closed; multi-day (the morning after its LAST day); a disposable (turns at the develop; later uploads append); the zone; the turn moving under a reader (the anchoring holds; the pill says where); a batch of 200 landing above and mid-album.

Not yours: `src/components/shared/masonry.tsx` and the viewer (back-layers, merging); Settings (settings-wiring). Wiring rigor: the whole gate; walked on your port at 375 and 1440 as a guest (the host's hub needs port 3000's sign-in: list it for the Orchestrator's desk walk).

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
