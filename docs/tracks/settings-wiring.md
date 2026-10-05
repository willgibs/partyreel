---
track: settings-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e123a6a9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/
  - src/app/(app)/dashboard/[eventId]/settings/
  - src/components/app/create-event-wizard/
  - src/lib/disposable/
  - src/lib/guest/camera/roll-view
  - src/lib/guest/camera/words
  - src/lib/db/mutations/events.ts
  - supabase/migrations/20261005190000_roll_size_range.sql
  - docs/systems/host-app.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/customize.json
  - src/app/(dev)/design/sandbox/customize/spec.ts
  - docs/systems/database-security.md
---

# lp/settings-wiring

**Goal.** Will's customize picks in Settings and Create: the roll's film boxes and a full-width stepper from 1 to 99, Settings' first screen as live words over focused pages, her roll kept across a style switch, and nothing he did not pick built.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk.

**From Will's desk 3 answers on customize r1** (his verdicts and notes: `docs/reviews/customize.json`; the board: `src/app/(dev)/design/sandbox/customize/`, its asks, options and carried calls). Each change pinned by a test that fails on the old code:

1. **roll = both:** 12, 24 and 36 as film boxes and Other beside them, which opens a stepper from 1 to 99 under them, in Create and in Settings. His note: "When the +/- selector becomes visible below, let's stretch it with the - left and + right and count center. Looks weird aligned more tightly left here, with empty space to its right." The bounds: `events_roll_size_range check (roll_size between 1 and 24)` (`20261002200000_disposable_foundation.sql:148`) refuses 99, so one migration, `supabase/migrations/20261005190000_roll_size_range.sql` (the check 1 to 99, with the mirrors of `src/lib/disposable/roll.ts` and its SQL constants under their parity tests), a rolled-back check at its foot; the Orchestrator has the Advisor read it before the apply. What a guest's camera says at any size (the words in `src/lib/guest/camera/`). Her size is kept across a style switch and across the camera turned off and on (today `events_reveal_stamp`'s coalesce writes it back to 24: the ROADMAP line this retires).
2. **home = words:** his note verbatim: "I absolutely love the live words as a natural way to check the current event settings and quickly swap anything that looks weird, but these live words are still meant to be more of an overview concept. Each individual control/config/toggle/etc should have its own, more focused UI within its nested page. For example, for the 'Highlight reel' group, I can easily preview what's happening reading the live words, make quick adjustments by clicking those, or click into the highlight reel group to adjust/understand each setting individually, such as seeing the reel styles and what 3 seconds feels like versus other options. Best of both worlds." So: Settings' first screen says each choice in its sentence (each live word a choice made in place) as the overview, and each group's page holds a focused control per setting, built from production's own pieces where they exist (Create's style previews for the reel's styles, the roll's boxes and stepper). A focused control that needs real design (what 3 seconds feels like beside the other lengths) is a Board idea in your Handoff, never a guess.
3. **mine = account, read as NOT built now.** His note: "I'd like new event creation to feel a bit more focused and streamlined, so adding a way to set defaults within the flow feels like a feature that adds crowding more than a useful benefit... Thinking it's available in settings at best, but not ensuring it's included." No defaults in Create; a ROADMAP line (Deferred) holds "her usual, set in Account" if hosts ask.
4. **Carried calls NOT built:** `take-home` (a new export permission) and `taken` (a kept capture time: Will's open privacy question, X7): Deferred lines, never code.

Not yours: the album's order, the guest's sort and filter and the arrivals pill (album-order, in parallel); the hub's doors (event-header-wiring). `src/components/guest/camera/` belongs to back-layers until it merges; if the camera's words need `album-camera.tsx`, propose the lines in your Handoff. Wiring rigor: the whole gate; each change walked on your port at 375 and 1440 (Settings needs a host's sign-in, which only port 3000 has: walk what your port reaches and list the rest for the Orchestrator's desk walk).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

None is a one-way door (the migration only widens a CHECK and relaxes another, with nothing backfilled; every answer is a
line or two of this lane's files); each is built as its recommended answer and listed again under the Handoff's calls.

1. **Where does her roll live while the album takes free uploads?** Recommended, built: on the row. The migration keeps
   `roll_size` under free uploads (the stamp no longer clears it, and `events_roll_size_follows_capture` becomes
   `events_camera_has_roll`, "a camera always carries a roll"), so a style switch and the camera off and on come back to
   her size with nothing for the app to remember; every reader already asks `capture` first (the three upload bodies'
   `if v_event.capture = 'camera'`, the app's `developFactsOf`), which the rolled-back check proves on the live schema
   (step 2: a kept roll of 30 under free uploads answers `roll: null` to the guest's upload read). The other answer, a
   second column for "her last roll", keeps the old two-way CHECK at the cost of a column, a grant and types to
   regenerate. For the Advisor before the apply.
2. **Does Create send her roll with Live or Review?** Recommended, built: only with the Disposable (`createFieldsOf`
   rides `roll_size` with the camera alone), so what Create showed is what is born; her pick stays put while she moves
   between the cards, and an album born Live or Review meets 24 the day its camera starts. The other answer: born with
   her pick whatever the style, kept for a Disposable later.
3. **A smaller roll mid-party?** Recommended, built (no code of its own): every shot already taken stays, and a guest
   past the new size meets her camera's "That's your roll" at the next shot (`create_media` counts her live shots
   against the roll it reads; the rolled-back check's step 4 raises a roll mid-period the other way), with no
   consequence line, since Settings reads no guest's count. The other answer, a line when the new size falls under the
   most any guest holds, needs a read of that number.
4. **How the stepper saves.** Recommended, built: a box saves at once; each step is laid over the row at once (the
   stepper, the Disposable card's line and the first screen's word all say it) and saved 0.6 s after her last
   (`ROLL_REST_MS`), or the moment the page goes; holding minus or plus runs the count, quickening (24 to 56 in a
   1.6 s hold, 99 in about 3.5 s). The other answer, every press a save, costs a Server Action and a hub re-render a step.
5. **The roll's live word.** Recommended, built: the camera's sentence says "24 shots each" with "24 shots" a word whose
   menu is film's three (12 "Film's short roll.", 24 "Partyreel's usual.", 36 "Film's long roll."), her own count
   chosen where it is none of them, and Another number ("Any count from 1 to 99."), which opens What guests can add
   with Other picked and the count in focus. The other answer: the word always opens the page.

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`: the model's roll (1 to 99, 24 unless named), a new bullet ★ Her roll outlives the
  camera (free uploads keep it; every reader asks `capture` first; Settings alone reads the kept size), and the host's
  control's Shots each (`roll-control.tsx`, `RollSetting`, Create's Disposable pick drawing the same control).
- `docs/systems/host-app.md`: Create's steps name the album's style (a Disposable's develop time and roll under its
  pick), and Settings' sentence is the overview over each page's whole control (a word swaps in place; an answer only
  its page can take opens that page, the roll's at its stepper in focus, `SettingsState.opening`).

## Deferred (ROADMAP one-liners, bucket named)

- Now · Host: her usual for new parties (the style, the roll, the develop's hour), set in Account, only if hosts ask;
  never offered in Create (customize r1's `mine`, read as not built: "available in settings at best, but not ensuring
  it's included").
- Now · Guests: what a host lets guests take home (everything, as today; their own photos; just to look), a new export
  permission (customize r1's carried `take-home`, not built).
- Now · Guests: each photo's own time taken, kept as its location is stripped, so the night in order can go by it
  (customize r1's carried `taken`; waits on Will's privacy question X7).
- Now · Camera: a roll of one is refused as "You've taken all 1 shots on your roll." (`create_media`'s raise, mirrored
  by `rollSpentMessage` under `roll.test.ts`); say one shot as one the next time `create_media` is redefined.
- Retire, done here: "Camera: turning the camera off and back on writes the roll back to 24 (`events_reveal_stamp`'s
  coalesce): keep her size, or her usual once account defaults exist." (20261005190000 keeps her size.)

## Handoff (replaces the chat report)

- **Commits:** the work is `2e3aa76b0` and `27297d91b`; the sync is `018d58a2a`, a merge of `origin/launch-prep` at
  `5104a5d05` (back-layers, drive-fixes and pricing-doors had merged: none in this lane's paths or reads, but
  back-layers' popup and camera changes stand beside Settings and the camera's count, so the whole gate ran on the
  merge); all pushed to `origin/lp/settings-wiring`. `launch-prep` moved since by a record only (`937b01f87`), so no
  second sync. This manifest is the commit after them, whose sha is the chat line's.
- **Gates** on the synced tree (`018d58a2a`; this manifest commit changes no code), each on its own exit code, logs in
  `/Users/gibby/local/ai/partyreel-wt/_scratch/settings-wiring/`:
  - `zsh scripts/build-lock.sh pnpm typecheck` exit 0 (`gate-typecheck.log`); `pnpm lint` exit 0, no warning
    (`gate-lint.log`).
  - `zsh scripts/build-lock.sh pnpm test` exit 0: 1,006 files, 12,501 tests (`gate-test.log`). Before the sync its one
    failure was not this lane's (`track-manifests.test.ts`: drive-fixes.md's `reads` resolve from the primary checkout
    only); the sync took that manifest away.
  - `zsh scripts/build-lock.sh pnpm build` exit 0 (`gate-build.log`).
  - `pnpm lab:smoke --base http://localhost:3132` exit 0: 190 checks, 0 failing (`gate-lab-smoke.log`), scoped to
    create-wizard, customize, drive-export, event-header, host-dashboard, identity, the-wait and the Library.
  - Red on the base: the lane's ten test files against its 13 sources and the migration put back to `5104a5d05`'s: 29
    failed, every new and reshaped pin (`red-on-base.log`); the tree back at HEAD after.
- **The rolled-back check** (the migration's foot, assembled by `assemble-check.mjs`, one `execute_sql` each on the live
  schema): RED without the file, all six steps false; GREEN with it, all six true; nothing persisted after (the two
  CHECKs and the stamp's md5 as before, no check user or event): `rolled-back-check.log`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned paths + this file, plus:
  - `src/lib/validation/event.ts` and `event.test.ts`: the host's create and update parse through `createEventSchema` and
    `updateEventSchema`, which stripped `roll_size` ("the wizard's to name later, never this form's"); `roll_size` joins
    `developFields` (1 to 99, refused in `ROLL_SIZE_MESSAGE`), the create's default null; its two "never carries the
    roll" pins reshaped on purpose, each keeping its scar (the period is never a host's).
  - `src/lib/events/guest-experience-summary.ts` and its test: the sentences' one home, where "24 shots" becomes the live
    word `roll` (`SentenceWord`); the sentence's text is unchanged, one pin reshaped on purpose.
  - `src/lib/db/mutations/events.test.ts`: the owned `events.ts`'s own test (the owns entry names the file).
- **The items**, each pinned by a test that fails on the old code, and walked on 3132 in a headless Chrome of my own
  (CDP, `shoot.mjs` driven by `plan-*.json`, pictures in `shots/`) at 375 (a phone's metrics and touch) and 1440,
  over the Library's own Settings and Create compositions, their writes inert; every plan re-walked on the synced tree
  with the same readings (`walk-synced.log`):
  1. The migration: a roll of 1 to 99, her roll kept under free uploads, `events_camera_has_roll`
     (`supabase/migrations/20261005190000_roll_size_range.sql`; `roll.test.ts`, `migration-guards.test.ts`).
  2. Settings' Shots each on What guests can add: film's 12, 24, 36 and Other, which opens the stepper as wide as the
     boxes (minus at the left, the count in the middle, plus at the right); a box saved at once, a run of steps once
     she rests, a refused one put back (`roll-control.tsx`, `camera-settings.tsx`'s `RollSetting`;
     `event-settings-sheet.test.tsx`; `s375-roll-boxes.png`, `s375-roll-other.png`, `s375-roll-held.png`: a 1.6 s hold,
     24 to 56, the Disposable card's line saying 56; `d1440-roll-held.png`, the dark theme).
  3. The first screen's roll word, its menu, and Another number opening the page at the stepper in focus
     (`settings-rows.tsx`'s `rollChoices`, `settings-state.tsx`'s `opening` and `lay`; `w1440-first-screen.png`,
     `w1440-roll-menu.png`, `w375-roll-menu.png`, the phone's rows; `w375-another-number.png`,
     `w1440-another-number.png`).
  4. Her roll read whatever the capture: on Live the Disposable card and Customize say her size, and the switch back lands
     on it (`settings-state.tsx`'s `rollSizeOf`; the sheet's last pin).
  5. Create: the roll under the Disposable pick in its develop slot, Other's stepper brought into view as it opens, the
     card's line and its arriving camera saying her count, sent with the Disposable alone (`add-step.tsx`,
     `develop-row.tsx`, `camera-settings-style-picture.tsx`, `album-style.ts`'s `createFieldsOf`; `add-step.test.tsx`,
     `album-style.test.ts`; `c375-disposable.png`, `c375-other-50.png`, `c1440-other.png`).
  6. The schema and the host's two writes carry the roll, refused past the bounds in words, the CHECK read by its name
     (on an insert never the plan's event limit) (`validation/event.ts`, `mutations/events.ts`; their tests).
  7. The camera at any size: its count before the server answers takes any roll to 99 (it fell back to 24 past 24); its
     words pinned at 1 and 99 (`roll-view.ts`; `roll-view.test.ts`, `words.test.ts`). `album-camera.tsx` needs no line.
- **Not reachable on 3132**, for the Orchestrator's desk walk once the migration applies (sign-in is port 3000's, and the
  old CHECK refuses a roll past 24): as willg97 on a Disposable, What guests can add, then 36 (saved), Other and a held
  plus to about 60 (one save once she rests; the row's `roll_size` 60), Live and back to Disposable (still 60), the
  first screen's "60 shots" and its menu, Another number (the page at the stepper, in focus); Create a Disposable with
  Other at 50 (the new row's `roll_size` 50); as a guest of that album, the camera's "Frame 1 of 50" and its count.
- **Assets requested from Will:** none.
- **Board ideas:**
  - The reel's page: what each hold feels like, a photograph held at each length beside the others (Will: "what 3 seconds
    feels like versus other options"), and the looks in motion rather than as graded stills.
  - Create at a laptop: the night beside an open Disposable (its develop row, the roll and Other's stepper push the night
    under the room's fold: the room scrolls 59 px at 1440x900; the pictures could yield as they yield to the row today).
  - The Library's Settings composition is a Live album: a specimen on a Disposable would show the roll's row, its word
    and Another number without a press through (the compositions file is no lane's of mine).
  - The develop time as a live word in the camera's sentence (its quick moves: the morning after, an hour later; the
    page for any time), the one choice of What guests can add still said as prose.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:**
  - `supabase/migrations/20261005190000_roll_size_range.sql`, the Advisor first (the brief's): one ALTER (two CHECK
    validations, a scan of about 153 rows under ACCESS EXCLUSIVE) and a `create or replace` of `events_reveal_stamp`
    (its ACL kept, and restated); the drift to read is in its header (live 2026-10-05: the two CHECKs as they stand, the
    stamp's prosrc md5 21128fda973998ed3f5f87e1c8381488); advisors' expected delta none; no types to regenerate (no
    column, no signature). ★ Apply it before the build carrying this lane deploys: until then a host's roll past 24 is
    refused by the old CHECK (said in the schema's words, and put back in Settings).
  - Worker, Vercel, Stripe, env: none.
- **Calls his to overrule**, one line each:
  - The five Questions above, each built as its recommended answer.
  - The ceiling stays three rolls' worth at any size, as production counts it (297 shots a period at 99, bounded by
    storage and the uploads allowance); the board's settled "re-shoots stay a flat 3" is D3's on desk 5 (guest-moments).
  - A roll of one is allowed (the board's 1 to 99), its refusal saying "all 1 shots" until `create_media` is next
    redefined (the Deferred line).
  - The words: the row's "Shots each" and "Each guest's roll on the album's camera.", Other's "1 to 99", the menu's title
    "Shots on each guest's roll", and Create's "Shots each" over the boxes.
  - The customize board's `roll` and `home` asks are wired here and `order` by album-order; `mine` stands unbuilt, so the
    board can retire once album-order lands.
- **Look at first:** the Library's "Settings, five steps" (`/design/library/event-settings`): What guests can add, press
  Disposable, then Other and hold plus; back up, the "24 shots" word and its Another number.
