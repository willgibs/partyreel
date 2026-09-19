---
track: app-shape
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "6acf34e8"            # the launch-prep SHA the branch was cut from
board: app-shape        # round one: the host app's SHAPE from the foundation
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/app-shape/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - src/components/shared/app-shell.tsx
  - src/components/shared/page-heading.tsx
  - src/components/shared/container.tsx
  - src/components/app/dashboard/dashboard-feed.tsx
  - src/components/app/dashboard/filter-chips.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/components/app/event-feed/event-filter-pills.tsx
  - src/components/app/event-feed/event-feed-action-bar.tsx
  - src/components/app/dashboard/storage-meter.tsx
  - src/components/app/user-menu.tsx
  - src/components/reel/reel-studio.tsx
  - src/lib/dashboard/filters.ts
  - src/lib/event/sections.ts
  - src/app/(dev)/design/sandbox/admin/spec.ts
---

# lp/app-shape

**Goal.** Round one of `app-shape`: the host app reconceived from the FOUNDATION, its shape first, the way the
`admin` board rethought the portal. Will (2026-09-19, `docs/design/rulings.md`): "Let's treat the full app
experience as well as guest pages as unprotected. Anything and everything is open to relitigate or reconcept from
the ground up to begin establishing a better system from its foundation. The existing version is closer to a
Frankenstein's monster as we were trying to integrate new features ideas 1 by 1, rather than having a complete
idea of the full app from the beginning." Six to eight decisions with `defineExploration`, each drawn on the real
components with FIXTURES (a host with three events, one waiting review queue, one reel, a few guests, an at-cap
storage meter) at 1440 AND 375 (a host is on a phone as often as a laptop), a recommendation each, every number
measured. **Not in this round:** any production byte, the vocabulary under the shape (empty states, skeletons,
the tile grammar and bulk toolbars: `app-vocabulary`), the guest pages (`guest-shape`).

**What is measured (the tree at the cut).** Seven routes (`/dashboard`, `/dashboard/new`, `/dashboard/[eventId]`,
its `/settings` and `/reel`, `/account`, `/welcome`) behind one sticky header with a logo and a user menu and no
navigation; the host's home is one continuous feed switched by six chips (All, Events, Following, Uploads, Likes,
Deleted) that mixes their events with their own uploads, likes, follows and a bin; the event page is the same
feed shape switched by five pills (All, Review, Gallery, Reel, Guests), urgency-ordered, with a command strip
(Share as a modal, Add photos, Settings as a route) and a floating action bar; settings is one long column of
cards ending in a second, unrelated "Deleted" bin (media, with a purge-now the events bin lacks); the reel is a
full-bleed studio with its own X; billing has no home (a popover on the storage strip); social is scattered over
four places with an unlinked "go to Account settings"; three back-navigation idioms; four query-parameter names for
"which tab"; two `?filter=`/`?section=` legacy tables; no `@contract-for` test under `src/components/app`.
`docs/systems/host-app.md` describes the shape as it was one feature ago. Fourteen seams are listed in the
Orchestrator's exploration of 2026-09-19 (`docs/tracks/orchestrator.md`, the app round's announce); read them.

**The decisions (suggested; yours to recut, never forced apart).** The host's HOME (their events only; an inbox
of everything as today; a front page that says what needs them); the EVENT as a place (the urgency feed as
today; a hub of rooms; the studio's model generalised, one full-bleed room per job); the CHROME and navigation
(a header with a menu as today; a rail on a laptop and a bar on a phone; breadcrumbs that replace the three back
idioms); where SHARING lives (the modal; a room; the event's front); where SETTINGS live (the column of cards; a
sheet beside the event; sections in the hub); where MONEY and the ACCOUNT live (a plan card in Account; the storage
strip as a real destination; as today); the PHONE (the same shape narrowed; a different shape for a thumb);
DENSITY (cards; lists; the operator's answer from the admin board). The `admin` board is the worked example for a
shape board on real components with fixtures; `gallery-width` for the spec's form.

**Binds.** The bible (media is the colour, one token set, the ladders); the guest pages' rulings do not bind the
host app but the app is one brand with the marketing site (bible 2); the `type-ladder-policy` keeps `PageHeading`
on one class; the security seams (RLS, `getUser()`) are out of frame; no em-dashes; the copy is open (bible 21).
Mobbin (the MCP) is encouraged, never required: photo apps, event apps, creator dashboards.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board app-shape` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 1440 and 375 on the real components with fixtures; the reading budget; a capture of every option
  beside its words, the picture checked against the words.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

The eight decisions ARE the questions and every one carries its recommendation on the board. These four are the
ones the board could not ask him, each with the answer the lane proceeded on:

- **Is a host ever running more than three events at once?** Every recommendation on this board assumes one to
  three live events and a handful more retired. Recommended answer: **yes, rarely, and the shape must survive a
  dozen** - which is why the row density wins over the wall and the rail keeps its overrule. If a host is normally
  running eight, the rail and the wall both get stronger and the breadcrumb gets weaker.
- **Does the host app want notifications at all?** Every chrome here draws a bell because the shape has to reserve
  the room, and nothing behind it ships. Recommended answer: **reserve it and do not build it this round**; a
  notifications board belongs after the shape is ruled, not inside it.
- **Should the personal feeds (Uploads, Likes, Following, saved events) survive the move to You, or be cut?** They
  are guest-side features living on a host page. Recommended answer: **survive, under You**, because a host is a
  guest at other people's events and account-from-guest depends on that being true. Cutting them is a product call,
  not a shape call.
- **"Saturday evening" as the home's heading** (the `pulse` option) is placeholder copy standing in for whatever the
  `voice` board rules; it is judged for its size and wrapping, not its words (docs/PROGRAM.md). Recommended answer:
  **the pick is the shape, not the greeting.**

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- **Lab** - `defineExploration` should dedupe a `configs` knob shared by several decisions by id; every board that
  shares one (gallery-width, now app-shape) filters the duplicates by hand in its own spec.
- **Lab** - `defineExploration` defaults every control to its decision's RECOMMENDATION, which makes every OTHER
  decision's "as today" option draw a candidate. A board can override the defaults (this one does, `TODAY` in
  `spec.ts`), but the constructor could take a `today` field per decision and do it for everyone.
- **Lab** - a step reached by URL while still staged behind an unanswered `after` renders its head as "step 28 of
  27" (`step.tsx` line 440, `walk.length + 1` for a step outside the walk). Harmless in a real sitting, confusing
  in a capture run.
- **App** - `src/components/app` still has no `@contract-for` test of any kind (seam 13 of the app round's map);
  whichever wiring round lands this board's answer should bring the first one with it.

## Handoff (replaces the chat report)

- **Head:** the tip of `origin/lp/app-shape`. The CODE head is the merge `7a7ccd11` and every gate below ran on it; the commits after it touch this manifest and nothing else. Synced (`git merge origin/launch-prep` at `53d08570`, no rebase;
  one conflict, the generated `docs/design/library.md`, resolved by regenerating).
- **The gate on the synced tree, each on its own exit code:** `pnpm design:rules` 0 · the specimen collector 0 ·
  `pnpm typecheck` 0 · `pnpm lint` 0 (the 8 known warnings, none in this lane) · `pnpm test` 0 (2,471 passing) ·
  `pnpm build` 0 · `pnpm lab:smoke --base http://localhost:3135` 0 (273 checks, 0 failing; the board reads 478
  words of its 1,200 budget) · `pnpm lab:demo --board app-shape` 0 (**8 steps, 0 failing**; every step draws its
  options, the stage moves by 45 to 85 percent, tallest 1.6 screens, wordiest 334 words). `DESIGN_PREVIEW_KEY` rode
  the environment throughout and appears in no log, commit or line here.
- **The lane check** (`git diff --name-only origin/launch-prep...HEAD`):
  ```
  docs/design/library.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/app-shape/account.tsx
  src/app/(dev)/design/sandbox/app-shape/board.tsx
  src/app/(dev)/design/sandbox/app-shape/chrome.tsx
  src/app/(dev)/design/sandbox/app-shape/event.tsx
  src/app/(dev)/design/sandbox/app-shape/fixtures.ts
  src/app/(dev)/design/sandbox/app-shape/home.tsx
  src/app/(dev)/design/sandbox/app-shape/spec.ts
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Seven of the eleven are the board's own directory (`owns`). Three are the registration exception, and BOTH sides
  are kept on every line of them: `gallery-width` left `BOARDS`, `BOARD_COMPONENTS` and `SandboxId` with its wiring
  and `app-shape` joined, while `gallery-width` keeps its RULINGS row (it is ruled, not deleted). `library.md` is
  the generator's artifact (`pnpm design:rules`), and its only change is the board count and this board's row. **No
  production byte.**
- **The eight decisions, one line each** (the recommendation in bold):
  1. `home` - what /dashboard opens on: the inbox of everything as today · her events alone · **what needs you,
     then what just arrived**. It decides whether the personal feeds stay on the home at all.
  2. `density` (after `home`) - how much room one event takes: today's cover card · **a row with the cover behind
     it and the counts in columns** · a wall of its newest photographs.
  3. `event` - what an event's page is: today's urgency-ordered scroll · a front page with a door into each room ·
     **the album is the page**, with Review, Reel, Guests and Settings as rooms.
  4. `nav` (after `event`) - how seven routes are reached and what the way back is: today's bar and menu · **a
     trail in the bar with the rooms under it** · a 232 px rail of your events and their rooms.
  5. `share` (after `event`) - where the QR and the link live: today's dialog · a room of its own · **on the event
     itself, always there**.
  6. `settings` (after `event`) - where an event's settings live: today's page of cards · **a sheet beside the
     album** · each setting beside what it governs.
  7. `you` - where the plan, the profile and her own photographs live: today's popover and four places · **one
     You** · the Account page plus a plan card.
  8. `phone` (after `nav`, drawn at 375 whatever the knob says) - the shape in a hand: today narrowed · **a bar at
     the bottom, in reach** · one shape at both sizes.
- **What the board measures rather than claims.** Every caption reads the laid-out page inside its own frame
  (`chrome.tsx`, `Measure`): the working room, and the album's real column count and tile width. The numbers that
  carry an argument: today's page gives the album **1216 px and 5 columns of 240**; the album-as-page gives it
  **1400 px and 6 columns of 230**; the rail costs **1168 px and 5 columns**, which is one whole column of
  photographs spent on navigation, and is why the breadcrumb is recommended over it now that galleries run to the
  window. At a phone: **343 px** of room under today's shell, **351** under either candidate.
- **The sync changed the board, which is the point of syncing.** `gallery-wiring` landed mid-round, so the
  candidate stylesheet this board was drawn against (a 220 px column in place of the hard-coded count) was deleted
  rather than left to rot beside the shipped `GALLERY_COLUMNS`; the `w-screen` bleed trick became the shell's own
  `data-app-wide` flag; and the review queue now wears the shipped `GALLERY_UNIFORM_COLUMNS`. `.as-grid` survives
  as a marker with no stylesheet behind it: it tells the caption which grid is the album.
- **Three defects the capture pass caught, all one bug.** Reading the 24 captures against their own words found
  "one urgency-ordered scroll, AS TODAY" drawn carrying the candidate share block, "the inbox of everything, as
  today" drawn in candidate rows, and the share dialog scrimming every step that was not about sharing:
  `defineExploration` defaults each control to its decision's recommendation, so every "as today" option was drawn
  in a world that does not exist. Fixed at the source (`TODAY` in `spec.ts`), plus a fourth: the caption counted
  every thumbnail on a page as a gallery column and reported "15 columns of 96 px" on a home with no gallery.
- **Mobbin, read and leaned on:** [Posh](https://mobbin.com/screens/3fad44f7-7615-425b-accb-68cd6e60007b) for the
  row density (the cover photograph behind the row rather than beside it, counts in their own columns);
  [Riverside](https://mobbin.com/screens/6b8d37c6-06f4-4dc5-91ef-0012ed598168) for a cheap rail with the studio
  door parked in its corner; [Partiful](https://mobbin.com/screens/ec636758-83f4-4b52-9c1d-be60acce7f64) for
  today's shape done well, and for what it pointedly does NOT mix into its chips.
- **Captures:** `/private/tmp/partyreel-captures/app-shape/<decision>-<option>.png`, 24 of them, each the whole
  step at 1440 with the question, the stage head naming the option and the dock in frame. `lab:demo` compares but
  writes nothing, so the script is the admin lane's method rebuilt:
  `/private/tmp/claude-501/.../scratchpad/capture.mjs` (scratchpad, not the repo; the key rides the environment).
- **Assets asked for:** none. The fixtures are the twelve marketing stills declared at phone aspect ratios, which
  the Higgsfield month replaces by id.
- **System-doc edits:** none (lab-only).
- **Look at first:** `/design/lab/app-shape`, step 3 (`event`). The three event pages on the same Saturday night
  are the whole round in one screen, and the measured room under each frame is the argument the other seven
  decisions inherit. Then step 1, which is the same question asked of the home.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of the host app came back as eight decisions on one
host's Saturday night rather than a plan: what the home opens on, how an event draws on it, what an event's page
is, how seven routes are reached and what the way back is, where sharing and settings live, where the plan and a
host's own photographs live, and what shape the app takes in a hand. Every option was drawn on the shipped
`AppShell`, `EventCard`, `FilterChips`, `StorageMeter`, `EventFilterPills`, `FeedSectionHeader` and
`MasonryColumns` at 1440 and again at 375 through one window knob, with every caption measured inside its own
frame: the album-as-page gives the photographs 1400 px and six columns where today's page gives 1216 and five,
and a rail costs a whole column. Reading the 24 captures against their own words caught every "as today" option
drawn wearing a candidate, which was one bug in how the constructor picks its defaults, fixed at its source.
