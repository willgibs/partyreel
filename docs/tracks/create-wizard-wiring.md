---
track: create-wizard-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard
  - src/lib/events/readiness
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - src/app/(dev)/design/sandbox/create-wizard/spec.ts
  - docs/systems/host-app.md
  - docs/PRD.md
---

# lp/create-wizard-wiring

**Goal.** Create's last steps as Will picked at create-wizard r4: the three style cards standing still with Disposable's time on a screen of its own, a close that names in one line what guests still need, and a failure held where she is with everything kept.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3136 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/create-wizard.json` round 4):** styles = focused, close = next, wait = breath (as built: nothing to do), failed = held. The board (`src/app/(dev)/design/sandbox/create-wizard/`) draws each in production's own room and atoms (`create.tsx` imports them): that drawing is your spec. Its carried calls stand (none overruled), and the round's new words stand as drawn for the voice to tune ("When do the photos develop?", "Guests still need your code: print it, or share it.", "Couldn't create it yet").

- **styles = focused:** the three style cards with nothing opening under them; picking Disposable adds one screen after this one, its own: when the photos develop, and the roll (the steppers grow by one when she picks it). His note: "I like the additional disposable settings getting their own focused view." He is still split on the cards' moving pictures ("hard mental model to keep 9 screens in your head ... overwhelming seeing 3 things happen at once each step"): create-wizard r5 explores that after you, so keep today's pictures and build the step's structure cleanly.
- **close = next:** the beat's close under Print and Share is one line saying what guests still need, the code sent or printed, which the two rounds just above it do; the five marks go (`beat.tsx`'s `BeatSteps`). In readiness, the code is the one essential a new event has not done (`readiness.ts`: the door and adds are done at Create, the photos and the welcome are not essential), so the line is true by construction. His notes: "How we present this line can definitely be designed better. I do like the subtlety versus the steps, though. Rather than shouting about what's done and what's to come, we should simply continue naturally guiding them through"; and Create finishes the event (PRD.md's core loop, refined from his note): r5 redraws the close as the payoff ("Get it ready" at the foot and the hub's checklist are part of why it felt halfway). Build the one line well now; propose nothing beyond it.
- **failed = held:** the screen she is watching stays and says nothing was lost; the foot becomes Try again; Back is there for a change; the limit-reached refusal keeps its Upgrade. His note: "State progress, feedback, failure notice, and corrective actions should all be made clear here, so if something goes wrong, it doesn't feel frustrating or scary. Only easily correctable." Today a failure returns to the look with a toast (`create-event-wizard.tsx`); after you, a toast never carries a failure here.
- **The Immediate NIT it closes:** at a roll of 1 the Disposable card reads "1 shots each".

**Nearby lanes this wave (never edit their paths):** Settings' camera page and the develop-time helpers (`camera-settings*`, camera-wiring: read them, never edit), the hub (event-header-wiring-2).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** Create on your port at 375 and 1440: each style, Disposable's own screen and back, the close's line, a failure (a throttled line that drops, a server refusal, the limit reached) held, Try again making it, Back for a change, reduced motion.

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
