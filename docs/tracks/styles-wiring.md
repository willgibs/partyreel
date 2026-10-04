---
track: styles-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard.tsx
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/camera-settings
  - src/components/app/event-settings/adds-page
  - src/lib/disposable/album-style
  - src/lib/disposable/wait-words
  - content/help/review-uploads-before-they-appear.mdx
  - content/help/event-settings-explained.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
---

# lp/styles-wiring

**Goal.** Wire Will's add=styles in Create (three album-style cards, Live, Review, Disposable), the middle style named Review everywhere it appears, the develop time directly under the Disposable card.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on create-wizard r3 (2026-10-04), to wire: add=styles,** in his words: "Could continue to be polished, but this is the far superior option. Feels cleaner with more focused views/less fighting for attention, and each option is explained clearly against each other without just throwing screens at a new host. these visuals are more subtle/conceptual, and represent each mode's experience with its description well versus other options that are just throwing fullscreen experiences as me. ... I think this screen wins because of the clear distinction across the 3. Really clear mental model, and I like adding reviewed (should we go with a more simple 'Review'?) as a top-level mode instead of a more confusing subfeature. If disposable is selected, time should either be directly below option item or on a focused following screen, but not tucked underneath the timeline where it may not be noticed."

Read the board (`src/app/(dev)/design/sandbox/create-wizard/`: `add.tsx`'s `styles`, `fixtures.ts`) and `docs/reviews/create-wizard.json`. Production is the working version and the drawing the target.
- **The add step as album-style cards:** "Pick your album's style", three cards (Live, **Review**, Disposable), each with its small album picture moving through the night, a name, one line and a tick, a soft glow under the chosen card.
- **"Review", everywhere the style is named** (the Orchestrator's call on his question, his to overrule): a mode name in the camera's voice beside Live and Disposable, naming where those photos go (her Review room). One change across Create, Settings' album style (`camera-settings.tsx`, `adds-page.tsx`), the words (`album-style.ts`, `wait-words.ts`) and the help (`review-uploads-before-they-appear.mdx`, `event-settings-explained.mdx`). Never `src/lib/admin/reports.ts`, where "Reviewed" is a report's status, not the style.
- **The develop time directly under the Disposable card** when it is picked (the first of his two placements), never under the night slider; say in your Handoff whether the slider still earns its place there.
- **Polish where it costs nothing** (create-wizard r4 is the polish round with F1 and F2 on his desk later), and the illustrations' tones as tokens (the brand round may re-tint them).
- **Ownership:** `src/app/(app)/dashboard/actions.ts` is `dashboard-wiring`'s: a line you need there is proposed through the Orchestrator. `docs/systems/host-app.md` is `hub-strip-wiring`'s: write your lines under your Handoff's proposals. Leave the board's folder (r4 is coming).

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
