---
track: identity-r5
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - src/components/ui/button.tsx
  - src/app/globals.css
---

# lp/identity-r5

**Goal.** Identity round 5: the remaining atoms asked as one set (3+ polished, cohesive systems drawn fresh), and the loading state explored again.

## The brief

**Round 5 of identity, from Will's desk 3 (2026-10-05).** Settled by him in r4 and worn by every frame now: **focus = halo** (a fine line of ink 2px off the control over a clear band, a soft aura; it gathers in as it arrives), **press = shrink** (the control gives about 2px under the finger at every size), **edge = floating** (every pop-out takes the bright edge in place of its hairline; dialogs, sheets and panels on their free edge in the room; cards flat). identity-wiring takes those three into production in parallel: draw them from r4's own option code meanwhile.

**Why this round exists, in his words, which are its point.** He skipped field, button, selected and toggles on purpose: "it was a bad idea to go per-atom questions when rethinking those components. It'd be much easier to judge them as groups, because the set of questions clearly has 3-4 consistent styles, each applied to the atom in question, so if I answer style X for one atom but style Y for another, or even worse style Z for a third, they begin to fall out of sync very quickly, killing the goal of cohesion. However, as of now, no single lane feels fully polished in the way a site like https://tailwindcss.com/ does (this is not a request to pull their dev theme, simply that I'm constantly impressed by how their visual identity carries so well through all of their components). Please rework those remaining atomic questions to be asked with groups, so I can select a polished set that works best together rather than pick & choose across styles. Rather than re-present the current individual options as groups, think it'd be worth going back to the drawing board for 3+ tailored options." And his warning: "it's common for each option to attempt to separate itself so distinctly from the others that all presented options feel *too* themed, rather than each simply offering a polished take regardless of any overlap of the others. The best option may be a few magic touches from a similar option."

**Ask 1, "Which set?"** Three or four options, each a complete system drawn by one hand, differing in a few load-bearing constructions and sharing everything else (the 40px field, the 8px corner scale, the ink and tone steps, spacing; the head atoms stay, as r4 carried). Complete means a field (input, textarea, select, the date pair), the button family (the ink primary to the quietest Cancel, the chip, the on-photo white Add), selected (a segment, a chip, a radio card, a tab) and the toggles (switch, check, radio, a slider's thumb), each at rest, hover, focus (halo), press (shrink), disabled and working (the arc running round as the stand-in: loading is its own ask). Judged on real screens, each at 1440 and 375, on paper AND in the room: Settings' door with its two dates, Account's billing row, Create's foot with Continue working, the guest's door with a password typed, the album's toolbar, and one dense screen (Settings' first page), so ornament adding up shows rather than being claimed. Each option's first frame is a composite real screen; its specimen sheet is one press away. Name each set by its principle (for instance keys and wells finished; lit edges; ink and tone; and a fourth, the house's own mix of his r4 picks with its magic touches), and let the recommendation name, per set, the one touch worth borrowing from a neighbour. Never asked here: colour, face, layout, the loading state.

**Ask 2, loading:** what a key shows while it works on what you pressed. His note: "Leaning towards option 2, the arc running round, but would like to see another round of exploration on this. Three lights feels unnatural in the button, the track filling is easy to miss as a quick swipe across the bottom of the button. The arc looping is an intuitive state, looks clean beside the copy, harder to miss and clearly shows why the button is being held. Each option should try to cleanly communicate that state, at whatever level of creativity or information-density they'd like for each." Draw his arc, refined, and two or three new states at different densities, each clearly saying "held, working" on the key beside its words; never three lights, never a track along the foot; reduced motion for each; on a primary, a quiet key, and a field checking what was typed.

**Brand: form, never hue.** brand r1 owns colour and face (Will's desk 4, next). Read its three decks (Afterglow, Contact Sheet, Everyone's Color: 14 slides each) in your worktree (`src/app/(dev)/design/sandbox/brand/`, merged today), and name in each set's `costs` any vision it would fight (a bevelled key beside Contact Sheet's flat prints, wells under Everyone's paper). The board's opening says face and light signature are the brand's and may change.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3134 is yours; 3000 is Will's desk.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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

## Where I am

- Done (pushed): the board's r5 rebuild in `src/app/(dev)/design/sandbox/identity/`: two asks, `set` (keys and wells,
  the house mix, ink and tone; lit edges drawn and cut) and `loading` (arc, words, and a third density); the composite
  first frame (Settings' door beside Account); two fresh-eyes passes taken (captures and reports in
  `../partyreel-wt/_scratch/identity-r5/r1/`, `r2/`). Light gate green at `0bdfde262` (typecheck, lint, the board's and
  the registry's tests, lab:smoke, lab:demo on the earlier lineup).
- Mid-flight: the second fresh-eyes pass's fixes, keys done (room thumbs, wells, rail, off key), the rest next.
- Next: the house's outline tier, room chips and delete contrast; tone's pressed chosen, thumbs and outline tier;
  firmer rings at rest; the halo just inside a segment or a tab; the composite's Account scrolled to its profile and
  switches; `time` replaced by `still` (words that say "Still saving" past four seconds); re-capture, the light gate,
  then this manifest's Questions, Deferred and Handoff.
