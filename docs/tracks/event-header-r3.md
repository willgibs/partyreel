---
track: event-header-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "518aff34"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - src/components/app/event-feed/
  - src/components/app/share/
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - docs/systems/host-app.md
---

# lp/event-header-r3

**Goal.** event-header round 3: the hub head's facts (the strip made independent of a timeline, plus new ideas) and its doors (each of r2's three refined), every option with its sticky-band form, drawn on the hub as rooms-wiring wired it.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answers (event-header r2, his desk on build 45, 2026-10-03), in full:**
- facts=strip: "I think something like this is super cool. It makes the feature card feel more alive while reducing the crowded UI, leading to cleaner presentation overall. However, we need to ensure the final design spanning the card isn't reliant on a 'timeline' - think a multi-day event/trip with slow trickle, an event with no date set, a morning event (all uploads concentrated in one early part of day), we don't do event time ranges/multiple days right now (is it worth adding?), lots of edge cases where a timeline-based idea can break. Curious what else you could think of. Options 1 and 4 felt too bland, the dial from 2 just has a weird sundial feel in that spot and also suffers from the same, if not more of the timeline-based downsides (what's stat and end, what's range, etc). still love it as an analytics visual somehow. worst case, we bank in library."
- doors=?: "I'd like to see a second-round iteration of each before deciding. For today's cards, I don't love filling the highlight reel anymore. we have images in event head and gallery below, this crowds it too much. should get closer to rest of cards. for 1's design overall, I fee like there a very apple tv UI-esque way to update this where we work with some wort of gradient overlay fades, cards covering seams, beautiful almost 'app store' display. For option 2, windows into each room, I think this helps visualize the idea of each card much better than the icons, but the designs should be a bit more subtle themselves to not fight with the head or gallery media-forwardness. highlight reel card should also fall in line here as mentioned previously, so it isn't drawing a ton of attention versus the rest of the page as it currently is. should have its own card design within this option. for option 3, on the cover in glass, this is my favorite safe option that stays a bit minimalist, good info conveyance, and slides right into the sticky menu on scroll (important for all options to have their version in cleanly doing so). would like to see this more polished as the 3rd option re-exploration."
- rooms=over is wired (`rooms-wiring`, merged): every room opens in one panel over the hub, the reel full screen, See it as a guest a phone over the dimmed hub. Draw the hub as it now is.
- Settled with him the same night: an event gets an optional end date (a range of days, no times), wired later this round by `event-dates`. Draw ranges as settled with your own fixtures: a multi-day event, an undated one, a morning-only one, a slow trickle.

**The asks:**
1. **`facts`:** the strip, his pick's direction, made independent of a timeline, so it reads true for every case above; plus two or three new ideas of your own. The dial is banked: draw no dial on the hub. Note in your Handoff where it could live as an analytics visual (the Library, or a later host analytics board).
2. **`doors`:** each of r2's three refined as he asked. Today's cards become app-store depth: gradient overlay fades, cards covering seams, and the reel card no longer filled with stills. Windows into each room become quieter, so they never fight the head or the gallery, with the reel's own card in line. Glass on the cover is polished. Every option is drawn with its sticky-band form, since he named it "important for all options".

Drawings at 1440 and 375, paper and room, on tonight's data and on the fixtures above. Recommend one each. Retire r2's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3134`; `pnpm lab:demo --board event-header --base http://localhost:3134` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The strip's axis.** Recommended: the album's own order, photo by photo (first photo at the left, newest at the
  right end, each mark as tall as how many photos landed with it), never the clock, so a morning, a weekend, an undated
  album and a trickle all fill the same line and none has a start, an end or a gap. Built; his to overrule.
- **The facts' new ideas.** Recommended three beside the strip: the faces along the foot (who made the album), the
  newest in a line (the latest photo, who and when, then the totals), and the album's colours (a strip of chips, each a
  run of photos in its own colour). Today's line and the name alone leave (he called both bland); the dial is banked,
  drawn nowhere.
- **What the doors' frames wear for the facts, and the facts' frames for the doors.** Recommended: each other's
  recommendation, since no option of either ask is production any more (`today` undeclared); his pick replaces it the
  moment he answers.
- **Glass's sticky form.** Recommended: the capsule itself floats on under the bar (the lead, the doors and the code's
  chip in one glass capsule over the album), rather than a full-width band holding it. Built; his to overrule.
- **The ground.** Recommended: a Ground knob (paper, the room), opening in the room as identity's does; the cover is
  the room in both.
- **Date ranges.** Drawn as settled with the board's own formatter ("October 2–4, 2026", an en dash, no times);
  `event-dates` wires the real one.

## System-doc edits (in place, owned facts only)

- none: a lab round ships no production byte, and the lane owns no system doc.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, all pushed to `origin/lp/event-header-r3`:** the plan `169951d3`; the work `daff6f0e` (the board drawn),
  `32b1a74a` (the strip spans every album, colours as chips, the panel's close, the phone's short date) and `d75e53fe`
  (Settings' steps as an unlit light, the reel window still, the options' words as measured); the sync `e06121b9`
  (launch-prep at `cd067986`: wait-wiring's host cover moved `event-hub-head.tsx` and `page.tsx`, two reads; no
  conflicts, nothing on the board's fixtures develops); this manifest commit is the head in the chat line.
- **Gates on the synced tree `e06121b9`, each its own exit 0** (logs in `../partyreel-wt/_scratch/event-header-r3/`):
  `pnpm typecheck` (`gate2-typecheck.log`), `pnpm lint` (`gate2-lint.log`), `pnpm test` 846 files, 9,982 tests, with
  `registry.test.ts` and `queue.test.ts` (`gate2-test.log`), `zsh scripts/build-lock.sh pnpm build` (`gate2-build.log`),
  `pnpm lab:smoke --base http://localhost:3134` 17 checks, 0 failing, the board 829 of 1,200 words (`gate2-smoke.log`),
  `pnpm lab:demo --board event-header` at 1440 (`gate2-demo-1440.log`) and `--width 375` (`gate2-demo-375.log`): 2
  steps, 0 failing, every step draws its options. Before the sync, on `d75e53fe`, the same demo wearing
  `--state screen=375 --state ground=paper --state moment=before`: 0 failing (`gate-demo-knobs.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/event-header/`
  (`night.tsx` deleted, `facts.tsx` new) + this file; no exceptions.
- **facts, r3** (recommended `strip`): four options, each drawn on the same six albums at once (`fixtures.ts`: the
  wedding tonight and the week before, a weekend October 2–4 on its third day, a morning, no date, a trickle), each
  frame the top of the hub's first screen; none has a start, an end, an hour or a range on it.
- **The strip, photo by photo** (`facts.tsx` `stripMarks`, `slotsFor`): the album in its own order, a mark as tall as
  how many photos landed within ten minutes of it, softened against its neighbours; it spans the card for every album
  (only a very small one gathers at its newest end, the quiet points before it); the newest marks and the end lit
  while photos land. Computed from arrival times alone, which production's manifest already carries (`t`).
- **The faces along the foot**: who added, newest first and lit while adding, the rest a count, then the album's
  count as a readout; the week before, empty seats. **The newest, in a line**: the last photo as a print, who and how
  long ago, the totals in words. **The album's colours**: chips, each a run of photos in its photograph's own colour
  (read off its pixels, vivid ones weighted), the newest lit.
- **doors, r3** (recommended `glass`): each with Try it (live: scroll it into its sticky form; a press opens the room
  over the hub as wired, Esc closes) and its stuck still; measured at 1440 tonight, the album starts at 519px (glass),
  598px (cards), 648px (windows) (`demo-1440.log`, its `--verbose` run before the sync; no door's geometry
  moved after it).
- **Cards over the seam**: the cover fades into the page it meets (`--eh-page` carries the page's own colour into the
  room-dark cover), cards on the lift shadow stand 64px into it (44 in a hand), the reel's card its violet glyph and no
  stills; stuck, pills under a band that fades into the album; in a hand, a shelf that runs off the edge.
- **Quiet windows**: each door a small inset well in grey and ink that takes its colour under the pointer; the reel's
  own window a small player; Settings' window its rows (a ring of segments read as a spinner, so it left).
- **One glass capsule**: five segments at the cover's foot, waiting counts as amber lights, a tab bar in a hand;
  stuck, the same capsule floats on under the bar, the cover's face leading and the code's chip closing it.
- Every door says Settings' steps left as an unlit light (a ring), amber kept for what waits on her (status=lights).
- r2's `rooms` ask retired into the opening's settled lines (the hub drawn as wired, rooms over only), its picks and
  notes in `earlier`, round 2 in `history`; the dial's `night.tsx` removed (it stays at `ff78ca3b`).
- Knobs: Screen (1440, 375), Ground (the room, paper; opens in the room), the Moment (the doors' week before).
- **Assets requested from Will:** none (the bootstrap stills stand in throughout).
- **Board ideas:** the dial as an analytics visual, on a later host analytics board (a party's night on a 12-hour
  face, a range as a dial of days), or banked as a pattern in the Library; r2's drawing is `night.tsx` at `ff78ca3b`.
- **Board ideas:** a design-system line by the glass material: an ancestor holding a filling opacity or transform
  animation (`both`, `forwards`) is a backdrop root, so every `glass` inside it blurs nothing (this board's dock did;
  fixed by animating the glass itself with `backwards`); production's reveals are transitions and are unaffected.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. If he picks colours, its wiring would
  propose a photo colour read at upload and carried with the album (a `media` column, a manifest field).
- **Calls his to overrule:** the strip laid by the album's order, not the clock (`strip-axis`); glass docking as the
  capsule itself (`glass-dock`); the two recommendations (strip, glass); the Ground knob opening in the room; faces
  and the newest under the name at a desk and the cover's whole width in a hand.
- **Look at first:** the desk's two steps (`/design/lab/event-header?session=event-header.facts`, then `.doors`), and
  the sheets in `../partyreel-wt/_scratch/event-header-r3/final-sheet-*.png` (each facts option on its six albums at
  1440 in the room and 375 on paper; each door at 1440 on paper and 375 in the room, Try it and stuck).
