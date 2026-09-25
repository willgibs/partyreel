---
track: reel-and-copy
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery
  - src/components/guest/event-experience
  - src/components/guest/identify-step
  - src/lib/format/
  - src/lib/reel/defaults-action
  - src/components/guest/reel/live-reel-view
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/reel.md
  - docs/systems/guest-flow.md
---

# lp/reel-and-copy

**Goal.** Three small fixes from build 10's red-team: the album's count reads right at one, Settings leaves the reel's look and hold on the platform default when the host picks the default, and a reel view that never picked its own look follows the host's Set for everyone live.

## The brief

1. **"1 photo & videos"** (build 9 and 10's red-teams): the album's count label reads that way at one item in four places: `live-gallery.tsx` (about line 376), `event-experience.tsx`'s stats line (about 903) and the locked page's "... inside" (about 950), and `identify-step.tsx` (about 200, "... is/are waiting"). One helper beside `formatCount` in `src/lib/format/` answers the phrase once for all four, worded as the claims card already words a count of either type: one reads "1 photo or video" (never "photo", which lies when the one item is a video), more read "N photos & videos" with `formatCount`. Pin every form.

2. **Settings stores the default as a value** (build 9 and 10's red-teams): choosing the default hold (3 s) or the default look (Cinematic, stored `classic`) writes `3` or `'classic'` instead of NULL, so the event stops following the platform's default if it ever changes. `setReelDefaults` (`src/lib/reel/defaults-action.ts`) writes NULL when the chosen value is the platform default (`DEFAULT_HOLD_SEC`, the default look in `@/lib/reel/defaults`), each column on its own, as NULL already means "the default" (`resolveHoldSec`). Pin both columns.

3. **Set for everyone never reaches a screen already open** (build 10's red-team; the recommended answer, built, his to overrule): `live-reel-view.tsx` reads the event's look and hold once when the view opens (about lines 227 to 230), so a venue screen that never picked a look kept playing Cinematic after the host set Kinetic for everyone, though its next poll carried the new values, and the toast "Everyone sees this look now" promises otherwise. A view that never picked its own look or hold follows the event's live: the next poll's values take effect at the next hold, with no reload; a device's own pick still wins and is kept. Pin it with the view's tests.

Put the `reel.md` and `guest-flow.md` lines these change in your Handoff for the Orchestrator.

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
