---
track: create-wizard-wiring-2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard.tsx
  - src/components/app/create-event-wizard.test.tsx
  - src/components/app/create-event-wizard/
  - src/app/(app)/dashboard/new/
  - src/lib/events/readiness.ts
  - src/lib/events/readiness.test.ts
  - src/components/app/event-feed/checklist.tsx
  - src/components/app/event-feed/checklist.test.tsx
  - src/components/app/event-uploads.tsx
  - src/components/app/event-uploads.test.tsx
  - src/lib/dashboard/stage.ts
  - src/lib/dashboard/stage.test.ts
  - src/lib/dashboard/attention.ts
  - src/lib/dashboard/attention.test.ts
  - src/components/app/event-settings/settings-rows.tsx
  - src/components/app/event-settings/settings-rows.test.tsx
  - src/components/app/event-settings/camera-settings-style-picture.tsx
  - src/components/app/event-settings/camera-settings-style-picture.css
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.test.ts
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/share/event-code-door.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-header.test.tsx
  - src/components/guest/guest-name-menu.tsx
  - src/components/guest/guest-name-menu.test.tsx
  - src/components/guest/guest-account-menu.tsx
  - supabase/migrations/20261008050000_create_like.sql
  - src/app/(dev)/design/sandbox/create-wizard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - docs/reviews/signature.json
  - docs/reviews/after-party.json
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/PRD.md
  - src/app/(guest)/e/[token]/card/route.tsx
---

# lp/create-wizard-wiring-2

**Goal.** Create as Will picked at create-wizard r5: its close the payoff carrying her code into her event with a link card beside the QR, a new event ready from its first minute, the styles told apart calmly, its room dark until her code, and a guest's way into Create in an album's style.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3132 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/create-wizard.json` round 5; the board `src/app/(dev)/design/sandbox/create-wizard/` draws each option, `entry.ts` the flight's stand-in):**
- **`close=enter`:** the beat's line says share it, under the question; Print and Share under her code; Go to your event opens the room into her event, her code flying to its place (the hub's code door already carries `view-transition-name: pr-event-code`, `CODE_MORPH_NAME` in `share/event-share-provider.tsx`: a matching-name view transition, under reduced motion a cut). **His addition:** "a mini compact link/share card beneath the QR (maybe at the same width for smooth alignment, but may need wider) ... a polished design of what you'd kind of expect to send/receive in a group message with an easy one-tap to copy", with little or no instruction: draw it as the message guests receive (the album's own card image from `/e/[token]/card`, its title and the link), one tap copying the link, so it follows on its own when the card is redrawn later.
- **`arrival=done`:** a new event counts as ready, since guests can get in and add; the code's first open stops being essential, and its share leads what is worth doing. The checklist on her hub is one line, Ready for guests, with the share beside it (`ChecklistLine`, folded, already exists); how the checklist enters the event is the event-page board's (this wave), so draw no more than the line. The ripple: the dashboard's stage (`lib/dashboard/stage.ts`'s ticks), its attention line (`attention.ts`), Settings' rail (`settings-rows.tsx`), the hub's `stepsLeft` and `checklistOver`, and their tests. Fold Immediate's "Code hygiene: the hub (`dashboard/[eventId]/page.tsx`) and the dashboard" (read `storageUsedPct`) and "Code hygiene: Settings' rail maps its steps" (read `SETTINGS_STEP_ITEMS`). Call G3 (the get-ready checklist "stays atop an event until it is done or until the day after the event's date") changes with this: say in your Handoff what the checklist now holds and when it leaves, so the Orchestrator retires G3 and writes its successor if it passes the calls test.
- **`previews=one`:** three cards resting on the moment they differ; only the picked card plays its story once, its moment named on it, then rests; no slider (`night.tsx` goes). `StylePicture`'s props stay (Settings' `camera-settings.tsx` uses it).
- **signature r1's `create=dark` (`docs/reviews/signature.json`):** every step still and unlit; the room's first light is the code's, lit once in the event's seed at the close. Override the lamps locally in `create-room.css` or `room.tsx`; never `globals.css` (brand-marks-wiring's) or `marketing/system/section-light.tsx`.

**after-party r1's bridge, its way in (`docs/reviews/after-party.json`, `bridge=end`):** Will: "I love how easy this makes it for guests to go straight into becoming a host rather than dropping them off in marketing." Build Create's like-entry: `/dashboard/new?like=<album token>` opens Create in that album's style (its mode and look; nothing private crosses: a token the visitor could open) and asks only her name; a signed-out visitor signs up first and returns there. Then the guest header's corner (`guest-header.tsx`, only where an event token is in hand, so the profile page keeps Start for free) and a row in her name menu (`guest-name-menu.tsx`, and `guest-account-menu.tsx` for a signed-in account) say "Make one like this". The line at the album's end is the event-page board's. `as-guest-view.tsx`'s `GuestBar` mirrors the corner in the host's preview: it is crumbs-91's file, so list that one-line mirror as an exception. If the token's style needs a read the page lacks, the migration is `supabase/migrations/20261008050000_create_like.sql`, through the Orchestrator.

**The board's carried calls, as taken:** no kind of party asked; the room opens into her event; the empty album's voice ("The album starts with you", Add the first photos its one door); the close's X goes where the foot goes into her event and stays elsewhere.

**ROADMAP lines you close (quoted by their opening words):** Immediate's "Create: the beat shares \"Add your photos and videos to\"" (say what the plan takes) and "Create: the name field draws a box at rest"; and Upcoming's "the event-limit sheet says", "the checklist's code row ticks only on the next render", "one label for creating an event", "Upgrade loses the draft", "a `swatch` atom for Create's looks", "`checklist.tsx` and Settings' cards hand-roll a ringed card", "the QR ask's two wordings" (each where your change meets it; the rest stay).

**Retire the create-wizard board:** its three picks are yours, so delete `src/app/(dev)/design/sandbox/create-wizard/` in your branch; the Orchestrator deletes its ledger at your record.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
