---
track: host-dashboard-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ad70c894"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - docs/systems/dashboard.md
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - src/lib/db/queries/dashboard.ts
---

# lp/host-dashboard-r2

**Goal.** The host dashboard, round two, on the page as it now ships: the events collection made customizable at forty (his Frankenstein of covers, seasons and a list), and which event the stage features when none is dated or near, or several are.

## The brief

**Why.** Will answered `host-dashboard` r1 on 2026-10-02 (`docs/reviews/host-dashboard.json`): `purpose=stage`, `needs=week`, `events=seasons`, `arrivals=live`, and `dashboard-wiring` built all four (merged; `docs/systems/dashboard.md` is the page as built, and it is production now: draw on it, never on round one's sandbox). His two open notes are this round:
- on `events=seasons`: "This feels like something a host may have custom preferences on (such as filter, sort, gallery vs table/list, etc). Ideally it's a bit customizable, so in a layout with 40 events as you presented, the host isn't always having to scroll to the very bottom if they're trying to bounce between old events back-to-back (like saving old photos from old events). That's where this stacked organization becomes more cumbersome, where it actually impedes quicker access sometimes. Likely worth a second round of ideas. Best selection is likely some Frankenstein across all three, but if that fails, we can always revert back to an option here."
- on `purpose=stage`: "We'll have to decide which one gets featured in different cases, such as no dates on multiple events."

**What the wiring found** (its Questions, now built as the working version): Create asks no date (the date is Settings' welcome), so "no dates on multiple events" is every new host's case, not an edge. An event's day is its host's date, else the day its newest photographs landed; the stage leads with the one on its day (a dated party first, then an undated album landing today; of two, the busier), else the nearest within 30 days, else the next coming, else the latest activity, else the newest made. An undated album is "Live today" on a day its photographs land and is grouped by when they last landed. Its board idea: a host's own "feature this one" pin.

**Round two's asks** (yours to shape, each a decision drawn whole at 1 event and at 40, 1440 and 375, on the live page):
- `events`: the collection at forty, customizable: how a host bounces between old events back to back without scrolling to the foot (his Frankenstein of covers, groups by when and a sortable list: views, sort, filters, recents or pins, search), and what the page remembers of her choice.
- `lead`: which event the stage features when none is dated or near, when several are, and whether the host can choose (her pin), drawn against the working rule as built.

**Who asks what this round:** identity owns the atoms (draw in production's); `event-header` r2 owns the hub's head (its facts, with the "night on a dial" he banked, and how rooms open); `the-wait` owns the waiting experience of a delayed album; a `take-home` board owns how photographs leave (save, download all). The stage's own layout is answered (`purpose=stage`); redraw it only where an option's idea needs it.

**The direction** (Will's notes, 2026-10-02): bespoke and experiential, sleek and modern, sophisticated (never tilted or playful-messy), minimal yet high-information with far less text, media as the colour. Who it is for, his words: "remaining a modern consumer app usable for anyone at any event ... would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests." And: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." His role: "I'm just the tastemaker ... drive your best ideas ... as the world's leading design engineer." Draw your boldest real answers; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
