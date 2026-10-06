---
track: identity-r5
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- Q1 · Three sets, not four. Lit edges (the brief's example) was drawn and cut after the fresh-eyes pass: in the room it
  was keys and wells under another light, on paper its sunk parts measured 1:1 and its graded edge drew a double
  outline, and a light on every key is a second light beside Afterglow's one a screen (`model.ts`). Built: keys and
  wells, the house mix (recommended), ink and tone. Overrule: redraw lit edges as a fourth.
- Q2 · Each set's first frame is a composite of two real screens a ground at a phone, Settings' door beside Account's
  billing row, since no one real screen holds every family (the door: the field, the chosen, the ink key and Cancel;
  Account: the quiet keys and Save off); at a desk, Settings over the hub with its album toolbar. Built; the board's
  carried call `door-composite`. Overrule: one screen alone.
- Q3 · "Settings' door with its two dates" is two screens (the door, and the event page's dates on Show), never the
  dates spliced into the door's page. Built. Overrule: splice them into the door's frame.
- Q4 · Create's foot is caught at Create event working, the wizard's one real wait; Continue moves on at once, so a
  working Continue pictures a wait that never happens. Built; carried call `create-wait`. Overrule: Continue, as named.
- Q5 · A field checking what was typed draws its working in a status slot at its end, a proposed hook
  (`data-slot="field-status"` in a `field-wrap`) where a wired field puts its tick or its cross. Built; carried call
  `status-slot`. Overrule: working only in the line under the field.
- Q6 · All sets share production's corner ladder and boxes (fields 8px, keys at 0.4 of their height, chips 11px, a
  segment 8px in an 11px track, the 40 by 24 switch, 18px check and radio, 20px thumb); a set builds a part and never
  moves it (`sheet/base.ts`, held by `identity.test.ts`). Overrule: let a set choose its own corners.
- Q7 · Working is three densities of one arc: the arc refined, the words (recommended), and "still" (past four seconds
  "Still saving"). A beam round the edge, the key held down and a clock of the wait ("Saving 0:05") were drawn and cut
  by the fresh-eyes passes (`model.ts`). Overrule: the arc alone.
- Q8 · The halo inside a track (a segment, a tab, a chip in a row) keeps its clear band at 1px, so its line stays inside
  the track's 3px padding (`sheet/settled.ts`): a refinement of his pick for identity-wiring to take or leave.
  Overrule: the 2px band everywhere.
- Q9 · A working key grows where its arc or words need room (Save to Saving), and the board draws it so. Recommended
  for wiring: a key holds the wider of its two widths from its first paint, so nothing beside it moves. Overrule: grow.
- Q10 · Ink's hover is one shared step in every set: a twelfth toward white on paper, 4% toward black in the room (at
  7% and more a white key read as held off). Built (`sheet/base.ts`). Overrule: a hover per set.
- Q11 · The recommendation is the house mix, not keys and wells (his favourite foundation): it keeps his wells for
  fields and his lighter chosen on both grounds, and its keys lie flat as Afterglow's decks draw them; the two
  fresh-eyes passes split (the first named keys, the second the house after the fixes). Overrule: keys and wells.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte; `docs/systems/design-system.md` is in the board's `lives`, for the
  wiring lane of whichever set he picks.

## Deferred (ROADMAP one-liners, bucket named)

- Now (accessibility): Account's "1 of 1 used" is `text-warning` amber on white, 1.85:1 on paper (11.9:1 in the room),
  measured on the identity board's Account frame; a paper warning-text token that reads at 4.5:1.
- Now (identity-wiring, once a set is picked): the door page's parts that are not atoms (the password's panel, "31
  guests are already in", the consequence lines) keep production's hairline boxes in every set; wiring gives them the
  picked set's construction.

## Handoff (replaces the chat report)

- Work commits, pushed: `03d649a8b` (the rebuild: two asks, sets on real screens), `0bdfde262` (the first fresh-eyes
  pass taken: lit edges and two working states cut, the composite), `d601bad35` and `9a4ffac84` (the second pass
  taken), `c90ff5f1b` (Settings' pages described), `eaf494f15` (the house's Afterglow cost). Sync commit `1f0bcd667`
  (merge of `origin/launch-prep` at `ca6e726c1`: settings-wiring's and album-order's changes to screens the board
  mounts; no conflict; deps unchanged). This manifest's commit is the head in the chat line.
- Gates, the board's light gate (PROGRAM.md "Speed over proof in exploration"), logs in
  `../partyreel-wt/_scratch/identity-r5/`: on `eaf494f15`, `pnpm typecheck` exit 0 (`gate-typecheck3.log`),
  `pnpm lint` exit 0 (`gate-lint3.log`), `vitest` on `identity.test.ts` and `registry.test.ts` exit 0, 41 passed
  (`gate-tests3.log`), `pnpm lab:smoke --base http://localhost:3134` exit 0, 22 checks, 0 failing (`gate-smoke3.log`);
  on `c90ff5f1b` (only one costs string changed since), `pnpm lab:demo --board identity` exit 0, 2 steps, 0 failing,
  the stage moving by up to 47.05% (set) and 2.93% (working) (`gate-demo-final.log`); its verbose run on `1f0bcd667`
  prints every pair, 25.7 to 47.0% and 1.8 to 2.9%, and every frame's caption (`gate-demo.log`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = paths under `src/app/(dev)/design/sandbox/identity/`
  and this file; no exceptions.
- The set ask (`spec.ts` `set`): three whole sets (`sheet/sets/keys.ts`, `house.ts`, `tone.ts`), each drawing the
  field, the button family, what is chosen and the toggles on the shared boxes (`sheet/base.ts`), under his three r4
  picks drawn from r4's own code (`sheet/settled.ts`: halo, shrink, floating); the house imports keys' well and tone's
  keys, never retyped.
- Its frames: the composite first (above), then Show: Settings' dates, Account, Create's foot, the guest's door, the
  album's toolbar with its View menu open, Settings' first page, every action and every field, each at 375 and 1440,
  paper beside the room (`board.tsx`, `views/`).
- The working ask (`spec.ts` `loading`): arc, words (recommended), still, on a primary, a quiet key, the 44px call to
  action and a field checking, each moving beside its reduced-motion twin (`.identity-still`); Where: Create event,
  Unlock, Account's Save, Settings' Set password; drawn wearing the set the sitting picked (`sheet/loading.ts`,
  `scene/working-words.ts`).
- Two fresh-eyes passes, independent reviewers judging only the captures (captures under
  `../partyreel-wt/_scratch/identity-r5/r1/`, `r2/`, `r4/`); every finding taken, cut, or answered in a Question.
- Retired with the round: r4's seven trait sheets, the edge's ten screens and the corners mark (git keeps them).
- Captions are read off each frame (`scene/reading.ts`), printed by `pnpm lab:demo --verbose`.
- Assets requested from Will: none.
- Board ideas: the guest door's sheet wears a three-lamp glow (red, amber, green) along its top, a traffic light where
  Afterglow draws one light sampled from the cover's photograph, for the brand-applied boards; a working key that
  holds the wider of its two widths (Q9) is identity-wiring's once working is picked.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: Q1 to Q11 above, and the board's four carried calls (`door-composite`, `create-wait`,
  `status-slot`, `veil`).
- Look at first: the set step's first frame at a desk, the house beside keys and wells on paper (the composite of
  Settings' door and Account), then the room; then Every action for each set's states.
