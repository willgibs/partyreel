---
track: settings-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/
  - src/app/(app)/dashboard/[eventId]/settings/
  - src/components/app/create-event-wizard/
  - src/lib/disposable/
  - src/lib/guest/camera/roll-view
  - src/lib/guest/camera/words
  - src/lib/db/mutations/events.ts
  - supabase/migrations/20261005190000_roll_size_range.sql
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/customize.json
  - src/app/(dev)/design/sandbox/customize/spec.ts
  - docs/systems/database-security.md
---

# lp/settings-wiring

**Goal.** Will's customize picks in Settings and Create: the roll's film boxes and a full-width stepper from 1 to 99, Settings' first screen as live words over focused pages, her roll kept across a style switch, and nothing he did not pick built.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk.

**From Will's desk 3 answers on customize r1** (his verdicts and notes: `docs/reviews/customize.json`; the board: `src/app/(dev)/design/sandbox/customize/`, its asks, options and carried calls). Each change pinned by a test that fails on the old code:

1. **roll = both:** 12, 24 and 36 as film boxes and Other beside them, which opens a stepper from 1 to 99 under them, in Create and in Settings. His note: "When the +/- selector becomes visible below, let's stretch it with the - left and + right and count center. Looks weird aligned more tightly left here, with empty space to its right." The bounds: `events_roll_size_range check (roll_size between 1 and 24)` (`20261002200000_disposable_foundation.sql:148`) refuses 99, so one migration, `supabase/migrations/20261005190000_roll_size_range.sql` (the check 1 to 99, with the mirrors of `src/lib/disposable/roll.ts` and its SQL constants under their parity tests), a rolled-back check at its foot; the Orchestrator has the Advisor read it before the apply. What a guest's camera says at any size (the words in `src/lib/guest/camera/`). Her size is kept across a style switch and across the camera turned off and on (today `events_reveal_stamp`'s coalesce writes it back to 24: the ROADMAP line this retires).
2. **home = words:** his note verbatim: "I absolutely love the live words as a natural way to check the current event settings and quickly swap anything that looks weird, but these live words are still meant to be more of an overview concept. Each individual control/config/toggle/etc should have its own, more focused UI within its nested page. For example, for the 'Highlight reel' group, I can easily preview what's happening reading the live words, make quick adjustments by clicking those, or click into the highlight reel group to adjust/understand each setting individually, such as seeing the reel styles and what 3 seconds feels like versus other options. Best of both worlds." So: Settings' first screen says each choice in its sentence (each live word a choice made in place) as the overview, and each group's page holds a focused control per setting, built from production's own pieces where they exist (Create's style previews for the reel's styles, the roll's boxes and stepper). A focused control that needs real design (what 3 seconds feels like beside the other lengths) is a Board idea in your Handoff, never a guess.
3. **mine = account, read as NOT built now.** His note: "I'd like new event creation to feel a bit more focused and streamlined, so adding a way to set defaults within the flow feels like a feature that adds crowding more than a useful benefit... Thinking it's available in settings at best, but not ensuring it's included." No defaults in Create; a ROADMAP line (Deferred) holds "her usual, set in Account" if hosts ask.
4. **Carried calls NOT built:** `take-home` (a new export permission) and `taken` (a kept capture time: Will's open privacy question, X7): Deferred lines, never code.

Not yours: the album's order, the guest's sort and filter and the arrivals pill (album-order, in parallel); the hub's doors (event-header-wiring). `src/components/guest/camera/` belongs to back-layers until it merges; if the camera's words need `album-camera.tsx`, propose the lines in your Handoff. Wiring rigor: the whole gate; each change walked on your port at 375 and 1440 (Settings needs a host's sign-in, which only port 3000 has: walk what your port reaches and list the rest for the Orchestrator's desk walk).

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
