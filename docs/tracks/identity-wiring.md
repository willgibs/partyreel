---
track: identity-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6a1d56f5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/
  - src/app/globals.css
  - src/app/theme.css
  - src/components/guest/camera/
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/app/(dev)/design/sandbox/identity/spec.ts
---

# lp/identity-wiring

**Goal.** Will's three settled identity traits in production: the halo on every focusable atom, the shrink on every action, and the bright edge on everything that floats.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk.

**From Will's desk 3 answers on identity r4** (his verdicts: `docs/reviews/identity.json`; the board's own drawing of each: `src/app/(dev)/design/sandbox/identity/`, its option code is the spec):
1. **focus = halo:** "a quiet ring of light round it: a fine line of ink stands 2px off the control over a clear band, in a soft aura (grey on paper, light in the room); it gathers in as it arrives." Lands: every focusable atom's focus-visible: keys, fields, switches, checks, radios, a slider's thumb, tabs, the shutter.
2. **press = shrink:** "the control gives under the finger by about two pixels at every size, from a chip to the 44px key, the way a phone's own controls do." Lands: every action's active state: buttons, chips, segments, the shutter and the code chip.
3. **edge = floating:** "every pop-out takes the edge in place of its hairline, on paper too; in the room every dialog, sheet and panel takes it on its free edge. Cards stay flat." Lands: `globals.css`'s bright edge (`data-lit`), carried from media to the surfaces the answer names, on dark grounds only.

Change only these three traits, one home each (a token or a utility, never per-component copies), and nothing of the atoms' forms: identity r5 (a board, in parallel) asks the field, the buttons, selected and the toggles as one set, and brand r2 (Afterglow, picked on desk 4) owns colour and light, so the edge keeps today's light until its pick. Reduced motion lands each at once. Pin each by a test that fails on the old code (a focusable atom without the halo, an action without the press, a floating layer without the edge), and keep `popup-kinds.test.ts` and the Library's specimens green. Wiring rigor: the whole gate; walked on your port at 1440 and 375, by keyboard (focus) and by pointer (press), in the room and on paper; the PREMISE lines `lab:smoke` prints for the boards whose `lives` include `src/components/ui/` listed in your Handoff.

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
