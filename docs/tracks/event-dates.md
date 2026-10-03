---
track: event-dates
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
- **Settings' range control.** Recommended and built: the date as today, and beside it a quiet "Add an end date" that
  opens the last day ("to", then the field and its ×); the last day cannot fall before the first (the picker's own
  minimum, and a typed one is refused under the field); a moved first day keeps an end still after it and moves one it
  reaches or passes along with it (a weekend rescheduled stays a weekend); a cleared date clears its end, saved when the
  field is left. Overrule: two fields always shown, or a moved first day that always keeps the range's length.
- **lead=made on a quiet day replaces both quiet steps.** Recommended and built, exactly as host-dashboard r2's `made`
  drew it (Jo's undated launch over her holiday party 32 days out): with nothing on its day and nothing within a month
  either way, the newest made leads, ahead of the next dated party however far and of the latest arrival. Overrule:
  the next dated party still first.

## System-doc edits (in place, owned facts only)

- `docs/systems/dashboard.md`, four passages refined in place, by their new opening words: "**An event's days are the
  dates its host set, else the viewer's calendar day of its newest approved upload**" (a range: live on any day of it,
  its month after from its last day, as near as its nearest day, its year the one it began; an end date only says
  when); "**The stage** leads with `momentEvent`: the one on its day (a host's date first, any day of a range" (lead=made
  on a quiet day; its line under the name says the whole range); "**This week** is every other party within seven days
  of its nearest day"; "**A tile** is its photograph, or its date (a range's first day)" (a range's when, "to").
- For the Orchestrator, in docs this lane does not own (each the line it refines):
  - `host-app.md`, "The checklist stands at the head of the hub": "from the day after the event's date it is not drawn"
    becomes "from the day after the event's last day (a range's end)"; and Settings' This event page: the date takes an
    optional end (Add an end date; never before the date; a moved date keeps an end still after it and moves one it
    passes, keeping the range's length; a cleared date clears its end; the two saved together, refused in words by the
    CHECK's name, `events_end_date_on_or_after`).
  - `guest-flow.md`, the locked page's REDACTED `shellEvent`: `event_end_date` is blanked with `event_date`; the door's
    re-read (`readDoorEventDetails`) and the unlocked album's (`rehydrateUnlockedDetails`) carry it; the album head and
    the welcome's byline say the range.
  - `database-security.md`: in the anon reads' bullet, `get_event_by_qr_token` redacts "the date and its end"; under
    value gates, `events_end_date_on_or_after` (an end on or after the date, and none without one).
  - `profiles-social.md`: `get_public_profile`'s hosted cards and attended lines carry `event_end_date` beside
    `event_date`, and a `/u/` card says the range.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Guests: the account's other lists still say a range's first day alone: the claims card (`list_guest_rows_by_email`
  answers `event_date` only), the As a guest cards (`getMyGuestEventCards`' select) and the credits on Yours and likes
  (`get_my_uploads`, `get_my_likes`); each read carries `event_end_date` beside the date and hands it to
  `formatEventDate` (from `event-dates`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/event-dates`:** the migration `2403e461` (its check revised `3a50d4de`), the rules red then
  green `cde2ad6f`, the readers and Settings `916c679c`, the guards `38858215`, the doc `e1867c69`, the time bomb
  `0b14f31b` (picked onto launch-prep as `14a0caa7`), the seams dropped `ec275044`; syncs `5c556b22` (host-dashboard-r3,
  event-header-r3), `cc3d5f99` (the migration applied, its types), `dcc99968` (the-wait-r2), `d6004157` (crumbs-56: its
  `develop` object and my range both kept in the hub page and the head, no conflict). launch-prep has since moved only by
  records (`f6bd644b`).
- **Gates on `d6004157`, each on its own exit code** (logs `../partyreel-wt/_scratch/event-dates/sync2-*.log`):
  typecheck 0; lint 0 (0 warnings); test 0 (849 files, 10,057 tests); `build-lock.sh pnpm build` 0; `lab:smoke --base
  http://localhost:3132` 0 (157 checks, 0 failing); `lab:demo` 0 at 1440 and 0 at `--width 375` (11 steps each, 0
  failing; scope: create-wizard, demo-framing, event-header, host-dashboard, identity, take-home, the-wait, the Library,
  the shell). Port 3132 freed; no Chrome of mine left running.
- **The migration** (`20261003120000_event_end_date.sql`, applied by the Orchestrator as `20261003154825`, frozen):
  drift read first (the two bodies e944c879 / cf141ab3 = the repo's); the rolled-back check at its foot RED on the live
  schema before (0 fixtures ok; 1 to 6 red, the column missing) and GREEN 7/7 with the file (the CHECK in its own name;
  insert, update and select as the date holds them, another account's session 0 rows, anon 42501; the album's read
  answering the end LAST, blanked for password and private to anon, whole to the owner, ACL the four holders; both
  profile arms carrying it; a range long over moving no lifecycle column, read by no function but the two, no trigger,
  no policy), rolled back clean each time (log `_scratch/event-dates/proof-log.md`); advisors 19 / 4 / 35 before.
- **Live, after the apply** (local dev on the real column, then restored): a name-only album dated October 2 to 4 says
  "Hosted by Will Gibson · October 2 to 4, 2026" at its door and in its head, and `/u/willg` its card the same
  (`captures/live-door-range-1440.png`, `live-profile-range-1440.png`); a password album given November 27 to 29
  carries neither day in its locked page (only `"event_end_date":null`), and a direct anon PostgREST call answers both
  null. Both events restored (dates null, the listing off), checked by select.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, this file, and these exceptions:
  - accepted by the brief: `event-feed/event-hub-head.tsx`, `guest/event-experience-head.tsx`, `guest/door/welcome.tsx`
    (an optional `endDate` into `formatEventDate`).
  - the readers that hand the end to what the brief asked to say it: `app/(app)/dashboard/page.tsx` (`HomeEvent.endDate`,
    the rows' label), `app/(app)/dashboard/[eventId]/page.tsx` (the head, readiness's welcome, `checklistOver`'s last
    day) and its source test (`page.test.tsx`, its `checklistOver` pin reshaped), `components/guest/event-experience.tsx`
    and `entry-modal.tsx` (to the head and the door), `app/(as-guest)/.../as-guest/page.tsx` and `share/as-guest-view.tsx`
    (See it as a guest draws the guest head), `app/(guest)/u/[slug]/page.tsx`, `party-cards.ts` and its test (the brief's
    `/u/` cards, under `reads`), `lib/db/queries/social.ts` (the profile payload's hand-written types, two optional keys).
  - ★ `app/(guest)/e/[token]/page.tsx` and `page.redaction.test.tsx`: the locked shell blanks `event_end_date` with the
    date, or a gated album's end would ride its flight payload.
  - the reads that carry it: `lib/db/queries/guest-events.ts` and its test (the album's read, the unlocked re-read),
    `lib/db/queries/event-doors.ts` (the door's re-read).
  - Settings: `event-settings/settings-state.tsx` (the value, its write with the date, its sentence);
    `event-settings/camera-settings.tsx` and `lib/disposable/album-style.ts` (the develop default's two callers).
  - guards reshaped on purpose, the album's read and the profile's arm now this file's: `lib/db/migration-guards.test.ts`,
    `lib/db/guest-cap-and-faces-guards.test.ts`, `lib/disposable/migration-guards.test.ts`,
    `lib/db/queries/profile.private-count.test.ts`.
- **The items:**
  - The migration: `events.event_end_date` under `events_end_date_on_or_after`, the date's column grants, the album's
    read answering it last under the date's redaction, the profile's cards carrying it.
  - One shape (`lib/events/dates.ts`: `eventDays`, `lastDayOf`, `endToStore`, `endForNewStart`), the words
    (`formatEventDate(date, end)`: "October 3 to 5, 2026"), and the dashboard's one reader (`when.ts`: `spanOf`,
    `daysToEvent`, `whenOf`'s range ladder, `longDays`) under the week, the stage, the groups, the marks and the moment.
  - lead=made: a quiet day's stage leads with the newest made (`moment.ts`; two r1 tests reshaped on purpose, their
    far party and late upload kept as what no longer leads).
  - Readiness's welcome and `checklistOver` read the last day; the develop default is 9 am after the last day.
  - Settings' range control (`event-page.tsx`), the schema's refusals in words, the write's one spelling.
  - The heads, the door, See it as a guest and `/u/` cards say the range; the locked shell blanks it.
  - ★ The lifecycle guard (`event-dates.test.ts`): no SQL but the column's own statements and the two reads names
    `event_end_date`, and no lifecycle home in the app (the crons, `lib/lifecycle`, the develop and the seal, R2's
    delete, account deletion) reads an end date.
  - The time bomb outside the lane: `door-settles.test.tsx` pinned a develop time "ahead" at 13:00Z today, red for every
    lane once it passed; it reads against the test's own clock now.
- **Seams:** gone on the regenerated types: the pages, Settings' state, the write (typed insert and patch), the door's and
  the unlocked album's reads (their `overrideTypes`), and `endDateOf` itself. Kept: a reader at the album's RPC read,
  `row.event_end_date ?? null`, since its Returns types the end a non-null `string` though it is NULL for one day and
  under the redaction (as `reel_hold_sec` is), pinned in `guest-events.test.ts`.
- **Captures** (`../partyreel-wt/_scratch/event-dates/captures/`): Settings' range at 1440 and 375
  (`settings-range-1440.png`, `settings-range-375.png`), its sentence ("Maya & Jay's Wedding, October 10 to 11, 2026",
  `settings-rows-range-375.png`), its refusal (`settings-refused-375.png`), one day (`settings-one-day-1440.png`); the
  dashboard with a weekend on its stage at 1440 and 375 ("Live today", "Friday, October 2 to Sunday, October 4"; the
  week's "Day 3 of 5", "Tue to Thu", "Sep 25 to 27": `dashboard-stage-range-1440.png`, `dashboard-full-1440.png`,
  `dashboard-stage-range-375.png`, `dashboard-week-range-375.png`), drawn from production's composition on fixtures by
  a scratch page never committed (a dashboard needs a sign-in localhost cannot make); the live door and profile above.
- Assets requested from Will: none.
- **Board ideas:**
  - The event-header and host-dashboard boards draw a range with their own words and an en dash (`Host.ends`,
    `ranged()`, "October 2–4, 2026"); production's `HomeEvent.endDate` and `formatEventDate` carry it now, so a board
    can draw production's words, and "to" against a dash is one question for his desk.
  - The stage on a range's day could say where it stands ("Live today · day 2 of 3"), as its tiles do.
  - Settings' two native date fields could be one range picker (a calendar that takes two presses), and Create could
    offer the date with its end.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the migration stands as applied).
- **Calls his to overrule:** "to", never a dash; "Day 2 of 3" on a range's tile and week card, the stage's "Live
  today"; no longest span; Settings' control as above; lead=made ahead of both quiet steps; a range folds into the year
  it began and its month after counts from its last day; the stage's word counts down to the first day and dates the
  past from the last ("Yesterday" the day after a weekend); a cover-less tile's face is the first day; an end equal to
  the date is stored as one day.
- **Look at first:** `captures/settings-range-375.png` and `dashboard-full-1440.png`; the shell's line in
  `app/(guest)/e/[token]/page.tsx`; `lib/dashboard/when.ts`'s `rangeWhen`; `moment.ts`'s third step.

## Where I am

- Handed off on `lp/event-dates`; nothing in flight.
