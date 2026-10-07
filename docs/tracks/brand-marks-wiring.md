---
track: brand-marks-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/brand/
  - src/components/shared/logo.tsx
  - src/components/shared/logo.test.tsx
  - src/app/icon.svg
  - src/app/apple-icon.png
  - src/app/favicon.ico
  - src/app/manifest.ts
  - src/app/opengraph-image.tsx
  - public/icons/
  - kit/logo/
  - scripts/build-press-kit.mjs
  - src/app/globals.css
  - src/app/theme.css
  - src/app/globals-theme-contract.test.ts
  - src/components/ui/badge.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/sonner.test.tsx
  - src/components/ui/display.test.ts
  - src/components/ui/identity-traits.test.ts
  - src/components/app/dashboard/marks.tsx
  - src/components/app/dashboard/needs-you.test.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/lib/reel/engine/canvas2d.ts
  - src/app/(guest)/e/[token]/card/route.tsx
  - src/app/(dev)/design/sandbox/brand/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand-marks.json
  - src/app/(dev)/design/sandbox/brand-marks/spec.ts
  - docs/systems/design-system.md
  - kit/README.md
  - docs/ASSETS.md
---

# lp/brand-marks-wiring

**Goal.** The brand's marks and tokens as Will picked at brand-marks r1: his v1 wordmark finished, the ember Ring as the icon everywhere an icon lives, the room's own black as every piece of the room on paper, and the status set as a clear hierarchy of states.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/brand-marks.json` round 1; the board `src/app/(dev)/design/sandbox/brand-marks/` draws each option on production's surfaces):**
- **`wordmark=finished`:** his letters exactly, parted only so no two touch (a hair at large sizes; a small cut a step more for the bars: Pa, yr, ee), legible from 16 px to a poster. His note is the rule to keep: "it's a bit bold, so at any size, it still packs a bit of a punch ... the wordmark should present as a singular group to present clearly, rather than feel spaced out and spread focus": the bars' cut must still read as one bold group, never spaced. Write that philosophy into design-system.md's wordmark line.
- **`icon=ember`:** the puck in its ring, key-lit from the top-left by the house ember, deepening to an ember red at the bottom-right; a whole ring at every size. It replaces the stand-in everywhere an icon lives: `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`, the manifest's icons (`public/icons/`, maskable included), `Logo markOnly` (lucide's `Aperture` today), the reel's watermark badge (`canvas2d.ts`'s REAL-LOGO seam), the card route's placeholder tile, and the press kit (`kit/logo/`, `scripts/build-press-kit.mjs`, kit/README.md's Sources). Update ASSETS 19: the Ring is the v1 now; a bespoke take is brand-marks r2's (a board this wave).
- **`plate=room`:** every piece of the room on paper (`.surface-ink`: the foot's slab, a menu or a toast on a light page, the code's plate) is the room's own black, its light as bright as in the room. His note: "the contrast feels a lot richer, almost vibrant ... The deeper black also makes the color in the footer (top glow, media) pop much more."
- **`status=amber`, with his invitation to your best version:** "green for clear success ... The warning color also allows a bit of distinction between failure and warning states, so less intense states feel less intimidating. Open to your favorite version of this color palette for states. Also open to your new best ideas on how to apply them ... including all three to allow for a clearer hierarchy of states rather than simply red or not red." The Orchestrator's call, his to overrule: four tiers, each a point and its word on both grounds: **Standby** half-lit with no hue (waiting on us or the line); **Ready** a clear green (done); **a warning** amber, deepening toward orange on white so it stands (look soon, nothing lost: near a limit, a reconnect); **a fault** red, the one red that also means a count that needs her (the tally, `--needs-you`) and Live, the only point that breathes. Map every state production shows to its tier (about 129 files read status colours: change values at their source in `globals.css` and `theme.css` and rename nothing, so no consumer is swept), the dashboard's green `LiveDot` turned red, and list the map in design-system.md.

**The board's carried calls, as taken:** the word alone in the bars and the foot (no lockup); the Ring is his v1 icon; the icon is the house's, never an event's light; live breathes; production's grade unchanged, the ember's stops joining it as tokens; the v1's near-touching pairs parted a hair at large sizes. **One exception:** `lamps` (the five house lamps into the ember) holds for the foot's seam and the confetti, but a photo-less event's lamp on the dashboard keeps its own hue: Will's presence note says the house ember on every event "will get very boring", and the event-page board (this wave) answers how a photo-less event is lit.

**ROADMAP lines you close (quoted by their opening words; the Orchestrator retires each at your record):** "The brand pass the day the v1 icon lands"; "the amber pill should be `--needs-you`" (marketing's, if it is a token change at the source; else leave it); the card route's "placeholder aperture tile left for the wordmark".

**Retire the brand board:** its one pick (`take=aperture`) is applied by your marks and tokens and by the event-page board's light, so delete `src/app/(dev)/design/sandbox/brand/` in your branch; the Orchestrator deletes `docs/reviews/brand.json` at your record.

**Refresh the kit** from kit/README.md's Sources at your handoff (the logo files; the screens are the Orchestrator's, captured from partyreel.com after the milestone).

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
