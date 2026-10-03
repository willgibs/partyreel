---
track: event-dates
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9af92e54"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/dashboard/
  - src/components/app/dashboard/
  - src/components/app/event-settings/event-page
  - src/lib/events/
  - src/lib/utils.ts
  - src/lib/validation/event
  - src/lib/db/mutations/events
  - src/lib/disposable/reveal
  - supabase/migrations/20261003120000_
  - docs/systems/dashboard.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/disposable-mode.md
  - src/components/app/event-feed/event-hub-head.tsx
  - src/components/guest/event-experience-head.tsx
  - src/components/guest/door/welcome.tsx
  - src/app/(guest)/u/[slug]/
---

# lp/event-dates

**Goal.** An event's optional end date (a range of days, no times), read everywhere a date is: Settings takes it, the dashboard's week, live today and stage read it, the heads and cards say it, the develop default follows the last day; and lead=made (the newest event leads a quiet day's stage).

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Why.** Will, 2026-10-03, on event-header r2's facts: "think a multi-day event/trip with slow trickle, an event with no date set, a morning event... we don't do event time ranges/multiple days right now (is it worth adding?)". He said yes to adding an optional end date this round: conferences and weekend weddings sit squarely in the 18-to-50 crowd. ★ An event's dates only say when it happens and never expire it (PRD, CLAUDE.md: deletion is the only lifecycle exit). Never let an end date end, lock, archive or purge anything.

Also from his desk (host-dashboard r2, lead=made): "I think it makes sense to default to the newest event here, generally expecting a host to continue preparing it."

**Build:**
1. **One migration** in `supabase/migrations/20261003120000_*.sql`, which you write and never apply. It adds `events.event_end_date date` (nullable), under a CHECK that it is on or after `event_date` and null when that is null. The column joins the INSERT and UPDATE column grants on `events` exactly as `event_date` holds them. `get_event_by_qr_token` returns it: DROP and CREATE with every holder restated, as the foundation did. `get_public_profile`'s cards carry it if they carry the date. Prove it with a rolled-back MCP check, and keep it EXPAND-safe for partyreel.com's milestone 34 code, which never names the column.
2. **Settings' date** (`event-settings/event-page.tsx`) takes the range, a start and an optional end.
3. **One date reader** for the dashboard (`lib/dashboard/when.ts` and its readers: `attention.ts`'s this week, `moment.ts`, `seasons.ts`, `next-step.ts`): an event is on its day across its whole range ("live today" on any day of it).
4. **The words:** `formatEventDate` (`src/lib/utils.ts`) says a range ("Oct 3 to 5", "Oct 30 to Nov 2"), read by the heads, the door, the cards and `/u/` cards. Owned outside your list: `event-hub-head.tsx`, `event-experience-head.tsx`, `door/welcome.tsx`. Pass the end through where they call the formatter: one line each, accepted exceptions.
5. **The develop default** (`lib/disposable/reveal.ts`'s `defaultDevelopAt`) becomes 9 am the morning after the last day; `readiness.ts` reads the last day where it reads the day.
6. **lead=made** (`moment.ts`): on a quiet day (nothing dated today or within reach), the newest event made leads the stage, ahead of the latest arrival.

Red first; a test that an end date never touches the lifecycle (no purge, no lock).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3132`; the migration's rolled-back MCP check in your Handoff; Vitest red first for the range's CHECK words, the reader across a range (start, middle, end, the day after), the formatter's ranges (same month, across months and years, undated), the develop default after the last day, lead=made; captures of Settings' range and the dashboard's stage on a multi-day event at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A range's words: "to" or a dash?** Recommended and built: "to", as the brief writes it ("October 3 to 5, 2026",
  "October 30 to November 2, 2026", "December 30, 2026 to January 2, 2027"; a tile's "Oct 3 to 5", "Fri to Sun"): a
  screen reader says it, and the product writes words, not marks. event-header r3 and host-dashboard r3 drew en dashes
  ("October 2–4, 2026", "Nov 14 – 15"); his pick there is a swap in `formatEventDate` and `whenOf` alone.
- **A range in progress, on its tile and its week card: "Day 2 of 3"?** Recommended and built: "Day 2 of 3" beside the
  Live mark (exact, and a wristband's small delight), where a one-day party says Today or Tonight; the stage keeps
  "Live today" (the brief's words) over a date line that says the range. Overrule: "Today" as a one-day party says it,
  or "Until Sunday".
- **A longest span?** Recommended and built: none. The CHECK holds only "on or after the start, and nothing without
  one"; a trip or a festival can run weeks, and nothing reads the end but the words and the dashboard's own rules, so a
  cap guards nothing (a wrong year reads live until she fixes it).
- **Settings' range control.** Recommended and built: the date as today, and under it a quiet "Add an end date" that
  opens the last day beside it, removable; the last day cannot fall before the first (the picker's own minimum), and
  clearing the date clears its end in the same save. Overrule: two fields always shown.
- **lead=made on a quiet day replaces both quiet steps.** Recommended and built, exactly as host-dashboard r2's `made`
  drew it (Jo's undated launch over her holiday party 32 days out): with nothing on its day and nothing within a month
  either way, the newest made leads, ahead of the next dated party however far and of the latest arrival. Overrule:
  the next dated party still first.

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

## Where I am

- Booted on `lp/event-dates` from `772dabea`. The migration is written and proved rolled back, red then green (the
  log: `_scratch/event-dates/proof-log.md`; the check sits at the file's foot); never applied.
- Next: the pure rules red first (`formatEventDate`'s ranges, `lib/events/dates.ts`, `when.ts`'s span reader and
  every reader of it, `readiness.ts`, `reveal.ts`, lead=made), then the plumbing (validation, the mutation, the typed
  seam `endDateOf`, the pages and heads), then Settings' range, then the gate and the captures.
- The range reaches its readers through files outside `owns` (the dashboard and hub pages, Settings' state, the guest
  page's redaction and its two re-reads, the door, `/u/`, the camera settings): each is listed in the Handoff with why.
