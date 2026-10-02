---
track: create-wizard
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "10705484"            # the launch-prep SHA the branch was cut from
board: create-wizard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - src/components/app/create-event-wizard.tsx
  - src/app/(app)/dashboard/new/page.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/lib/constants/qr-presets.ts
  - src/app/(dev)/design/sandbox/disposable-mode/
---

# lp/create-wizard

**Goal.** Open the create wizard's redesign board: the whole wizard, minimal and image-led, including the disposable mode's choice step (a named redraw of create=cards with his deeper compare) and Create's hand-off into Settings.

## The brief

**Why.** Will, on `disposable-mode`'s `create` (answered `cards`, 2026-10-02), verbatim:

> The pictures help immediately visualize the distinct experiences, with light copy to clearly define. Should also have an option to compare more deeply somehow. However, the entire create wizard, including this screen, needs to be redesigned and polished. Lots going on. Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now.

**The wizard today** (`create-event-wizard.tsx`, 569 lines):
1. **Name:** one field, about 18 words of helper text.
2. **Style:** four QR swatches and a samples note, about 50 words.
3. **Ready:** since tonight's ready-wiring, the code, what's left, and "Get it ready" into Settings' step 1.

Its cap door (at the plan's limit) replaces it.

**Asks, yours to shape:**
- The wizard's shape.
- The mode step, choosing the album or the disposable camera. Disposable mode isn't built yet, so draw the step it will be. It is a named redraw of `disposable-mode`'s answered `create=cards`: say so in its `earlier`, and keep his deeper compare.
- The hand-off moment.

**The direction, one for every board this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential,** with the disposable-mode boards' creativity as the bar. On those boards: "These are so much cooler than the current host dashboard, standard event pages for both host and guest, and other areas of our app. Really creates a bespoke, experiential feeling. Going off my previous notes about wanting to redesign most of our app and especially breaking away from the shadcn generic AI build feel, this is the kind of creativity I like to see."
- **Sleek and modern,** never vintage ("our far more modern app design, which is only getting sleeker as we iterate").
- **Sophisticated, never playful-messy:** "for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events".
- **Minimal yet high-information,** with far less text ("Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now").
- **The bible's ten** (`/design/library`): media is the color, premium is the floor, elegant simplicity.
- **His role:** "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Draw your boldest real contenders, as far apart as the real answers are.

**Who asks what tonight, so no two boards ask one decision:**
- `identity` owns the atoms: buttons, fields, chips, cards, sheets, menus, toasts, tooltips, avatars, and the controls' materials, type and motion.
- `host-dashboard` owns the dashboard page.
- `event-header` owns the hub's head and the guest album's head.
- `create-wizard` owns the create wizard.
- `locked-door` r3 owns the door's reveal and idle loops.
- `disposable-mode` r3 owns the disposable camera, its waiting room and its save.
- `demo-framing` r3 owns the home hero's stage and the demo's door.

A page board draws composition, layout, hierarchy and its page's own expression in production's atoms. It names any new atom an option needs, and spends no option on a button's style.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/create-wizard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `create-wizard`, its title, `surface`, `desk: 60` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Do `mode` and `hand` wait on `shape` (`after`)? Built: no. Each is its own decision in any shape and draws in whatever
  shape the board holds (his pick once made, the room until then), so a shape he leaves open (the broadest ask, the
  likeliest to come back as a note, as `disposable-mode`'s camera did and held two asks with it) holds nothing out of
  the walk. Overrule: stage both after `shape`, so they are only ever judged in his shape.
- Does `shape` draw today's wizard as an option? Built: no; he asked for the redesign, so the three are real contenders
  and each frame's caption counts the words a host reads instead. Overrule: a fourth option, today's screens as built.
- Which mode is picked as the camera's step opens? Built: the album (a new event's mode until she picks), the camera
  one press away.
- How would the `scan` beat know the code opened? Built at rest: the wiring reads the event's link opens while the beat
  is open, the same light read ROADMAP's checklist line asks for (`event_link_totals` while the code row waits).
- The three carried calls (`sample`, `defaults`, `room`) are on the board, each built on its taken answer.

## System-doc edits (in place, owned facts only)

- none (a lab board: no production byte, no system fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- Now, the lab and the kit: a portalled frame carries no glow filter host (`GlowFilter` mounts once, in the root
  layout, which is the lab page's document: the page holds `#glw-warp` and a frame's document does not, measured), so
  a board cannot draw production's `Glow`, `SectionLight` or `ScreenLamp` in a frame and draws its light as plain
  gradients instead (`create-wizard.css`); a filter host mounted in each portalled frame would let a board draw the real
  light (from `create-wizard`).
- Now, tests: `src/components/social/relation-toggle.test.tsx`'s "every other flip acts at once" failed once in a loaded
  full run (no call to the follow spy at 1,048 ms) and passed alone 3 of 3 and on the rerun; more room in its wait, or
  fake timers, would steady it (from `create-wizard`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/create-wizard`:** `757fb973` (the board), `9cd90ab8` (fitted and lit), `28309924` (the
  compare and the beat unstaged from the shape), then this manifest. No sync: launch-prep moved to `6755a2a5`
  (mkt-wiring, door-wiring, build 40, records), touching none of this lane's `reads` nor any file the board imports,
  and `git merge-tree` merges it clean.
- **Gates on `28309924`, each its own exit code** (`../partyreel-wt/_scratch/create-wizard/gate-final.log`, a log per
  step beside it): typecheck 0; lint 0; test 0 (740 files, 8,784 tests; `final-test.log`); build 0 under the lock
  (`final-build.log`); `lab:smoke --base http://localhost:3134` 0 (5 checks, 0 failing, the board's reading 669 of
  1,200 words; `final-smoke.log`); `lab:demo --board create-wizard` 0 (3 steps, 0 failing, measured at 1440 and 375
  under reduced motion; `final-demo.log`), and 0 again wearing `--state screen=1440` (`final-demo-1440.log`). The
  first full test run on `9cd90ab8` failed only the social flake above (`gate.log`); its rerun was green.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the ten files of
  `src/app/(dev)/design/sandbox/create-wizard/` + this file; no exceptions.
- **The board** (`create-wizard`, host, desk 60): three decisions over Maya & Jay's wedding, every option drawn at a
  phone and a laptop (the Screen knob, 375 by default) from production's atoms (`Button`, `Logo`, `Avatar`, `Container`,
  `PhoneShell`, `StyledQr`) and production's readiness (`readiness(newEventFacts(...))`, `readyHead`,
  `SETTINGS_GROUP_TITLES`, so the beat's rail is the call the wizard makes). Each caption reads the words a host reads
  on that screen (pictures' own type aside), the picture's size and where the action sits.
- **`shape`** (recommends `screen`): a quiet card in the app; a room of its own (the whole screen, dark in both themes,
  a hairline of four, one button at the thumb, the light a seam at its foot); a studio (the steps stacked and folding to
  their answers beside a stage where the code and a guest's phone change as she picks). Four screens each; words read,
  measured: the room 7 / 27-37 / 16-20 / 43-55, the card 11 / 34-38 / 21 / 47, the studio 18-25 / 39-46 / 22-29 / 61-74.
- **`mode`** (recommends `night`, his `create=cards` redrawn, named in `opening.earlier`): two pictures of a guest's
  phone with a line each and the camera's two defaults once picked, plus the deeper compare three ways: rows unfolding
  under the cards; a slider moving both cards from 8 pm to the party to 9 am; both nights as six pictures in a sheet.
- **`hand`** (recommends `scan`): what stands beside the code, Settings' rail of five always under it: the code alone
  and lit; the code asking for a scan (Open it as a guest on a phone), then ticked ("The code works", Ready for guests,
  3 of 5); the code beside a phone showing what a guest opens, in the album and in the camera.
- **What a drawing is not:** the camera, its waiting room and its premiere are plain stand-ins in `disposable-mode`'s
  settled numbers (24 shots, 9 am), never deciding r3's camera; the photographs are the marketing stills; the light is
  gradients in the lamp hues (the Deferred line above); nothing is wired.
- **Assets requested from Will:**
  - Maya & Jay's wedding as a guest's album · 12 photographs of one wedding's night, one grade, 1080x1350 (4:5) JPEG;
    each legible as a 50 px square (the rows crop them 1:1), one surviving a 16:9 crop with "Highlight reel" on a dark
    fade at its bottom left; ceremony to dance floor · replaces `ALBUM_STILLS` in
    `sandbox/create-wizard/fixtures.ts` (the marketing stand-ins), then the camera step's album pictures in the wiring
  - The venue before anyone shoots, as the camera's viewfinder · 1 photograph, 1080x1350 (4:5), early evening, its top
    and bottom fifths quiet (the event's name and the develop time over the top, a shutter ring at the bottom centre)
    · replaces `ARRIVING` (`wedding-arch`) in the same file; row 35's six disposable stills serve the developed roll
    (`VIEWFINDER`) once delivered
- **Board ideas:**
  - The printed table cards print the Classic shape whatever style Create picked (`print-stock.tsx`'s `FooterQr`, a
    documented trade), so the style step introduces a look the table never wears; a DOM-free renderer for the four
    presets (their finder and dot shapes as paths) would let paper wear it.
  - The style step's sample link (`/e/` and 32 zeros) opens a 404; a page of its own that says it is a sample would let
    the step drop even its one word (the `sample` call's overrule).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - `shape=screen`: a once-an-event moment earns the whole screen (the card if Create should feel part of the app).
  - `mode=night`: the two differ most in when everyone sees the photos (the sheet if both nights should show whole).
  - `hand=scan`: a new event lacks only an opened code (the code alone, lit, if the beat stays one quiet look).
  - `sample`: one word, Sample, on the code's plate in place of today's sentence.
  - `defaults`: two of the camera's defaults in Create (24 shots, develops 9 am); the look waits on `disposable-mode`'s
    save.
  - `room`: the room is dark in a light session too.
  - Nothing staged (Questions, first line); no today option (Questions, second line).
- **Look at first:** `/design/lab/create-wizard?session=create-wizard.shape` (the room's four screens at a phone, then
  1440 on the knob), then `create-wizard.mode`'s "The cards, playing the night" slid to the morning, then
  `create-wizard.hand`'s "The code, asking for a scan" and its opened frame.
