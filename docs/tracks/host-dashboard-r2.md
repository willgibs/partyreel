---
track: host-dashboard-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ec9f8c3f"            # the launch-prep SHA the branch was cut from
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

- **The stage's question is two decisions, not one.** His note asks which event is featured "in different cases";
  the brief adds whether she can choose. Drawn as `lead` (what the stage leads with on a quiet day: as built, the
  newest event, where she left off, or the stage rests from nine events) and `pick` (the rule alone, a pick she keeps,
  a step through its contenders), each worn by the other's frames. Recommended: `lead=made`, `pick=kept`. His to
  overrule by answering one wide.
- **The board's day is Tuesday 10 November 2026, a quiet day with no party on its own day.** A stage on its day
  hears its album's doorbell (a Realtime socket) and polls `readStageLiveAction`, which a frame must never reach; and
  "several on one night" is settled (`busier`, r1's carried call, with the other first in This week), so it is not
  redrawn. Recommended: keep; a live night returns when the wiring's red-team walks it.
- **Where the page keeps what it remembers of her** (the carried `kept`). Built (drawn): her account, so her phone opens
  as her laptop left it; the wiring of `recent`, `display` or `pick=kept` writes one column on `profiles` (her opens
  and pins, or her display), a migration the Orchestrator applies. Overrule: this device's cookie, as the view toggle
  is kept today (no migration). Not a one-way door: either moves to the other later.
- **Back brings her to the page as she left it, in every new option** (the carried `back`). As built the page draws
  fresh after Back (no `cacheComponents`), so a year she opened is folded again; Next keeps her scroll. Each new option
  is drawn kept (her scroll and an open year), which the wiring builds by keeping the collection's state outside the
  page (a `sessionStorage` key or the URL) or by `cacheComponents` (a platform change, not this lane's).
- **The new pieces show from nine events, with the search** (the carried `nine`): the Recent row, the Display menu,
  the list for the past and the resting stage. Under nine the page is as built, so Maya's one event and Nia's three
  draw unchanged. Overrule: from her first event.

## System-doc edits (in place, owned facts only)

- none: a lab round ships no production byte, so `docs/systems/dashboard.md` is unchanged.

## Deferred (ROADMAP one-liners, bucket named)

- Lab: Radix in a portalled `Frame` reads the lab's window and document, not the frame's: a popper's wrapper takes
  `z-index: auto` (so a menu mounted open paints under the page beside it) and a Dialog's Title check warns falsely in
  the console; `Frame` could lift `[data-radix-popper-content-wrapper]` itself (the host-dashboard board repairs its
  own frames, `shell.tsx`) (from `host-dashboard-r2`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/host-dashboard-r2`: `746509e9` (the board, round two) and `592e13be` (the step option's
  still takes one step). No sync: `launch-prep` moved to `9f4a7d90` (identity-r2's and header-wiring's merges and
  records), none of it into this lane's reads, and the lane touches no shared path, so the merge cannot conflict.
- **Gates on `592e13be`**, each on its own exit code, logs in `../partyreel-wt/_scratch/host-dashboard-r2/`:
  `pnpm typecheck` 0 (`final-typecheck.log`); `pnpm lint` 0 (`final-lint.log`); `pnpm test` 0, 755 files and 8,970
  tests (`final-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`final-build.log`); `pnpm lab:smoke --base
  http://localhost:3132` 0, 21 checks, the board's reading 698 of 1,200 words (`final-smoke.log`); `pnpm lab:demo
  --board host-dashboard --base http://localhost:3132` 0, 3 steps (`final-demo.log`), and with `--width 375 --state
  screen=375` 0, 3 steps (`final-demo-375.log`).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/host-dashboard/`
  and this file; no exceptions.
- **The items**:
  - `events`, "How should forty events work, so she can bounce between old ones without scrolling to the foot?":
    Grouped by when, as built (`today`); Recent on top (recommended: the events she opened lately ride one row over
    the groups, and a year she opened stays open); Shown her way (a Display menu: covers or a list, by when, by year
    or not at all, in her order); Covers near, a list for the past (the past one sortable list, its years as tabs).
    Three frames each at 1440 and 375: Try it on Jo's forty, Jo back from Theo & Ana's (played by the page itself:
    the year opened, the wedding pressed, Your events), Maya with her one event.
  - `lead`, "On a quiet day ... what should the stage lead with?": the next party, else the latest photos (as built);
    the newest event (recommended); where she left off; the stage rests (from nine events, one line). Frames: Nia's
    three undated events, and Try it on Jo's forty.
  - `pick`, "Should a host be able to choose which event leads the stage herself?": the rule alone (as built); hers,
    until she lifts it (recommended: Change in the stage's corner); step through, nothing kept. Frames: Nia with the
    control in use, and Try it on Jo's forty (she has featured Ines & Tom's October wedding).
  - Three carried calls on the board (`kept`, `back`, `nine`), the Questions above.
  - Every frame is production's page: `model.ts` composes it with `buildHomeView`, and moves the stage to another
    event by a decoy production's own moment always leads with; `model.test.ts` (11 tests) holds the board's page to
    production's to the byte around production's own lead, and pins each rule to the frames' words.
  - Nothing reaches a Server Function or the network: the frames' router is the board's (a code card's Everything
    opens the event's stand-in, the lab's URL unmoved), production's view toggle and Restore are caught before their
    Server Functions (the dev log holds no POST through every probe and both `lab:demo` runs), no party is on its day
    (no live stage, no Realtime socket), and the account menu and the storage ring are drawn `inert`.
- **Assets requested from Will**: none (the twelve bootstrap stills, each cover a crop named in its URL's fragment).
- **Board ideas**:
  - Lab: `Frame` lifting Radix's popper wrapper and quieting its Dialog check (the Deferred line).
  - Host: on a phone at forty, a quiet day's stage fills the first screen and the events begin under it; `lead=rest`
    answers it for planners, and the stage's height on a quiet day is a question of its own.
  - Host: `EventsSection` writes the view's cookie through a Server Function inline; an `onView` seam would let a
    board or a test draw it whole without catching the press.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none from this lane (lab only). If the carried
  `kept` stands, the wiring of `recent`, `display` or `pick=kept` adds one `profiles` column by the protocol.
- **Calls his to overrule**: the five Questions above, each built as its recommended answer.
- **Look at first**: the events step's second frame, "Jo, back from Theo & Ana's", option by option: as built, her
  year folds again into nineteen nameless thumbnails at the foot; every new option brings her back where she was.
  Then the lead step's Nia frame: as built leads with her old engagement album while the wedding she made last night
  waits under Coming up.
