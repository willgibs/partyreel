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
