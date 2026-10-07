---
track: create-wizard-wiring-2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The checklist's dismiss (Will's G3 answer, scoped by the coordinator):** built: the one line carries a quiet dismiss;
  once dismissed it stays gone for that event (a return each session would show a confident host the same line every
  visit, and anything that truly needs her already says so in its own needs-you place: the door's corner, Review's
  count, a paused code), kept in her browser as a cookie on the event's own pages (`pr_checklist_off`, Path
  `/dashboard/<id>`, 400 days) rather than localStorage, so the hub's first paint never draws a dismissed line and the
  album never jumps up under her once a script reads it; no column (advice that blocks nothing). Overrule: it returns on
  her next session.
- **A Disposable album's like:** built: Create keeps the Disposable's own screen (three steps, not two), since its
  develop time is her party's and never the album's; the album's roll rides. Overrule: ask only her name and make it
  with Create's 9 am tomorrow.
- **Which albums lend their style:** built: any album whose door does not shut the visitor out (`pageDoor`'s decision is
  not `shut`: an open album, a password one, a gated one she stands at). Overrule: only albums she has been let into.
- **How a signed-out guest comes back to Create:** built: the like door keeps the token 30 minutes in a cookie only
  Create's page is sent, through sign-up and the welcome's naming step (a sign-in return carries a path and never a
  query, and `/welcome` keeps no return of its own). Overrule: a path return on the sign-in allow-list, with the welcome
  taught to return there.
- **Where the corner says Make one like this:** built: wherever the header holds an event's token (the album, its
  welcome door, the demo, and the shut door, where the album lends nothing and Create opens plain); the profile page
  keeps Start for free. Overrule: only where the album is in view (Deferred: it needs a word from crumbs-91's page).
- **The dashboard's week before a party's day:** built: a ready event whose code nobody has opened still says "Code
  never opened" with Invite as its one item (the share leads what is worth doing). Overrule: Ready for guests until the
  print the day before.
- **The line's door once the code is opened:** built as the board drew `done`: the line names the next thing worth
  doing (Add photos, then the welcome's Add them). Overrule: the share stays its door whatever is next.
- **Share on a laptop:** built: the Share round stands only where the device has its own sheet; elsewhere the link card
  above it is the copy, never a second copy control. Overrule: Copy link as the round's fallback, as before.

## System-doc edits (in place, owned facts only)

- `host-app.md`: "The sole create path" (the cards' rest and the picked one's story; the unlit room, the code's seed
  light); "The beat happens once" (the payoff: the line, her link, Print and Share, Go to your event, the entry on the
  code's morph name, the close stepping aside); a new "Make one like this" line; "The checklist is one line" (ready at
  birth, `readyNext`, the dismissal, when it leaves, the empty album's voice).
- `dashboard.md`: "The stage" (its essentials: the door, uploads, room once full) and "One item an event" (the code's
  share, worth doing, its one item).
- `guest-flow.md`: "Auth-aware header island" (the corner on an album, and its rows in both menus).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · The host app: Host: the guest header's corner says Make one like this on a shut door too, where the album
  lends nothing and Create opens plain; the shut branch of `e/[token]/page.tsx` could hand the header a word
  (create-wizard-wiring-2).
- Upcoming · Code hygiene: `event-settings/settings-pages.ts`'s head still lists Create's Get it ready among the links
  into a Settings page; Create's foot is Go to your event now (create-wizard-wiring-2).

## Handoff (replaces the chat report)

- Work commit `17259037a`; sync commit `c98ca87ea` (merges origin/launch-prep at `f0623106f`); both pushed; the head
  is in the chat line.
- Gates on `c98ca87ea`, each on its own exit code: typecheck 0; lint 0 (no warning); test 0 (1,100 files, 13,992
  tests); build 0 (`/dashboard/new/like/[token]` in its route table); `pnpm lab:smoke --base http://localhost:3132` 0
  (187 checks, 0 failing). Before the sync the suite's one failure was `calls.test.ts`'s 31st-entry pin, launch-prep's
  own, which the sync brought fixed.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is owned paths and this file, plus: the three
  `docs/systems/` files above (System-doc edits); `content/help/create-your-first-event.mdx`,
  `day-of-checklist-for-hosts.mdx` and `why-an-event-asks-for-your-email.mdx` (help tracks shipped reality:
  `help-ui-labels.test.ts` refuses "Get it ready", which no control says now; the checklist's line and the album's
  corner told anew); the Library's `compositions/create-room-demo.tsx` and its test (its Create room holds the new foot
  by its tracked name, `go-to-event`, so a press never pushes the lab into a hub) and one line of
  `compositions/gallery-demos.tsx` (crumbs-91's: that room's lede); `dashboard/stage.test.tsx` and
  `event-settings/event-settings-sheet.test.tsx` (each pinned a new event's head as not ready; reshaped with their
  scars); `share/as-guest-view.tsx` (crumbs-91's: the GuestBar mirror of the corner, its words and its comment) and one
  line of its test.
- `close=enter`: the beat's line under the question, her link under the code as guests receive it (`BeatLink`: the
  album's own `/e/<token>/card?add`, `openAlbumWords`' title, one press copying the permanent link), Print and Share
  (Share only with a device sheet; its message names videos only on a plan that takes them, closing Immediate's line),
  Go to your event (a `Link` that prefetches the hub in full; `entry.ts`: the plate takes `CODE_MORPH_NAME`, a native view
  transition under a 1.2 s ceiling, a plain push under reduced motion, a hidden tab or no API), the head's close gone
  once the event exists (`beat.tsx`, `create-event-wizard.tsx`, `entry.ts`).
- `arrival=done`: `readiness.ts` (ready answers whether a guest could get in and add, so the code's first open is worth
  doing and leads it; `readyNext`; `stillNeeded` and `CODE_STILL_NEEDED` gone); `checklist.tsx` one line, Show for the
  list (worth doing first once ready), a quiet dismiss; `stage.ts`' ticks are the door and uploads; `attention.ts` keeps
  the code's share as the week's one item; Settings' rail reads `SETTINGS_STEP_ITEMS` on the flat `Card`; the Settings
  card counts none on a new event; the hub and the dashboard read `storageUsedPct` (both Code hygiene lines closed).
- The checklist's rule, G3 retired by his answer: the hub's checklist is one line, Ready for guests from the minute
  Create makes the event, the next thing worth doing beside it; it leaves on a later visit once nothing is left, from
  the day after the event's last day, or when she dismisses it, which keeps it gone for that event in her browser and
  never brings it back.
- `previews=one`: `camera-settings-style-picture.tsx` draws the rest (Live all in, Review all but two under a clock, the
  Disposable's camera and roll in its first frame) for Create and Settings alike, through `StylePictureFrame`
  (`StylePicture`'s props unchanged); `style-story.ts` plays the picked card once, named, after a pick stands 280 ms;
  `night.tsx` deleted.
- `create=dark`: every screen unlit (`RoomGround`'s default `none`, the pick's lamp pool gone); the code's light is the
  event's seed (`seedLight`: `orbFor` of its id), lit once.
- `bridge=end`: `like.ts`, the like door (`dashboard/new/like/[token]/route.ts`), Create's page reading the album
  through `pageDoor` and lending the style alone (`likeOf`), the wizard's carried steps and chip with Change, the
  corner and both menus' rows, the GuestBar mirror. No migration: the read exists, so `20261008050000_create_like.sql`
  went unwritten.
- Carried calls as taken: no kind asked; the room opens into her event; the empty album says "The album starts with
  you", Add the first photos its one door (`event-uploads.tsx`); the close's X steps aside where the foot goes in.
- ROADMAP: closed: Immediate's beat share line and name field box, both Code hygiene lines. Narrowed: the ringed card
  (`checklist.tsx` and `settings-rows.tsx` wear the flat `Card`; `settings-furniture.tsx`, `delete-event-row.tsx` and
  `attended-events-visibility.tsx` remain). Stay, unmet by this change: the event-limit sheet, the code row's
  next-render tick (lower stakes now: a stale tick only delays the line's words moving on), one label for creating an
  event, Upgrade loses the draft, the `swatch` atom, the QR ask's two wordings.
- The create-wizard board is retired (its folder deleted); its ledger `docs/reviews/create-wizard.json` is the
  Orchestrator's.
- Walked locally on port 3132 at 375 and 1440 in the lane's own headless Chrome (captures in the lane's scratch): the
  style step's rest and the picked card's story, the Disposable's screen, the beat (her link, the seed light, Print and
  Share), Go to your event into the hub, the line and its dismiss (cookie on `/dashboard/<id>`, not drawn on reload, not
  on another event), Show's list; the like door signed out (303 to `/login?intent=create&next=/dashboard/new`, cookie
  on `/dashboard/new` for 30 minutes), then signed in (Create in "Review · Dots code", two steps, the cookie put down);
  another host's open album (Live · Classic), an unknown and a malformed token (plain Create); the account menu's row.
- Test data, listed for deletion (willg97's): events `8dbaadbf-6635-4402-ba2b-8e97583413e0` ("create-wizard-wiring-2
  (disposable) phone"), `ab7dee2f-735a-4545-98f1-ba3b22b2e07e` ("create-wizard-wiring-2 (disposable) desk"),
  `8e7004f3-608e-46ac-917d-179cfc9d79a8` ("cww2 (disposable) roll"); the walk also counted one view on hi@willgibs.com's
  "RT51 free".
- For the record: PRD's core loop (Share) still says the album carries a quiet "Start for free" link; on an album it is
  Make one like this now.
- Assets requested from Will: none.
- Board ideas: the beat's link thumbnail is the 1200x630 share card at 68 px, its words unreadable: a compact face of the
  card (after-party r1's open `card` question) would read at that size; the entry carries the code alone while the room
  cross-fades: naming her cover a second morph target would draw the board's dark rising into it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls for Will: Make one like this lends an album's style to another host's Create: the style alone (its mode, its
  code's look, a Disposable's roll; never its name, date, guests, photos or develop time), read through the album's door
  as the visitor she is, so an album that shuts her out lends nothing; the token waits 30 minutes in a cookie through
  her sign-up.
- Look at first: Create at a phone: the style step (the picked card plays, the others rest), the beat (her link under
  the code, the seed light), Go to your event; then the hub's one line and its dismiss; then a signed-out album's corner.
