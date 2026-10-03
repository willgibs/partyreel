---
track: crumbs-59
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

## Where I am

WIP 1 (items 1 to 6 built, each green in its own files; the whole gate and the 375 capture still to run):
- Red first, logged: `../partyreel-wt/_scratch/crumbs-59/logs/red-1.log` (29 reds over six files). The year typed keystroke by
  keystroke saved `0002-10-02`, `0020-10-02`, `0202-10-02`, then `2027-10-02 -> 3851-10-05` (the ledger's own four); the day
  typed as 12 saved 10-01 then 12 to 15.
- Built: `EventDatesField` (a date saves once finished: blur, Return, close, or a picker's beat), `isSaneDay` (1900 to 2100)
  and the `Date.UTC` year-under-100 fix in `dates.ts`, the date's words in `validation/event.ts`, a cleared date taking its end
  (`mutations/events.ts`), the reel card's cover (`reel-card.tsx`), Settings' page head (`event-settings-sheet.tsx`), and the
  migration `20261003200000_event_dates_finite.sql` (red then green on the live schema, unapplied: `logs/migration-red.txt`,
  `logs/migration-green.txt`).
- To do: the whole gate on the synced tree, the keystroke capture at 375 (a scratch route over a counting write, Chrome's real
  key events), the docs and the Handoff.

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
- Testing: a real iPhone's date wheel (does it report each notch as `input`?) would settle `PICK_SETTLE_MS` in
  `event-page.tsx` (from `crumbs-59`).

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
