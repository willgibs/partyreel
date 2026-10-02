---
track: ready-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-ready/
  - src/lib/events/readiness
  - src/lib/events/visibility-labels.ts
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.test.tsx
  - src/components/app/event-feed/launch-list
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/app/event-feed/checklist
  - src/components/app/event-settings/
  - src/components/app/create-event-wizard
  - src/components/app/share/event-code-door
  - content/help/day-of-checklist-for-hosts.mdx
  - docs/systems/host-app.md
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-ready.json
  - src/lib/dashboard/next-step.ts
  - src/lib/event/door/words.ts
  - src/components/app/event-card-qr.tsx
  - docs/systems/guest-flow.md
---

# lp/ready-wiring

**Goal.** Wire Will's event-ready picks into production: the readiness checklist at the head of the hub until done, Settings as numbered ticked steps with the code fifth, Create handing off into Settings' first step, and the code's corner mark with a tooltip and a tap; readiness moved into src/lib and the board retired.

## The brief

**Why.** Will answered `event-ready` r1 on 2026-10-02 (`docs/reviews/event-ready.json`):
- `list=head`: the checklist sits at the head of the hub until done.
- `guide=steps`: Settings becomes numbered, ticked rows on a rail, with the code as the fifth step and Next on each page.
- `create=hand`: Create's last screen shows the code, then what's left, then "Get it ready", which leads into Settings' step 1.
- `door=mark`: a corner glyph on the code (a lock, a closed eye, or the waiting count). This overrules the recommended `sign`. His note, verbatim: "I think the mark keeps the header from getting too crowded with text where icons will likely work 99% of the time, and we could add tooltips to clarify on the mark."
- `needs=?` is NOT yours: it moves to a host-dashboard board cut after your merge.

**What to build:**
- **Readiness.** Move `sandbox/event-ready/readiness.ts` and its 13 tests to `src/lib/events/readiness.ts`; it imports only production modules. Ready is never stored and never shown to a guest.
- **The checklist.** Build it from the board's `checklist.tsx` at the head of `dashboard/[eventId]/page.tsx`. It retires `event-feed/launch-list.tsx`, its test, and the "Before the first photo" line in `event-gallery.tsx`. The Settings card counts what a guest still needs.
- **Settings as steps,** across `event-settings/*` and `settings-pages.ts`.
- **Create's hand-off** in `create-event-wizard.tsx`.
- **The mark,** on the hub's `share/event-code-door.tsx` only, never the dashboard's `EventCardQr`. It carries a tooltip on hover and focus, and on touch a tap shows the same words: never hover alone.
- **Retire the board** by deleting `src/app/(dev)/design/sandbox/event-ready/` once readiness has moved. Its ledger is the Orchestrator's.
- **The Library and help:**
  - `library/compositions/gallery-demos.tsx` points `host-media-grid`'s test at `launch-list.test.tsx`, and its Settings entry follows your change;
  - `composition-demos.tsx` imports the Settings pages;
  - `content/help/day-of-checklist-for-hosts.mdx`;
  - `host-app.md`.

**Boundaries:**
- Don't touch the dashboard page `(app)/dashboard/page.tsx`, `components/app/dashboard/`, `lib/dashboard/`, `event-card*.tsx`, the notification bell or `user-menu.tsx`. A board draws the dashboard next.
- `visibility-labels.ts` is yours tonight; door-wiring reads it.
- Nobody edits `lib/event/door/words.ts`.

**Context, not scope.** Will's broader notes ask to redesign the host dashboard, the event headers and the whole create wizard. Boards for those are cut from the production you leave, so build the picks as clean working versions and draw nothing speculative.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3132`; `pnpm lab:demo --board disposable-mode --base http://localhost:3132` (its drawings import the wizard); the Library's Settings and hub specimens at 1440 and 375 in a headless Chrome of your own (signed-in pages cannot run on localhost: name the hub, Settings, Create and the mark's touch for build 40's red-team in your Handoff).

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door (nothing is stored, no migration, no
guest-facing word: ready is never shown to a guest).

- **When does the checklist leave the hub, beyond "until it's done"?** From the day after the event's date (the
  viewer's day, as the dashboard reads it), done or not, and the Settings card stops counting with it; an undated event
  keeps it until done. Before guests arrive is moot once they have, and the help tells a host to pause uploads when the
  party is over, which would otherwise bring the list back calling a finished album unready. Option: until done
  whatever the date; cost: a past party with no note keeps a folded line for good. **Recommended and built: the date.**
- **Does it vanish the moment it is done?** No: finished while she looks (the reel starting under her, a scan, a save),
  it stays, every row ticked, "Ready for guests. Everything is set.", for the visit; the next visit no longer draws it.
  Option: gone at once. **Recommended and built: it stays for the visit.**
- **The code row's two doors: Invite, then Print** (the board drew Print, then Share). Every door onto the code card
  reads Invite (`share=card`: "open 'Invite' then 'Share'"), and Invite leads since most hosts send the link before
  anything is printed; the line reads "Send it or print it, then scan it once yourself." Option: Print first, as the
  beat orders its two. **Recommended and built: Invite, then Print.**
- **Next: The code (the fourth page's foot) and the fifth step's row close Settings and open the code card**, the hub's
  own, growing out of the header's code. Option: the card over Settings, so closing it returns to the steps.
  **Recommended and built: close Settings.**
- **The mark replaces the Paused pill**, as drawn: paused uploads are the dimmed code and a pause on its corner, the
  words on hover, focus and a tap; Only me dims the code too (a guest who scans it cannot add). Option: keep the pill
  beside the mark. **Recommended and built: the mark alone.**
- **Settings' rail is its five steps; room stays the hub's.** Storage is the plan's (the checklist's room row and the
  dashboard's storage line say it), so Settings' head, ticks and the Settings card count only what Settings can finish
  (`settingsReadiness`). Option: a sixth step while the shelf runs short. **Recommended and built: five.**
- **The Settings card's "2 left" reads in the foreground, never amber**: amber says someone waits on her right now
  (Review's queue, people at the door). Option: amber. **Recommended and built: the foreground.**
- **The checklist's head line**: "Guests still need one more thing." (the board's "One more thing before a guest can
  get in and add" was untrue of the code row: a guest can get in before the code is first opened). Option: the board's
  line. **Recommended and built: the new line.**
- **`needs` stayed with the board.** Its derivations (`nextJob`, `readyWord` and their 6 tests) are not in production:
  his note asks for that band to be rethought whole, and production carries no function nothing calls. They are at
  `8698a5b8:src/app/(dev)/design/sandbox/event-ready/readiness.ts` for host-dashboard r1 to draw from. Option: carry
  them into `lib/events/readiness.ts` now. **Recommended and built: left in git.**

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the open-this list (checklist for launch list); What needs you's "at none the event's
  checklist speaks"; the beat's hand-off; the print sheet's doors; the header bullet (the code's corner mark, its words
  on every input, the tooltip after hydration, the Settings card's count); the code card's Invite doors (the
  checklist's code row, Settings' fifth step); Settings is five steps (the rail, its ticks, Next, the code); the launch
  list bullet replaced by the checklist's (one function, live ticks, never under her eyes, the date, the album's own
  empty place); the SSR tooltip rule refined (native `title` in the server's paint, a radix tooltip only after
  hydration).

## Deferred (ROADMAP one-liners, bucket named)

- Now · Host: the checklist's code row ticks on the hub's next render, not live: the link's opens are read with the
  page, so a host's test scan shows only after a reload or a save; a light read of `event_link_totals` while the row
  waits (a visible tab only) would tick it as she scans.
- Now · Host: `lib/dashboard/next-step.ts` (`:97`) and `next-step.test.ts` (`:80`) still say an empty event's "launch
  list speaks"; it is the checklist now (left: the boundary keeps `lib/dashboard/` for host-dashboard r1).
- Now · Host: Create's hand-off lists what is left without the account's storage (`/dashboard/new` reads none), so a
  host past 85% meets room only on the hub; the route could pass `storagePct` (from `ready-wiring`).
- Now · Help: `create-your-first-event.mdx` still names the wizard's steps Details, Design and Share (its description
  and headings) where they are Name, Style and the beat; its Step 3 paragraph is current (from `ready-wiring`).

## Handoff (replaces the chat report)

Logs and captures: `/Users/gibby/local/ai/partyreel-wt/_scratch/ready-wiring/` (below, `_scratch/`).

- **Commits, pushed:** `6c495b52` (the work), then this manifest alone. Cut from `8698a5b8`. **No sync commit:**
  launch-prep moved since (crumbs-46 merged at `2ada77e1`, its record `1f1840f0`), but nothing in this lane's `reads`
  and no path in common (`comm -12` of the two `git diff --name-only` lists is empty; `git merge-tree` merges clean).
- **Gates on `6c495b52`'s tree, each on its own exit code** (no edit between the gate and the commit):
  `zsh scripts/build-lock.sh pnpm typecheck` 0 (`gate-typecheck.log`), `pnpm lint` 0 (`gate-lint.log`), `pnpm test` 0,
  735 files and 8,733 tests (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`),
  `pnpm lab:smoke --base http://localhost:3132` 0, 132 checks and 0 failing (`gate-smoke.log`; scope the Library and the
  shell, no board), `pnpm lab:demo --board disposable-mode --base http://localhost:3132` 0, 2 steps and 0 failing
  (`gate-demo.log`). The smoke prints a PREMISE line: disposable-mode's open asks `video` and `cost` describe
  `create-event-wizard.tsx`, which this change touched (the beat's foot and a list under its code), for the pre-sitting
  pass.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, plus this file): every line sits under `owns` but
  eleven, each a knock-on of the launch list's retirement or one wire, listed with why:
  - `src/components/app/event-uploads.tsx` and `event-uploads.test.tsx`: the launch list's slot retired, the album owns
    its empty state ("No photos yet"), and the three tests of what the album's place holds moved here from the retired
    `launch-list.test.tsx`, the Review scar kept;
  - `src/components/app/share/event-sheets.tsx`: threads `ready` (the facts) and the code's door (`closeSheet`, then
    `openCode`) into Settings, the one wire from the page to the rail;
  - `src/components/app/share/invite-button.tsx` and `code-card.tsx`: one comment each named the launch list as an
    Invite's home (the checklist's code row now, which uses the button);
  - `src/app/(app)/dashboard/[eventId]/event-not-found.test.tsx`: the launch list's mock became the checklist's, and the
    hub's one new read (the storage summary) joins the reads that must not run before the event is found;
  - `src/components/app/event-feed/event-hub.test.tsx`: a comment said the album count falls through to the launch
    list's (its pin unchanged and green);
  - `src/app/(dev)/design/gallery/specimens.generated.json`: regenerated by its collector for the Library's new entries;
  - `content/help/event-settings-explained.mdx`: it said "four rows" of the Settings rebuilt here as five steps (its
    description, its opening and one sentence);
  - `content/help/create-your-first-event.mdx`: its Step 3 said to tap Go to your event (now beside Get it ready) and
    that a custom link is set there (it moved to the share dialog with the beat, `first-event`).
- **The items:**
  1. **Readiness in `src/lib`** (`lib/events/readiness.ts`, 16 tests in `readiness.test.ts`): the board's function,
     importing only production, its 9 ready tests kept (the code row's doors reshaped, reason in place), plus the head
     (`readyHead`), Settings' reading (`settingsReadiness`, `stepsLeft`, `stepWants`), the date (`checklistOver`) and
     Create's facts (`newEventFacts`, held to `createEventSchema`'s defaults).
  2. **The checklist at the hub's head** (`event-feed/checklist.tsx`, 13 tests in `checklist.test.tsx`: the launch
     list's scar, the live tick off the album store, the fold and focus, never under her eyes, the date, every door);
     the page gathers one `readyFacts` (`page.tsx`; `page.test.tsx` pins the order, Views as the first open, one set of
     facts, the viewer's day, the code's props). Retired: `launch-list.tsx`, its test, "Before the first photo"
     (`event-gallery.tsx`). The Settings card says "N left" while a guest still needs something (`event-cards-row.tsx`'s
     `strong`).
  3. **Settings as steps** (`settings-rows.tsx`, `event-settings-sheet.tsx`, `settings-pages.ts`'s `nextSettingsPage`):
     the rail, the ticks from Settings' own values over the hub's facts, the code fifth with Invite and Print, Next on
     every page, the body back at its top on a move; `event-settings-sheet.test.tsx` (8 new cases, the rows-in-order test
     reshaped to five) and `settings-rows.test.tsx`.
  4. **Create's hand-off** (`create-event-wizard.tsx`; `create-event-wizard.test.tsx`, 4 cases): the list from
     `newEventFacts`, Get it ready to `?room=settings&setting=door`, Go to your event a ghost beside it.
     `create-flow.test.tsx` green unchanged.
  5. **The mark** (`share/event-code-door.tsx`, `codeMark` in `visibility-labels.ts`; `event-code-door.test.tsx`, 11
     cases: the words, the dims, the press never opening the card, focus, a tap and a second tap, a cursor's click).
     `visibility-labels.ts` only gained `codeMark` and its types (and `uploadsLabel`'s comment); door-wiring's reads are
     as they were.
  6. **The board retired**: `src/app/(dev)/design/sandbox/event-ready/` deleted (its ledger,
     `docs/reviews/event-ready.json`, is the Orchestrator's).
  7. **The Library**: `event-checklist` (three moments) and `event-code-door` (five doors) entries, Settings' entry as
     five steps with Next (`SettingsNext` drawn inline), `host-media-grid`'s test pointed at `host-media-grid.test.tsx`.
  8. **Help and docs**: `day-of-checklist-for-hosts.mdx` (the event's own checklist, the first scan's tick), the two
     articles above, `host-app.md`.
- **Seen in a headless Chrome of my own** (`_scratch/cdp.mjs`, reduced motion, light and dark; `_scratch/shots/`): the
  checklist at 1440 and 375 (`checklist-1440-full.png` dark, `checklist-{1440,375}-light.png`: side by side at a desk,
  stacked in a hand, the code row's two doors under its line at 375, the folded line's chevron there); Show then Fold
  moving focus (`s2.json`'s eval: "Fold the checklist" focused); the five doors (`code-1440-light.png`), a hover's words
  (`code-1440-hover.png`) and a tap's at 375 (`code-375-tap-view.png`; `s4.json`'s event log: a second tap puts them
  away, a scroll closes them); Settings' steps at 1440 and 375 (`settings-1440-rest.png`, `settings-375-rest.png`) and
  the walk door, adds, reel, event, "Next: The code" (`s7.json`'s evals, `settings-1440-event.png`). No console error.
- **Build 40's red-team, signed in on the alias** (none of these can run on localhost):
  1. **The hub of a new event**: the checklist under the cards, whole; Choose, Open and Add them open Settings on their
     page over the album (a modified click opens a tab); Invite opens the code card; Print opens `/print` in a tab; Add
     photos opens the uploader and brings it into view; the Settings card says "1 left".
  2. **The first open**: scan the code from a phone (or a private window), reload: "Opened 1 time", the bar full and
     green, "Ready for guests", the Settings card names the door again.
  3. **The first photos, live**: add one, the list folds to one line as it lands; Show and Fold; a second photo ticks the
     first photos with nothing refreshed; once everything is done it stays ticked, and a reload no longer draws it.
  4. **Settings**: the ticks match the checklist; pausing uploads by its word unticks step 2 at once; Next walks the four
     pages; Next: The code closes Settings and grows the card out of the header's code (a desk and 375, Back afterwards
     never reopening Settings); the fifth row and its Invite do the same.
  5. **Create**: the beat lists the code, the first photos and the welcome; Get it ready lands on the hub with Settings
     on Who can get in (a deep link: closing it stays on the hub); Go to your event as before.
  6. **The mark**: Private with you letting each person in and someone waiting (the amber lock and its count), a
     password, Only me, paused; hover and Tab show the words; at 375 a tap shows them and a second tap puts them away;
     pressing the code still opens the card, and a tap near the corner (the mark's 40px target) is the mark's. The
     production console shows no hydration error on the hub (the tooltip mounts after hydration).
  7. **A dated event whose date has passed**: no checklist, and the Settings card names the door.
- **ROADMAP lines this retires or moves:** `:93` ("Before the first photo" at 375) retires with the launch list; `:60`'s
  "wants the launch list and the Reel card checked against the store" is the Reel card alone now (the checklist reads
  the store, its code row the page); `:95`'s "the dashboard card's code chip wearing the hub's door once `door` is
  picked" is now concrete (picked: the mark, `codeMark`).
- **Assets requested from Will:** none.
- **Board ideas:**
  - The dashboard card's QR chip wearing the hub code's corner mark (`codeMark`), now that `door=mark` is picked.
  - What needs you could read `readiness()` per event (the same function as the hub), whatever host-dashboard r1 makes
    of the band.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the nine Questions above (the date, staying for the visit, Invite then Print, Next: The code
  closing Settings, the mark alone, five steps, the foreground count, the head line, `needs` left in git), plus: the
  paused-uploads row's Open opens Settings' What guests can add rather than writing from the hub (one home for every
  setting's write); "opened" is the header's Views number (`qr_scans + album_views`, the latter frozen) so the two never
  disagree.
- **Look at first:** the hub at 375 an hour after Create (the whole list's height above the album), then Next: The code's
  hand-over to the card at both widths.
