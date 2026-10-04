---
track: styles-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "42cdc1b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard.tsx
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/camera-settings
  - src/components/app/event-settings/adds-page
  - src/lib/disposable/album-style
  - src/lib/disposable/wait-words
  - content/help/review-uploads-before-they-appear.mdx
  - content/help/event-settings-explained.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
---

# lp/styles-wiring

**Goal.** Wire Will's add=styles in Create (three album-style cards, Live, Review, Disposable), the middle style named Review everywhere it appears, the develop time directly under the Disposable card.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's pick on create-wizard r3 (2026-10-04), to wire: add=styles,** in his words: "Could continue to be polished, but this is the far superior option. Feels cleaner with more focused views/less fighting for attention, and each option is explained clearly against each other without just throwing screens at a new host. these visuals are more subtle/conceptual, and represent each mode's experience with its description well versus other options that are just throwing fullscreen experiences as me. ... I think this screen wins because of the clear distinction across the 3. Really clear mental model, and I like adding reviewed (should we go with a more simple 'Review'?) as a top-level mode instead of a more confusing subfeature. If disposable is selected, time should either be directly below option item or on a focused following screen, but not tucked underneath the timeline where it may not be noticed."

Read the board (`src/app/(dev)/design/sandbox/create-wizard/`: `add.tsx`'s `styles`, `fixtures.ts`) and `docs/reviews/create-wizard.json`. Production is the working version and the drawing the target.
- **The add step as album-style cards:** "Pick your album's style", three cards (Live, **Review**, Disposable), each with its small album picture moving through the night, a name, one line and a tick, a soft glow under the chosen card.
- **"Review", everywhere the style is named** (the Orchestrator's call on his question, his to overrule): a mode name in the camera's voice beside Live and Disposable, naming where those photos go (her Review room). One change across Create, Settings' album style (`camera-settings.tsx`, `adds-page.tsx`), the words (`album-style.ts`, `wait-words.ts`) and the help (`review-uploads-before-they-appear.mdx`, `event-settings-explained.mdx`). Never `src/lib/admin/reports.ts`, where "Reviewed" is a report's status, not the style.
- **The develop time directly under the Disposable card** when it is picked (the first of his two placements), never under the night slider; say in your Handoff whether the slider still earns its place there.
- **Polish where it costs nothing** (create-wizard r4 is the polish round with F1 and F2 on his desk later), and the illustrations' tones as tokens (the brand round may re-tint them).
- **Ownership:** `src/app/(app)/dashboard/actions.ts` is `dashboard-wiring`'s: a line you need there is proposed through the Orchestrator. `docs/systems/host-app.md` is `hub-strip-wiring`'s: write your lines under your Handoff's proposals. Leave the board's folder (r4 is coming).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is his to overrule.

- **The develop time Create offers, with no date yet.** Recommended: 9 am tomorrow in the host's own zone (`defaultDevelopAt` with no date), said in the camera's words directly under the Disposable card (`develop-row.tsx`), any day within a year one tap away. The catch: a stored `develops_at` never follows the event's date (`defaultDevelopAt` runs only when a style or an answer is pressed), so a party weeks off develops tomorrow unless she moves it; the row says it plainly and there is no helper line. Overrule: ask the date in Create, or a "morning after" shortcut beside the row.
- **Does the night slider still earn its place there? Yes, kept under the cards.** It is the only thing that shows the morning after (every album whole, the reel's mark) and the step's one beat of delight (the night plays once as it opens); with the time under its own card it no longer competes with it. Overrule: delete `<Night>` in `add-step.tsx` and keep the autoplay.
- **The style's two extra columns ride the create's own insert** (`createEventSchema`, `createEvent`: two files outside `owns`, which the schema's own header gives to "the create wizard's later wiring"), never a second write after it, which would leave an event Live for a moment and could fail alone, against a style that is one save of all three columns. Overrule: a follow-up `updateEventAction` call from the wizard.

## System-doc edits (in place, owned facts only)

- none: this lane owns no system doc (`host-app.md` is hub-strip-wiring's, `disposable-mode.md` arrival-wiring's); the lines are the Handoff's proposals.

## Deferred (ROADMAP one-liners, bucket named)

- Create: a Library composition of the whole room (the wizard's `create` stand-in prop already draws it with no row written), so every screen, the add step's night included, can be pressed through with no session; this lane drew its own scratch harness to look.
- Settings: when the event's date is set or moved while the develop time is still the untouched 9 am tomorrow Create offered, offer to follow the date (a stored `develops_at` never follows `event_date`, so a Disposable made for a party weeks off develops tomorrow unless she moves it).
- Marketing: how-it-works' Create picture (`host-pictures.tsx`) draws three hairlines at the look; the room has four since the add step.

## Handoff (replaces the chat report)

- **Commits, pushed:** work `b9010f4b7` (the add step, Review, the plumbing, the picture, the help) and `dc2ccf8b1` (the develop row into view on a short screen, Space opens its picker, the tick's micro-pop), on `lp/styles-wiring` from base `2c6b68e7f`. **No sync commit:** launch-prep moved (small-fixes merged at `15b5b2f7f`) but none of its files is one this lane touched, and `git merge-tree` of the two says clean.
- **Gates on `dc2ccf8b1`** (the manifest commit after it is docs only), each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm format:check` 0, `pnpm test` 0 (894 files, 10,846 tests), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3132` 0 (151 checks), `pnpm lab:demo --base http://localhost:3132` 0 (the boards it reaches: create-wizard, drive-export, event-header, host-dashboard, identity, the-wait; 9 steps, 0 failing, only drive-export holds open steps).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and five exceptions, none claimed by a live lane (`src/lib/track-manifests.test.ts` green):
  - `src/lib/validation/event.ts`, `.test.ts` and `src/lib/db/mutations/events.ts`, `.test.ts`: the create carries `capture` and `develops_at` (Question 3);
  - `src/components/app/create-event-wizard.test.tsx` and `src/app/(app)/dashboard/new/create-flow.test.tsx`: the wizard's own tests, which a fourth screen changes (the owned prefix `create-event-wizard.tsx` does not reach `create-event-wizard.test.tsx`);
  - `content/help/create-your-first-event.mdx`: its three screens are four (`UiLabel` quotes pinned by `help-ui-labels.test.ts`).
- **The items:**
  - The add step, `add-step.tsx` + `night.tsx` + `develop-row.tsx` + `create-room.css`: three cards (Live, Review, Disposable), each a small album moving through the night, name, one line, tick, a soft light under the pick; the room has four hairlines; its question is the board's ("Pick your album's style"); a radio group with the arrows (`add-step.test.tsx`, 17 tests).
  - The develop time directly under the Disposable card, in place (a row of height that eases), `inert` while shut, the third column's own at a laptop; a native `datetime-local` lies transparent over the row (a phone's wheel, a desk's calendar, `showPicker`), judged by Settings' own `judgeDevelopTime`; a time that is no time, or has passed by the Create press, stops her on the add step in words under the row and sends nothing (`create-event-wizard.test.tsx` "the album's style at birth", 8 tests).
  - A new event is born with its style's three columns in one insert: `createFieldsOf(patchForStyle(...))` (`album-style.ts`) into `createEventSchema` and `createEvent`, which refuses approval with a develop in words and reads the CHECK by its name on an insert, where any CHECK would have read as the plan's event limit (`events.test.ts`, `event.test.ts`, `album-style.test.ts`).
  - "Review" wherever the style is named: `STYLE_NAMES`, comments in `wait-words.ts`, `camera-settings.tsx`, `adds-page.tsx`, the Settings test, the two owned help articles; `lib/admin/reports.ts`' "Reviewed" is a report's status and untouched.
  - One picture for Settings and Create (`camera-settings-style-picture.tsx`, `pictureCells` pinned), moving through arriving, the party and the morning after, its tones tokens (`--style-pic-*`, and the cards' `--cr-card-*`, `--cr-pick-glow-*` on `.cr-styles`) for the brand round; Settings' cards read the same (checked on the Library's Settings demo).
  - The pick drops into its hairline as the look arrives (`carry.ts`, `data-carry-pick`; `room.test.tsx` measures it; sampled in headless Chrome: the picture leaves its place and lands on the second hairline in 520 ms, nothing left behind); reduced motion cuts.
  - The night plays once as the step first opens (arriving, then the party after 900 ms), is stopped by her hand, and opens on the party under reduced motion; the six frames are preloaded while she names the event.
  - Help: `create-your-first-event.mdx` walks four screens; the two owned articles say Review and where Create asks it.
- **Verified live (the database) and in a browser of my own:**
  - A rolled-back insert as the host (`authenticated`, Pro, project `ddafaemglzmuekbtjwzn`): Live, Review and Disposable are taken (a camera's roll 24 and period stamped by `events_reveal_stamp`); approval with a develop is refused 23514 `events_approval_never_develops`; a past time is stored as now (hence the wizard's stop); `sealed_from` named is 42501; a leftover count of `zz styles-wiring check%` rows after: 0.
  - Headless Chrome against `:3132` (375 x 812, 375 x 667, 320 x 568, 768 x 1024, 1024 x 768, 1280 x 720, 1440 x 900): the whole flow to the beat sends `{capture: "camera", moderation_mode: "live", develops_at: <9 am tomorrow>}` for Disposable; the arrows choose the cards; a press on the row calls `showPicker` once with no error; the accessibility tree names the groups and shows the field only while its card is picked; no page scrolls at 1024 x 768 and up; on 375 x 667 the row is visible, and on 320 x 568 it is scrolled into view; console clean but for the look step's photograph preload, which now waits a screen longer.
  - **Not drivable from a lane:** the alias (no push deploys an `lp/*`), so the surfaces below are for the round's build and its red-team; and a real phone's wheel, below.
- **Assets requested from Will:** none.
- **Board ideas:** the Library composition of the whole room, and the date-follows-develop line, both above.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (the columns hold their INSERT grant since 20261002200000; no new SQL).
- **Calls his to overrule, one line each:**
  - The middle style is "Review", its line unchanged from the board ("You let each photo in before anyone sees it."): the name carries where the photos go.
  - The time is 9 am tomorrow, with no helper line; the slider stays; the cards go to three columns from 1024 px (at the board's 768 a card would be about 210 px wide), the pictures' height easing with the room's height.
  - A native picker behind a transparent field, not a visible field or two presets.
- **Look at first:** `/dashboard/new`, at a phone and at a desk: name, Continue, the night plays once; press Disposable and its time opens directly under it (Develops tomorrow at 9 am); on a real phone tap the row (the wheel is the one thing I could not drive); Continue, and the second hairline takes the pick; Create, then Settings, What guests can add: the album style as picked. Then Review (Settings, the hub's Review room) with a photo held.
- **Proposals for the system docs** (not mine to edit):
  - `docs/systems/host-app.md`, "Events and the create flow", first bullet: "the name, the code's look, then the beat" becomes "the name, the album's style, the code's look, then the beat", and after "It creates once, at commit": "The event is born with its style's three columns in one insert (`createFieldsOf` over `patchForStyle`, `lib/disposable/album-style.ts`), so Create and Settings write one thing; a Disposable's time is 9 am tomorrow (Create knows no date), judged by Settings' own `judgeDevelopTime`, and one that has passed by the Create press stops her on the add step." A ★ line beside it: "`createEvent` reads a CHECK by its name before its limit branch: any other CHECK violation on an insert reads as the plan's event limit (`events_approval_never_develops` is named)."
  - `docs/systems/disposable-mode.md`, the preset bullet: "Live, Reviewed, Disposable" becomes "Live, Review, Disposable", with "Create asks it too, between the name and the look, as the same three cards and the same columns (`createFieldsOf`); "Reviewed" is a report's status only (`lib/admin/reports.ts`)".
