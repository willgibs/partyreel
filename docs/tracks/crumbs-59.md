---
track: crumbs-59
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "979b30a7"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/event-page
  - src/lib/events/dates
  - src/lib/validation/event
  - src/components/app/event-feed/reel-card
  - supabase/migrations/20261003200000_
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/dashboard.md
  - docs/systems/database-security.md
  - docs/systems/disposable-mode.md
---

# lp/crumbs-59

**Goal.** Red-team 47's MEDIUM and its NITs: Settings' date field saves a date once she has finished it, never on each keystroke, so typing a year can never store a range a millennium long; the date's refusals speak a host's words; a range's end is finite by the database's own rule; the hub's reel card respects the cover; the hub's rooms stop warning.

## The brief

**Why.** Red-team 47 on build 47 (`e5be373c`; its ledger `../partyreel-wt/_scratch/redteam-47/ledger.txt`, grep it) passed every walk but this.

1. **MEDIUM: Settings' date field saves every keystroke** (`event-page.tsx`'s `EventDatesField`, with `endForNewStart` in `src/lib/events/dates.ts`). Chrome's date input fires a complete date on each keystroke, and each one is saved, the end shifted after it:
   - typing the year 2027 into the start of an October 2–4 range stored **2027-10-02 → 3851-10-05** after four saves (years 0002, 0020 and 0202 on the way);
   - typing the day "12" gave October 12–15 instead of 12–14;
   - typing the end day "20" collapsed the range at the "2" and the field closed under her fingers.

   A date saves once she has finished it: on leaving the field, Enter or a picker's choice, never mid-typing. A year outside a sane window never saves. The end follows the start by the range's length as it was last saved, never an intermediate keystroke. Red first: tests that type a year, a day and an end day keystroke by keystroke and find today's code saving the wrong ranges.
2. **NIT:** a malformed date is refused with zod's stock "Invalid ISO date" (`src/lib/validation/event.ts`). Say it in a host's words.
3. **NIT:** clearing the date alone over a stored end says "The end date can't be before the event date." A cleared date takes its end with it, or the words say what actually happened.
4. **NIT:** the CHECK `events_end_date_on_or_after` admits `'infinity'` (owner-only, by a raw write; every reader falls back to one day). Validation refuses it, and a migration under your reserved prefix tightens the CHECK to a finite date (the start's too if it admits infinity). The Orchestrator applies it by protocol after the Advisor reads it, so include its rolled-back check, red then green, at its foot.
5. **NIT:** the hub's "Highlight reel / Live at the develop" card (`reel-card.tsx`) shows sealed shots while the album is covered. It wears what the cover shows: what her guests see, until she lifts it.
6. **NIT:** every hub room logs Radix's "Missing `Description`" warning (partyreel.com too, so it predates this round). Find the room panel's component by the warning, give it its description or an explicit `aria-describedby`, and name the file in your Handoff as an accepted exception if it is outside your owns.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for 1 to 5 (logged); a capture of the date field typed keystroke by keystroke at 375 (the saves counted in the network panel: one per finished date); the migration's rolled-back check, red then green.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A moved first day: today's rule, or a pure shift?** Recommended and built: today's rule, unchanged (an end still after the
  new first day stays, "keeps her Sunday"; one it reaches or passes moves with it by the range's length, "a weekend
  rescheduled is still a weekend"), now fed only a finished date and the last SAVED days, which is what makes the ledger's
  walks come out right (2027 gives October 2 to 4, 2027; the day 12 gives 12 to 14). The brief's sentence "the end follows
  the start by the range's length as it was last saved" can also read as a pure shift (the length always kept). Today's rule
  was event-dates' own recommended answer, its Overrule named the pure shift, and nothing on file overrules it. The cost of
  keeping it: moving the first day EARLIER by more than the range's length (a weekend moved up a month) leaves the end where
  it was, a month-long range she then corrects in the end field. To flip it is one line of `endForNewStart`
  (`dates.test.ts` and `event-dates.test.ts` pin it).
- **The window of years a date may name: 1900 to 2100, both in?** Recommended and built (`isSaneDay`, `lib/events/dates.ts`,
  one constant pair; no clock reads it). It refuses what a keystroke passes on the way (0002, 0020, 0202), a stray fifth
  digit and `'infinity'`, and is wide on purpose: a date's job is to say when, so a far-off one is no reason to refuse it.
  A tighter ceiling (2050, say) would also catch 2062 typed for 2026, at the cost of refusing a far date a host really
  means; the field shows the year it saved, so that typo is visible.
- **A picker's choice saves a beat after the last one (350 ms), not the instant it is made.** Recommended and built, for a
  phone's wheel: iOS Safari is reported to fire `input` on every notch a date wheel turns (not verified here: no device),
  which would save each notch, and the end follows each. The beat lets a wheel rest; a calendar's single pick saves 350 ms
  later, which is invisible beside the round trip (the field shows the pick at once). Overrule: `PICK_SETTLE_MS` to 0 where
  the wheel proves quiet.
- **The Reel card follows the develop, not Look.** Recommended and built: while a develop time is ahead the card draws no
  photograph (the live card plain and still saying "Live at the develop"; the counting card without its one photograph),
  and the stills come in the moment the time is reached. The head and its band do the same and stay her guests' while she
  looks, and Look is the gallery's own state, which the card cannot read without a shared store outside this lane. Overrule:
  the card lifts with Look, or wears only the stills her guests can see (the head's filter): either needs the page's
  develop facts (`HubDevelopFacts`) handed to the card through `[eventId]/page.tsx` and `event-cards-row.tsx`.
- **A date cleared alone takes its end with it** (the NIT's first answer, over fixing the CHECK's words). Recommended and
  built in `updateEvent` (one statement): an end never stands alone, Settings already sends the pair, and the only callers
  of the bare clear are a stale page, the build before the range and a crafted call, none of which want a refusal about an
  end they may not be shown. Overrule: refuse it, with words that say a date cannot be cleared under an end.
- **A half-filled date is not a cleared one** (beyond the brief, the same class: an unfinished date). A segment cleared and
  not typed again leaves the field's value empty, which saved as a clear took her date and its end away for a slip; it now
  says "Finish the date, or clear it." and saves nothing. One handler (`finish`), detected by `validity.badInput`; a browser
  that never sets it keeps the old clear. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`, the Settings bullet, by its words "a text field saves when it is left": a date field saves once
  she has finished it, never on its change (Chrome's date input fires a complete date on every keystroke that makes one),
  with the picker's beat, the window, and the half-filled date.
- `docs/systems/disposable-mode.md`, the host's cover passage, by "Her hub's head and its band wear only what her guests can
  see meanwhile": the Reel card draws no photograph while a develop time is ahead, and follows the develop, never Look.
- `docs/systems/database-security.md`, Gotchas: one ★ line, `'infinity'` passes any `>=` CHECK, so a date or timestamp
  column names `isfinite(...)` (the third such column; it is now a recurring one).

## Deferred (ROADMAP one-liners, bucket named)

- Host: the Reel card could wear the head's own filter (only the stills her guests can see while a develop time is ahead) rather
  than none, if the hub page hands `HubDevelopFacts` to `EventCardsRow` and on to `ReelCard` (`reel-card.tsx` draws no still
  meanwhile; from `crumbs-59`).
- Accessibility: Settings' page-level head (This event, the door, what guests can add, the reel) names no description
  (`event-settings-sheet.tsx` says so with `aria-describedby={undefined}`); `PopupHeader` could draw the event's name there as
  a screen-reader-only description, as the rows' head says it (from `crumbs-59`).
- Testing: a real iPhone's date wheel would settle two guesses in `event-page.tsx`: does it report each notch as `input`
  (`PICK_SETTLE_MS`), and does its Clear reach React's `onChange` (facebook/react#12313, closed, from 2018), which `finish`
  could sidestep by reading the field's own value on leaving (from `crumbs-59`).
- Host: Settings' develop time (`camera-settings.tsx`'s `DevelopTimeControl`) saves on leaving the field, like the date now
  does, but accepts any time in the past, which the database stores as now (`events_reveal_stamp`) and whose save opens every
  sealed row (`events_develops_rewrite`): Develop now with no question asked, so a year left half typed (0002, 0202) and left
  would develop the album. A window like the date's, or the Develop now question for a past time, closes it (from `crumbs-59`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-59`:** the work `0855cbd8` (items 1 to 6, the migration, the three doc lines) and `057c56a4`
  (every hub room's panel held to its description at a desk and in a hand, the wheel comment, the develop-time finding), the
  doc wording `a8d56028`, and the sync `a5e95853` (a merge of `origin/launch-prep` at `c0cfaf53`: album-calm's live album and
  cost-atlas's pricing docs landed after the cut; album-calm changed `host-album.tsx`, which `reel-card.tsx` imports, and no
  file overlaps this lane's changes, so the merge was clean), then one docs-only commit after the gates (`host-app.md`'s gotcha
  without the incident's numbers); this file's own commit is the handoff, the head in the chat line.
- **Gates on the synced tree `a5e95853`, each on its own exit code** (`../partyreel-wt/_scratch/crumbs-59/logs/gate-sync.summary`,
  and `gate-sync-{typecheck,lint,test,build}.log`): typecheck 0; lint 0 (0 warnings); test 0 (857 files, 10,189 tests);
  `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (158 checks, 0 failing; `logs/lab-smoke-sync.log`;
  scope: the seven boards that import a touched file, the Library and the shell; its PREMISE lines say create-wizard's
  `add`, event-header's `facts` and `doors` and the-wait's `arrival` open asks describe the docs and `reel-card.tsx` this lane
  touched: re-read them before his next sitting). Before the sync the same gate was green on `057c56a4` (854 files, 10,139
  tests; `gate-final.summary`; lab:smoke 160 checks, `logs/lab-smoke.log`). Port 3131 freed, no Chrome of mine left running.
- **Red first, logged** (`logs/red-1.log`, today's code, 29 reds over six files): the year typed keystroke by keystroke made
  four saves, `0002-10-02`, `0020-10-02`, `0202-10-02`, then `2027-10-02 -> 3851-10-05` (the ledger's own); the day typed as
  12 made two, `2026-10-01` then `12 -> 15`; an end day typed as 20 closed the range at the 2; the date's words, the cleared
  date's patch, the reel card's stills and Settings' page head each red in their own test. All green on the work.
- **The 375 capture** (Chrome 154, my own headless one, real key events by CDP, over the real Settings page and a write that
  POSTs so the network counts the saves; `captures/capture-log.json` and 18 PNGs, `capture-dates.mjs`): the ledger's walk types
  2027 into the year of October 2 to 4, four keystrokes and 0 saves, even past the beat, then one POST on leaving,
  `{"event_date":"2027-10-02","event_end_date":"2027-10-04"}`; the day 12 one POST `12 to 14`; the end day 20 stays open at the
  2 and saves once on Return with the focus kept; a year left at 0202 sends nothing and says "Pick a year from 1900 to 2100."
  under the field; a segment cleared and left sends nothing and says "Finish the date, or clear it."; a whole clear is one
  POST; ArrowUp twice is one POST; a pick no key made saves once a beat after it, and a wheel's three notches once.
  `captures/10-reel-card-develop-ahead-vs-none.png` is the Reel card on a develop time ahead (plain) beside one with none.
- **The migration** (`supabase/migrations/20261003200000_event_dates_finite.sql`, unapplied, the Orchestrator's by protocol
  after the Advisor reads it): the range's CHECK re-said in its own name with `isfinite(event_end_date)`, and
  `events_event_date_finite` beside it. Its rolled-back check (at its foot; logs `logs/migration-red.txt`,
  `logs/migration-green.txt`, one `execute_sql` of `begin; ... rollback;` each on the live schema): RED on today's schema, steps
  1 and 3 fail (the old definition; the owner's raw infinity accepted in the end, both days, the first day, `-infinity`, and
  an insert of either, the row left at `-infinity`), steps 0 and 2 green; GREEN with the file, 4 of 4, the ADDs validating all
  119 live rows. Rolled back clean both times (0 fixture rows, 119 events, the old constraint alone). Drift read: the live
  CHECK is the repo's, no other CHECK on events names either date, 0 non-finite days. Advisors: expected delta none.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, this file, and these exceptions:
  - `src/components/app/event-settings/event-settings-sheet.tsx`: item 6's accepted exception (the brief's own), one
    conditional prop on `PopupContent`, so a Settings panel opened at a page says it has no description.
  - `src/lib/db/mutations/events.ts` and `events.test.ts`: item 3, where the patch is built: one statement, a cleared date
    writes its end null too, and a test (and the whole-form save test names the derived key).
  - `docs/systems/host-app.md`, `disposable-mode.md`, `database-security.md`: one refined passage each (this file's System-doc
    edits).
- **The items:**
  1. MEDIUM: `EventDatesField` (`event-page.tsx`) saves a date once she has finished it (leaving, Return, the panel closing, or
     a picker's choice a beat after the last), never a keystroke; a year outside 1900 to 2100 (`isSaneDay`, `dates.ts`) and a
     half-filled date never save, said in words under the field; `dates.ts` also counts a year under 100 as the year it says
     (`Date.UTC` read 0002 as 1902).
  2. NIT: a malformed date speaks `DATE_UNREADABLE` and a year outside the window `DATE_OUT_OF_RANGE`, never zod's stock lines
     (`validation/event.ts`; `event.dates.test.ts`).
  3. NIT: a cleared date takes its end with it (`updateEvent`), so it never meets the CHECK's words.
  4. NIT: validation refused `'infinity'` already (`z.iso.date`; pinned now, with the words); the migration makes the database
     say it too.
  5. NIT: the hub's Reel card draws no photograph while a develop time is ahead (`ReelCard`), the stills coming in at the
     develop.
  6. NIT: Settings' page-level head names no description (`event-settings-sheet.tsx`); Review and Guests (`RoomPanel`) never
     warned, and `event-page.room.test.tsx` holds every hub room to it at a desk and in a hand.
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** the one migration above; no Worker, Vercel, Stripe or env.
- **Not driven live:** the alias runs launch-prep, which carries none of this until it merges, so item 1's live walk (red-team
  47's W1: the year 2027 typed into the October 2 to 4 range, the day 12, the end day 20) is the Orchestrator's on the alias
  build; this lane's evidence is the real component in a real Chrome over a counting write.
- **Calls his to overrule:** the Questions above, each built as its recommended answer: today's moved-first-day rule kept (not
  a pure shift); the window 1900 to 2100; a picker's choice a beat after the last (350 ms); the Reel card following the
  develop, not Look; a cleared date taking its end with it; a half-filled date never saved as a clear.
- **Found beyond the lane (the last of the manifest's Deferred lines):** Settings' develop time saves any past time, which the
  database stores as now and whose save opens every sealed row, so a year left half typed would develop the album.
- **Look at first:** `EventDatesField`'s header and the "a date saves once she has finished it" tests, then the migration's
  apply protocol with its two logs.
