---
track: host-dashboard-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "499612e4"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - docs/systems/dashboard.md
---

# lp/host-dashboard-r3

**Goal.** host-dashboard round 3: events for a host of 1 to 10 that scale to hundreds (a collapsible Recent row over one gallery/table/list with deep sort, filter and display), the featured stage beautiful for an event with no photos yet, and the feature's rule as a choice rather than a picker.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's answers (host-dashboard r2, his desk on build 45, 2026-10-03), in full:**
- events=recent: "All of these still feel like they're over-organizing the experience in one way or another. At least for launch, we should design for users with 1 to maybe 10 events in mind as the primary expectation, but ensure it scales up to dozens or hundreds of events if needed for power users. I'm thinking we have a recent row as collapsible (keeps last few quickly accessible), then simply a gallery/table/list with deep sort/filter/display customization for how hosts prefer to organize the rest of their events. Another exploration please."
- lead=made: "We should ensure featured events with no uploaded media yet still look beautiful as featured in the dashboard. Worth a dedicated exploration. I think it makes sense to default to the newest event here, generally expecting a host to continue preparing it."
- pick=kept: "Very nice, because I doubt every host will want their newest always as the featured year. Rather than directly selecting an event, these could be more like sort options, such as: newest, last opened, upcoming, etc. This helps it continue to be a reliable featured, but for accounts with 100 events, doesn't result in a mega dropdown to choose. More algorithmic, repeatable solution."
- Settled the same night, and wired later this round by `event-dates`: an optional end date (a range of days, no times), and lead=made (the newest event leads the stage on a quiet day). Draw both as settled with your own fixtures.

**The asks:**
1. **`events`:** the collapsible Recent row over one gallery, table or list with deep sort, filter and display customization. Draw it at 1, 3, 10, 40 and 200 events, so the 1-to-10 host is the design and the 200-event host still reaches an old party in a press or two.
2. **`stage`:** the featured stage for an event with no photos yet, made beautiful: the code, readiness, the event's own colour or look, a delight that costs nothing in clarity. Show it both just made and the week before.
3. **`rule`:** the feature's rule as a choice among newest, last opened, upcoming and any you find, kept where a host sets preferences, never a list of her events.

Drawings at 1440 and 375, paper and room. Recommend one each. Retire r2's answered asks into the board's settled lines.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board host-dashboard --base http://localhost:3135` at 1440 and with `--width 375`, pressing every step; `registry.test.ts` and `queue.test.ts`.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and drawn on the board as a carried call, his to overrule there; none is a one-way door.

- `kept`: where are a host's choices kept (her layout, order and filters, her views, the stage's rule, Recent folded)?
  Recommended: on her account, so her phone opens the way her laptop left it (a profiles column, the Orchestrator's
  migration in the wiring round). Overrule: per device, in a cookie, as the view toggle is kept today.
- `default`: how do her events open before she shapes them? Recommended: covers, the newest first, nothing grouped
  or filtered (his "over-organizing"). Overrule: grouped by when, as it ships.
- `recent`: from how many events does Recent show, and what does it hold? Recommended: from seven, the last four she
  opened, never the stage's or this week's (below seven every event fits her first screen). Overrule: from her second.
- `newest`: what does the default rule do when a party is near? Recommended: Newest keeps a party within a month
  first, exactly as `lead=made` settled for a quiet day (and as `event-dates` wires it); Upcoming, Last opened and
  Latest photos say exactly what they name, a party on its own day leading under all four. Overrule: Newest is the
  newest made, always.
- `light`: where does an empty event's colour come from? Recommended: one of the house's five lamps, picked by its id
  and never changing, only ever as light in a gradient (bible 6); its photographs take over. Overrule: her pick of
  the five, in Settings.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; `dashboard.md` describes production)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work: `93009429` (the board redrawn), `8c0d1b46` (every option pressed at 1440 and 375, the first look's fixes),
  `e1e54dc9` (her events start under the app's bar; the rail's words wrap at a phone), `9b981820` (Newest's line
  fits its menu), pushed on `lp/host-dashboard-r3`, cut from `9d3bf168`. No sync: launch-prep moved (wait-wiring
  `c02893c1`, take-home-wiring `f8f23300`, types `e0cbda7d`) but nothing under my reads nor any module the board
  imports changed, and `git merge-tree --write-tree HEAD origin/launch-prep` exits 0.
- Gates on `9b981820`, each its own exit code, logs in `../partyreel-wt/_scratch/host-dashboard-r3/`: `pnpm
  typecheck` 0 (`typecheck2.log`); `pnpm lint` 0 (`lint2.log`); `pnpm test` 0, 825 files and 9,740 tests
  (`test2.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`); `pnpm lab:smoke --base
  http://localhost:3135` 21 checks, 0 failing, the board's reading 788 of 1,200 words (`smoke2.log`); `pnpm lab:demo
  --board host-dashboard --base http://localhost:3135` 3 steps, 0 failing (`demo2-1440.log`), and with `--width 375
  --state screen=375` 3 steps, 0 failing (`demo2-375.log`). `registry.test.ts`, `queue.test.ts` and the board's
  `model.test.ts` (14) are in the test run.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/host-dashboard/`
  (board, collection, dashboard, empty-stage, fixtures, model, model.test, prefs, scene, shell, spec, stage-slot)
  and this file; no exceptions.
- `spec.ts`: round 3, three open asks with their context layer: `events` (four ways to shape one collection under
  Recent; `menu` recommended), `stage` (four ways to draw an event with no photos; `lit` recommended), `rule` (four
  places to choose the stage's rule; `corner` recommended); r2's answered asks retired into `opening.settled`, his r2
  notes quoted in `opening.earlier`, `history` r2 and r1, five carried calls (the Questions above).
- `fixtures.ts`: six hosts on the quiet Tuesday: Maya 1, Nia 3 (her wedding made last night), Nia a week on (the
  wedding dated Saturday to Sunday, door set, code opened 12 times), Ari 10, Jo 40, Rae 200 (a seeded generator,
  every name unique); ranges drawn as settled through `Host.ends`, lead=made through the Newest rule.
- `model.ts`: `leadOf` (the four rules, a party on its own day always leading), a range's words (`rangeWhen`,
  `rangeLabel`, `rangeLine`) laid over production's rows and week, `homeAround` (production's composition around any
  lead), Recent, her prefs (layout, order and direction, lens, when, year, group, cover size), `findIn` (a year and
  the words upcoming, past, waiting, undated as filters), starter views, `lampOf`.
- `collection.tsx`: Recent folds to a line of its covers, each still a press away; gallery (production's tile),
  table (its heads the sorts) and list (production's rows view); the four ways: one Display menu with a line saying
  what is set, a toolbar with chips, views as tabs with Edit view, one field that finds with suggestions.
- `empty-stage.tsx`: lit (the plate in the event's lamp, Settings' five steps laid flat, the light igniting once
  from Create), album (the stage's own frames waiting, the code in the first), card (the name set like an
  invitation, lit from above), guest (her guests' first screen beside the code); every way says production's
  words, ticks and acts, its colour only light.
- `stage-slot.tsx` and `prefs.tsx`: the rule as four sentences, each showing what it would lead with today, in the
  stage's corner, as a row over the stage, in the page head's Customize (with Recent's switch), or in a Settings
  stand-in that the stage's corner opens.
- Captions read off every frame (`scene.tsx`): events on screen of how many and in what layout, Recent open or
  folded, what is set, the old wedding's reach; the stage's event, word, way, lamp and steps; the rule and its lead.
  Verified by hand on :3135 in paper and room: picking Upcoming moves Jo's stage to the Harbour & Co Holiday Party;
  Display, Table, 2025 leaves Ari's three of that year; Recent folds; an event opens and Your events comes back.
- Assets requested from Will: none.
- Board ideas: `event-dates`' wiring can start from this board's range words (`rangeWhen` for a tile, `rangeLabel`
  for a row, `rangeLine` for the stage's date line), drawn and tested here (`model.test.ts`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none for the exploration; if `kept` stands, the
  wiring round's profiles column for her dashboard preferences is the Orchestrator's migration.
- Calls his to overrule: `kept`, `default`, `recent`, `newest`, `light` (the Questions above, drawn on the board).
- Look at first: `events` at 1440 on Rae's two hundred (the Display menu open on 2023, her old wedding on screen),
  then `stage`, lit beside the invitation, just made and the week before.
