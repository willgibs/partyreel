---
track: crumbs-58
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ac73941e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/utils.ts
  - src/lib/dashboard/when
  - src/app/(guest)/u/[slug]/party-cards
  - docs/systems/dashboard.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-58

**Goal.** Date ranges read compact everywhere, "October 2–4, 2026" (Will's pick, 2026-10-03: "let's go 'X-Y', it presents cleaner than 'X to Y'. Less space, more compact."), in production's one formatter and the dashboard's range words.

## The brief

**Why.** event-dates (merged at `6f700751`) says a range with "to": `formatEventDate` in `src/lib/utils.ts` ("October 2 to 4, 2026") and the dashboard's own range words in `src/lib/dashboard/when.ts` ("Tue to Thu", "Sep 25 to 27", "Friday, October 2 to Sunday, October 4"). Will overruled it: "let's go 'X-Y', it presents cleaner than 'X to Y'. Less space, more compact."

**Build:** every range in production says it with an en dash, by the typographer's rule: closed up between single terms ("October 2–4, 2026", "Tue–Thu", "Sep 25–27") and spaced when either side holds a space ("September 30 – October 2, 2026", "Friday, October 2 – Sunday, October 4"). The one-day spelling is unchanged, and so is every other word ("Day 2 of 3", "Live today"). It happens in the formatters themselves, so every reader (the heads, the door, See it as a guest, Settings' sentence, `/u/` cards, the dashboard's week, stage and tiles) follows with no edit of its own: find each by `formatEventDate` and `when.ts`'s callers and confirm by capture, never by a guess. Tests are reshaped on purpose, each keeping its real scar. `dashboard.md`'s range lines are refined in place.

If a screen reader reads the dash as a pause or a glyph where "to" carried the meaning, say so in your Handoff with what you measured, and propose the smallest fix as a Question rather than building it.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; captures at 375 of a range at the door, in the hub head, in Settings' sentence and on the dashboard's stage and week (fixtures through production's composition, as event-dates did).

## Questions (a recommended answer each; the Orchestrator relays them)

- **Say "to" aloud where the dash loses it?** (The brief asked for what I measured.) The macOS system voice (Samantha, through
  `say`: the engine VoiceOver speaks with; VoiceOver itself and iOS were not driven, a system setting) reads a closed range
  between day numbers nearest to "to" (the spectral distance of "Oct 2–4" is 0.31 from "Oct 2 to 4", 0.73 from "Oct 2 dash
  4" and 1.11 from "Oct 2 4"), but a SPACED dash ("September 30 – October 2", "Oct 30 – Nov 2", the stage's "Friday, October 2 – Sunday, October 4") is voiced as
  nothing (its audio is byte-identical to the same words with no dash, for all three), and "Fri–Sun" gets no "to". NVDA files the en dash
  under "most" punctuation and starts at "some", so by default it skips it too. So the cross-month and cross-year ranges, the
  stage's line and the weekday ranges lose the word "to" carried, for those readers; the commonest range, a weekend inside
  one month ("October 2–4"), keeps something like it on Apple's voice. Recommended and built: nothing, as picked (the web's ranges are en
  dashes, and the same-month one is read "to"). The smallest fix if he wants it said: `spokenEventDate(date, end)` beside
  `formatEventDate` (the same words with "to") and, where a surface prints the glyph, the visible text `aria-hidden` over a
  visually hidden twin: the door's byline, the album head and the hub head are one small shared component; the dashboard's
  tile, row and stage and Settings' sentence hold the string in a view model, so their twin is a field on it (about six
  readers). Evidence: `../partyreel-wt/_scratch/crumbs-58/say/measure-log.txt` (NVDA's own `symbols.dic` and config, the
  voice's distances); the code's note is in `dashRange`'s comment.
- **Settings' two date fields are still joined by "to"** (`event-page.tsx`, `aria-hidden`, between the first-day and
  last-day inputs). Recommended and built: unchanged. It is the connective between two boxes, not a range said (the sentence
  above it, "Maya & Jay's Wedding, October 2–4, 2026", is), and a dash between two native date fields would read as a minus;
  the file is not in my `owns` either. Overrule: "–" there too (one character).
- **A long range can wrap a day away from its month at 375** (`captures/hub-cross-year-375.png`: "December 30, 2026 –
  January" over "2, 2027"; the door's "September 30 – October" over "2, 2026"). It wrapped there under "to" as well, which was
  longer; the closed-up ranges (the common ones) never wrapped in any capture, and the dash trailed the line where a spaced
  one broke at it. Recommended and built: nothing. If he wants the pieces kept whole: the formatters join a month to its day
  with a no-break space and the dash to the word before it (`formatEventDate` and `when.ts` only), which changes the bytes
  of every range (the tests would name U+00A0) and nothing on screen but the wrap.

## System-doc edits (in place, owned facts only)

- `docs/systems/dashboard.md`, two passages refined in place, by their opening words: "**The stage** leads with `momentEvent`"
  (its line under the name says the whole range: "Friday, October 2 – Sunday, October 4") and "**A tile** is its photograph,
  or its date" (a range's when: "Fri–Sun", "Oct 3–5", "Oct 30 – Nov 2"; the old "to, never a dash" gone; the rule is
  `dashRange`'s, in `lib/utils.ts`, shared with `formatEventDate`).
- For the Orchestrator, in docs this lane does not own: none (`guest-flow.md` and `design-system.md` say no range word).

## Deferred (ROADMAP one-liners, bucket named)

- The lab: host-dashboard's `model.ts` (`rangeWhen`, `rangeLabel`, `rangeLine`, `rangeDays`) and event-header's `whenOf` draw a range their own way (spaced en dashes, "to"); production's words are `dashRange`'s now, so a refresh draws `whenOf` with the end, `longDays` and `formatEventDate` themselves (from `crumbs-58`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-58`:** the work `f0794eba` (the rule, the two formatters, the tests, `dashboard.md`); the sync
  `c7dc8d98` (launch-prep at `4044bfbc`: crumbs-57's merge `66b656ff` and records, no conflict; launch-prep has not moved
  since); `63a6a0af` (a test comment). The head is in the chat line.
- **Gates on the synced tree, sha `63a6a0af`, each on its own exit code** (logs `../partyreel-wt/_scratch/crumbs-58/logs/gate-*.log`):
  typecheck 0; lint 0 (0 warnings); test 0 (851 files, 10,102 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3133` 0 (160 checks, 0 failing; its PREMISE line says host-dashboard's three open
  asks describe `src/lib/dashboard/` and `dashboard.md`, which this change touched: see the Deferred line). Port 3133 freed; no
  Chrome of mine left running. The first full run, before the sync, is `logs/test-1.log` (849 files, 10,066 tests, 0).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths (`src/lib/utils.ts`,
  `src/lib/dashboard/when.ts` and `when.test.ts`, `src/app/(guest)/u/[slug]/party-cards.test.ts`, `docs/systems/dashboard.md`),
  this file, and these exceptions, each a line the change forces:
  - tests that asserted the old words, reshaped on purpose with their scars kept: `src/lib/events/event-dates.test.ts` (the
    formatter's own range tests: the German runtime and every zone still print one range; the new `dashRange` and glyph
    tests), `src/lib/events/readiness.test.ts` (the welcome's line), `src/lib/dashboard/stage.test.ts` (the stage's date
    line), `src/lib/dashboard/home-view.test.ts` (the week's and the bin's words).
  - one example string each in three comments: `src/lib/dashboard/stage.ts`, `home-view.ts`, `events-view.ts`.
- **The items:**
  - ★ `dashRange(from, to)` in `src/lib/utils.ts`, the rule's one home: the en dash (U+2013), closed up between two single
    terms and spaced where either side holds a space, on plain spaces (never `Intl`'s `formatRange`: Node 22.21 / ICU 77.1
    prints it on thin spaces, U+2009, measured, and MDN's `formatRange` examples print the dash spaced from locale data,
    doc-checked); its comment holds the screen-reader finding.
  - `formatEventDate` says "October 2–4, 2026", "September 30 – October 2, 2026", "December 30, 2026 – January 2, 2027";
    one day unchanged. `when.ts`'s `rangeWhen` and `longDays` say "Fri–Sun", "Oct 3–5", "Oct 30 – Nov 2", "Mar 30 – Apr 2,
    2027", "Dec 30, 2027 – Jan 2, 2028", "Friday, October 2 – Sunday, October 4"; "Day 2 of 3" and every other word unchanged.
  - Every reader follows with no edit of its own, found by `formatEventDate`'s and `when.ts`'s callers (the greps in the
    lane's first hour) and confirmed on screen: the door's byline, the hub head, the guest album head (the same head See it
    as a guest draws), Settings' sentence, the `/u/` cards, the dashboard's stage line and week and tiles and rows view. The
    other `formatEventDate` callers pass no end (the claims card, the As a guest cards, Yours and likes, passkeys, the blog
    and help dates) and print as they did.
  - Tests: `when.test.ts` reshaped, with a new rung (a range to come that turns a year beyond the month, both spacings) and a
    glyph guard (every rung's output has one U+2013 and no "to"); `event-dates.test.ts`'s formatter tests reshaped, the
    glyph-and-plain-spaces guard (the `formatRange` scar) and `dashRange`'s two rule tests added; `party-cards.test.ts` pins
    what a `/u/` card's date line is made of ("October 3–5, 2026", "September 30 – October 2, 2026", one day as ever).
    Red first: 13 failing for the right reasons against the old formatters, then green.
- **Captures at 375** (`../partyreel-wt/_scratch/crumbs-58/captures/`, a headless Chrome of mine on dev port 3133, fixtures
  through production's own components in a scratch route that was never committed and is deleted; `git status` clean): the
  door `door-{same-month,cross-month,cross-year}-375.png`, the hub head `hub-*-375.png`, the guest album head `album-*-375.png`,
  Settings' rows and its sentence `settings-*-375.png`, the dashboard's stage and week `dashboard-live-375.png` (and
  `-top`; the stage "Live today" over "Thursday, October 1 – Saturday, October 3", the week's "Day 1 of 3", "Mon–Wed",
  "Oct 5 – Nov 2") and `dashboard-before-375.png`, its rows view `dashboard-rows-375.png`, the `/u/` cards `cards-375.png`.
  Each line's real breaks were read off the page (every text node holding a dash, split into the lines the browser drew): no
  line opened on a dash and no closed range split after its dash; a spaced dash trails the line it breaks at.
- Assets requested from Will: none.
- **Board ideas:**
  - The lab's own range words, in the Deferred line: host-dashboard says "Sat – Sun", "Nov 14 – 15" and "Saturday,
    November 14 to Sunday, November 15"; production says "Sat–Sun", "Nov 14–15" and "Saturday, November 14 – Sunday,
    November 15".
  - Help and blog copy say "Events have no end date" (nothing expires) where Settings now offers "Add an end date" (a
    range's last day, with "events never expire" under it): the two meanings meet in one word, and a label such as "Last day"
    would part them.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the rule as briefed (the cross-month tile and the stage line spaced, the same-month and weekday
  ranges closed, a year said once after a spaced range); plain spaces, never thin or no-break; Settings' "to" between its two
  date fields left; no spoken twin for the readers that lose the word; no no-break spaces against the wrap (the three
  Questions above).
- **Look at first:** `captures/dashboard-live-375-top.png` (stage and week), `captures/hub-cross-year-375.png` (the wrap),
  `captures/cards-375.png`; `dashRange` and its comment in `src/lib/utils.ts`; `say/measure-log.txt`.

## Where I am

- Handed off on `lp/crumbs-58`; nothing in flight.
