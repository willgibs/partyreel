---
track: crumbs-60
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2315adad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/camera-settings
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/database-security.md
  - src/components/app/event-settings/event-page.tsx
---

# lp/crumbs-60

**Goal.** Settings' develop time can never develop an album by accident: a year half typed and left, or any time in the past, never saves as a develop; a past time asks Develop now's own question first, as the hub's button does.

## The brief

**Why.** crumbs-59, fixing Settings' date field (red-team 47's MEDIUM: it saved every keystroke), found its twin, which is worse because a develop cannot be undone. Settings' develop time (`camera-settings.tsx`'s `DevelopTimeControl`) saves on leaving the field, but accepts any time in the past. The database stores a past time as now (`events_reveal_stamp`), and that save opens every sealed row (`events_develops_rewrite`): Develop now with no question asked. A year left half typed (0002, 0202) would develop the album for every guest.

**Build:**
1. **A time that is not plainly meant never saves:** a year outside a sane window (the date field's own rule, `isSaneDay` in `src/lib/events/dates.ts`: read it, never fork it).
2. **A past time saves only through Develop now's own question,** the hub's words: "Every photo added so far shows now, to every guest." Kept is Keep it as it is.
3. **The field saves a finished time,** never mid-typing, by crumbs-59's rule for the date (`event-page.tsx`'s `EventDatesField`: reuse its approach, never copy its code: lift what both need into one home if it is shared).
4. **Red first:** tests that type a year keystroke by keystroke and leave the field, set a past time, and clear it, each finding today's code saving a develop.
5. **The facts in `disposable-mode.md`,** refined in place.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first, logged; a capture at 375 of a past time asking the question, and of a half-typed year refused.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1. A past time on an album that has already developed.** Nothing waits there, so Develop now's question ("Every photo added so far shows now") would say something untrue, and the database would store her time as its own now, so the field would read a time she never typed. Recommended: refused in words under the field, never asked, never saved ("That time has passed. Pick one ahead."). A past time on an album that waits asks Develop now's own question, as the brief says. Built that way.
- **Q2. The date's other two triggers are not adopted for the develop time** (a picker's choice saving a beat after the last, and the panel closing saving a finished time). Recommended: no; leaving the field and Return finish it, as they always did. A develop time moves what guests see, and a save at close could not ask the question; the field also goes when another control clears the time (a style switch), where a late write would put a time back over her choice. The date's close-save is safe because a date only says when. Cost, both as today: Escape or Back with a time typed and not left drops it, and if a phone's picker never blurs (the ROADMAP's `crumbs-59` line: unmeasured on a real iPhone) a pick there waits for a Return or a tap on another field. Overrule = a lane that lifts the date's finish machine into one hook both fields use (Deferred below).
- **Q3. Nothing lifted into a shared home.** What both fields need already has one home each: the window (`isSaneDay`) and its words (`DATE_OUT_OF_RANGE`), both imported, never forked. The rest of `EventDatesField`'s machine (a draft per side, the beat, the close that saves) is what Q2 leaves out, and lifting it means editing `event-page.tsx`, a `reads`. Recommended: leave it.
- **Q4. A blank or half-filled field** (a segment cleared and not typed again: the value reads empty) never saves and says "Finish the time, or pick another."; the develop time has no cleared state to save (clearing it is the album's "Right away", which has its own question).
- **Q5. The write stays permissive.** `updateEventSchema` accepts a past `develops_at` (Develop now writes the browser's now through it) and the database stores it as its own now: the question is the app's, the host's own authority stays the boundary, and an older build or a crafted request can still write one. A server refusal is outside this lane (`validation/event.ts`, `mutations/events.ts`).

## System-doc edits (in place, owned facts only)

- `docs/systems/disposable-mode.md`, "The host's control, and her cover": the develop time is sent only when plainly meant (judged once on leaving or Return, never on a keystroke or a close, unlike the date; the refusals; the question and what it writes; the minute mirrored from the SQL; the schema still permissive), and "nothing else asks" now names it.

## Deferred (ROADMAP one-liners, bucket named)

- **Now · Host:** the develop time saves on leaving the field or Return only (Escape or Back with a time typed and not left drops it, and a phone's picker may never blur it: unmeasured on a real iPhone); the date's beat and close-save, lifted out of `EventDatesField` into one hook both fields use (the develop time's own close-save must not fire when a style switch unmounts the field), would settle it, and a real iPhone is the test (from `crumbs-60`).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-60`:** `1fd1895e` (the build: the field, its judgement, the tests, the doc) and `cd175101` (the doc says exactly how Chrome types a year; the test names both browsers measured); `05bf0577` was the manifest's WIP. launch-prep moved once since the cut, by a record commit (`8a26bf78`: `docs/STATUS.md`, `docs/tracks/orchestrator.md`), nothing that touches the lane, so there is no sync commit.
- **Red first, logged:** `_scratch/crumbs-60/red-1-component-tests-on-todays-code.log`: `14 failed | 23 passed (37)` in `camera-settings.test.tsx` against the old component. Twelve find it writing a develop. Nine fail on the write itself (`onSave` called): `{ developsAt: "0202-10-03T16:56:02.000Z" }` for a year left at 0202 (on leaving, and on Return), `"2026-10-01T20:00:00.000Z"` for yesterday (both ways), the typed past time where Develop now should write now, a time under the database's minute, a past time on a developed album, and the year and the past time again in Customize's control. Three more fail on the first sentence or button that the write made impossible (finishing the year, Keep it as it is, the question standing). The other two (a fifth digit, a blank field) already refused and fail on the words alone: **the brief's "clear it" never saved a develop**; it said "Pick a time within a year." and now says what to do.
- **The bug and the fix, live, real key presses (Chrome 154 over CDP; the pane's Chrome 152 first):** on the old code, `0202` typed into the Library's Settings demo and the field left read "Developed Mon, Oct 11, 9:00 AM." with the field blank (`_scratch/crumbs-60/probe-base1-E1-left.png`, `red-live-0202-left-develops-the-album.jpg`). On `cd175101` (`verify.mjs`, `verify-keys.mjs`, captures `ver-final375-*.png` and `ver-final1024-*.png`): `0202` then leaving or Return is refused under the field ("Pick a year from 1900 to 2100.", `aria-invalid`, the line still "Develops Sun, Oct 11, 9:00 AM."); a past month asks the question, Keep it as it is puts the field back, Develop now reads "Developed Sat, Oct 3, 3:45 PM." (now); a cleared segment says "Finish the time, or pick another."; a day typed `2`, `0` (passing the past Oct 2) saves "Develops Tue, Oct 20" once, on leaving; Tab walks the segments with no blur (one `blur`, on leaving); a whole date typed through every segment and Return saves; twelve ArrowDowns pass past dates and nothing judges them until she leaves, when the last one saves; Tab out and Space on Keep it as it is works by keyboard; two Returns ask once. **Required captures at 375:** `ver-final375-S3-past-time-asks-develop-now.png` (a past time asking) and `ver-final375-S1-half-typed-year-refused.png` (a half-typed year refused); `ver-final375-S4-half-filled-refused.png` too.
- **Gates on `cd175101` (the handoff commit adds only this manifest), each on its own exit code, logs in `_scratch/crumbs-60/`:** `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0 (`gate-lint.log`); `pnpm test` 0, 868 files, 10335 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3131` 0, 140 checks, 0 failing (`gate-lab-smoke.log`); `pnpm lab:demo --base http://localhost:3131`, the boards this diff reached (identity, which imports the new module), 0, 3 steps, 0 failing (`gate-lab-demo.log`). The manifest and docs tests were re-run on the handoff commit (`track-manifests.test.ts`, `_data/docs.test.ts`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `docs/systems/disposable-mode.md`, `docs/tracks/crumbs-60.md`, `src/components/app/event-settings/camera-settings.tsx`, `camera-settings.test.tsx`, and the two new files `camera-settings-develop-time.ts` and `camera-settings-develop-time.test.ts`. Every line is owned or this manifest; no exceptions.
- **The items:**
  - `camera-settings-develop-time.ts` (new): `judgeDevelopTime` says `same`, `refuse` (words), `ask` or `save` for a time she finished, by the date's window (`isSaneDay` and `DATE_OUT_OF_RANGE`, imported, never forked), `developTimeWithinReach`, and the database's minute (`DEVELOPS_NOW_WITHIN_MS`).
  - `DevelopTimeControl` judges its draft once, on leaving or Return (never a keystroke; a close drops it), says why under the field (`aria-invalid`, `aria-describedby`, `aria-live`), and a time that would develop a waiting album asks Develop now's own question (one sentence with the button's and the hub's) and writes now, never the typed time.
  - Tests: 14 red-first ones in `camera-settings.test.tsx` (37 there) typed in Chrome's real order (a leading 0 reads blank, then 0002, 0020, 0202); `camera-settings-develop-time.test.ts` (19): the judgement's table, `DEVELOPS_NOW_WITHIN_MS` held to `events_reveal_stamp`'s interval in the migrations, and the question held to the hub's sentence in `event-hub-head-cover.tsx`.
  - `disposable-mode.md`: the rule, in place, and "nothing else asks" corrected.
  - Doc-checked: React's `onBlur` bubbles (focusout) and a controlled input takes its value synchronously in `onChange` (react.dev via Context7), which the draft relies on; Chrome's event order and the blur-only-on-leaving were measured, not read.
  - `lab:smoke`'s premise notes: the create-wizard board's open ask `add` and the-wait's open ask `arrival` describe `camera-settings.tsx` and `disposable-mode.md`, which this lane touched; re-read them before his next sitting.
- **Assets requested from Will:** none.
- **Board ideas:**
  - Develop now's question replaces the button it was asked from, so a keyboard press on the button (and a Tab out of the field into it) leaves focus on the page's body (measured, K5; the button's own press does the same by construction): the question could take focus on its confirm when a keyboard opened it (`ConsequenceLine` says announced, not focused).
  - A server bound on a past `develops_at` (Q5): the schema could refuse a time more than a few minutes back, since Develop now writes now, so a stale tab or an older build (the alias runs one) cannot develop an album by a typed time (`validation/event.ts`, `mutations/events.ts`).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (Questions above): Q1 a past time on a developed album is refused, never asked; Q2 leaving and Return finish the develop time, no picker beat and no close-save; Q3 nothing lifted out of `EventDatesField` (a `reads`); Q4 "Finish the time, or pick another." for a blank or half-filled field; Q5 the schema and database stay permissive.
- **Look at first:** `/design/library/event-settings?key=...`, Settings, What guests can add, Disposable: type 0202 into the Develop time's year and click away, then set a past month and click away. The one thing unmeasured is a phone's picker: set the time with an iPhone's wheel and see whether the line under it moves before you tap another field (Q2).
