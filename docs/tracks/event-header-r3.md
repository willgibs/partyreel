---
track: event-header-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
