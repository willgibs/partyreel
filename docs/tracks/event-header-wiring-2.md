---
track: event-header-wiring-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/event-hub-head
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/share/event-code-door
  - src/app/globals.css
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/event-header-wiring-2

**Goal.** The hub's cards as Will picked at event-header r6: the Seam made Afterglow's own, each count a badge on its glyph's shoulder only where it needs her, one 'needs you' colour (tally) worn by the badges, their pills and the code's corner; then the board retires.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/event-header.json` round 6):** card = shoulder, attention = tally; and brand r2's take = aperture (`docs/reviews/brand.json`), which settles the board's Paper knob. Wire event-header r6 into production's hub exactly as the board draws it: `src/app/(dev)/design/sandbox/event-header/` (`seam.tsx`, `cards.tsx`, `cards.css`, `edge.ts`, its spec's opening, terms and carried calls) is your spec.

- **The Seam, as r6 corrected it** (a correction he saw, never an ask): the edge's own colours, sixth by sixth, pooled in three soft ellipses and crossing with each photograph, at the brand's reach (120 px at a desk, 72 in a hand, full strength); the cards standing on the cover's foot so the light falls past them into the page and nothing pressed sits inside it; the cover's scrim lifted at its foot so the edge the light is born at is seen; the fold never flashing it; on paper no light at all, Aperture's form: a strip of the room (the board's Paper knob at `aperture`).
- **card = shoulder:** the count a badge on the glyph's shoulder only where it needs her or is hers to act on (Review's waiting, the door's asks); every other glyph bare, its line its words; 99+ in the badge alone, the accessible name keeping the whole number ("Review: 140 waiting").
- **attention = tally:** one status token, "needs you": the camera's red the palette already holds (the live mark's), solid and hard-edged, never a light, worn by every waiting count (the badges, their pills when folded, and the code's corner, `EventCodeDoor`, whose retired waiting amber it replaces, closing the ROADMAP's Design line on it). One home in `globals.css` for both grounds; the Seam stays the screen's one light. A brand-marks board (desk 6) draws the whole status set next with this token given, so name it plainly.
- **The carried calls, every one taken (he overruled none):** the cards on the cover's foot; a hand's one row of five tiles (glyph, count, short word); 99+ in the badge alone; the folded band's ends (the face left, the code a pill right, the doors between); every glyph ink, the reel's too; a tablet's five tiles across (640 to 1088); the fold dissolving over 150 ms under reduced motion, nothing travelling; Settings' card saying Paused while uploads are paused.
- **The edge's colours in production:** the board reads each still's bottom edge at runtime (`edge.ts`); production may read at runtime or at upload (the ROADMAP's Upcoming "the Seam's edge sampler as production code" line). Choose by correctness and cost (a canvas read of an R2 image needs CORS on its origin; the cover's crop changes per width; a still not yet read needs a quiet stand-in), name the cost per hub view, and if it takes a column, write that migration only as a proposal for the Orchestrator (no schema change rides this lane unasked).
- **Retire the board** once its picks are built: delete `src/app/(dev)/design/sandbox/event-header/` (check that nothing else imports it; `registry.test.ts` and `pnpm lab:smoke` stay green); its ledger is the Orchestrator's to delete at the record.

**Nearby lanes this wave (never edit their paths):** the Guests room and its rows (host-moments-wiring), Create (create-wizard-wiring), the album's arrivals (album-moments-wiring). `globals.css` is yours alone this wave: a token another lane needs is named in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** the hub signed in on your port, each card at rest and folded at 1440, 820 and 375, in the room and on paper; a reversal mid-fold; a peak at 99+; Tab through the cards and the pills; the code's corner counting the door's asks in tally; reduced motion.

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
- Calls his to overrule, one line each
- Look at first: ...
