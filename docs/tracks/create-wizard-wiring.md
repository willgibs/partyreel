---
track: create-wizard-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard
  - src/lib/events/readiness
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/create-wizard.json
  - src/app/(dev)/design/sandbox/create-wizard/spec.ts
  - docs/systems/host-app.md
  - docs/PRD.md
---

# lp/create-wizard-wiring

**Goal.** Create's last steps as Will picked at create-wizard r4: the three style cards standing still with Disposable's time on a screen of its own, a close that names in one line what guests still need, and a failure held where she is with everything kept.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3136 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/create-wizard.json` round 4):** styles = focused, close = next, wait = breath (as built: nothing to do), failed = held. The board (`src/app/(dev)/design/sandbox/create-wizard/`) draws each in production's own room and atoms (`create.tsx` imports them): that drawing is your spec. Its carried calls stand (none overruled), and the round's new words stand as drawn for the voice to tune ("When do the photos develop?", "Guests still need your code: print it, or share it.", "Couldn't create it yet").

- **styles = focused:** the three style cards with nothing opening under them; picking Disposable adds one screen after this one, its own: when the photos develop, and the roll (the steppers grow by one when she picks it). His note: "I like the additional disposable settings getting their own focused view." He is still split on the cards' moving pictures ("hard mental model to keep 9 screens in your head ... overwhelming seeing 3 things happen at once each step"): create-wizard r5 explores that after you, so keep today's pictures and build the step's structure cleanly.
- **close = next:** the beat's close under Print and Share is one line saying what guests still need, the code sent or printed, which the two rounds just above it do; the five marks go (`beat.tsx`'s `BeatSteps`). In readiness, the code is the one essential a new event has not done (`readiness.ts`: the door and adds are done at Create, the photos and the welcome are not essential), so the line is true by construction. His notes: "How we present this line can definitely be designed better. I do like the subtlety versus the steps, though. Rather than shouting about what's done and what's to come, we should simply continue naturally guiding them through"; and Create finishes the event (PRD.md's core loop, refined from his note): r5 redraws the close as the payoff ("Get it ready" at the foot and the hub's checklist are part of why it felt halfway). Build the one line well now; propose nothing beyond it.
- **failed = held:** the screen she is watching stays and says nothing was lost; the foot becomes Try again; Back is there for a change; the limit-reached refusal keeps its Upgrade. His note: "State progress, feedback, failure notice, and corrective actions should all be made clear here, so if something goes wrong, it doesn't feel frustrating or scary. Only easily correctable." Today a failure returns to the look with a toast (`create-event-wizard.tsx`); after you, a toast never carries a failure here.
- **The Immediate NIT it closes:** at a roll of 1 the Disposable card reads "1 shots each".

**Nearby lanes this wave (never edit their paths):** Settings' camera page and the develop-time helpers (`camera-settings*`, camera-wiring: read them, never edit), the hub (event-header-wiring-2).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** Create on your port at 375 and 1440: each style, Disposable's own screen and back, the close's line, a failure (a throttled line that drops, a server refusal, the limit reached) held, Try again making it, Back for a change, reduced motion.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under the Handoff's calls.

- **The limit's hold: what is its foot?** Recommended and built: Upgrade alone (the plans' sheet, as the toast's action
  did; no navigation away), Back for a change, its line "Free holds one event. Delete an event or upgrade to add more."
  after what is kept. Try again cannot pass a full plan until an event is deleted, so it is not offered there.
- **The room line (the account past the dashboard's storage threshold), now that the marks are gone?** Recommended and
  built: kept beside the one line, as r2's carried `room` placed it (the plan's, never a step); the board drew the
  close with no room to say.
- **What does a held failure say after "Nothing was lost"?** Recommended and built: the board's words for a line that
  never answered ("Check your connection and try again."); for a server refusal, the server's own sentence (the house's
  `messageFor` rule), except the create's catch-all, which only repeats the question and is said as its instruction
  ("Please try again.").
- **Where is focus when a failure lands?** Recommended and built: where she left it, on the foot's key, which is the
  same key turned into Try again (a working key keeps its focus); the room's status says the question and the words
  whole. The arrival still moves focus to the question.
- **Does the code move when a failure lands?** Recommended and built: no. The board's held frame let the plate drop
  (16 px at a phone, 36 at a desk) as the words replaced the doors; production stands the doors, the close and the
  held words in one cell, so the plate holds still across the wait, the hold and the arrival.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`, "Events and the create flow": the create path's screens (a Disposable adds its own
  screen, the steppers count five) and the beat (a failed Create held on it, never a toast; its close one line read
  off the readiness, `stillNeeded`).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · The host app: a Create whose answer is lost after the server made the event is held as failed, and Try
  again makes a second event (the toast flow had it too); a client key for the attempt on `createEventInWizard`,
  unique per host, makes the retry return the first.
- Upcoming · The host app: Upgrade from Create's held limit or the cap door leaves through Checkout to `/dashboard`
  (`returnTo`), so the name, style and look she chose are gone; bring her back to `/dashboard/new` with the draft kept.
- Upcoming · Billing and pricing: the plans' sheet opened by an event limit (Create's held Upgrade, the cap door's See
  Pro) leads "You are out of room", the storage trigger's words (`pricing-sheet.tsx`, `kind: "room"`); give the event
  limit words of its own.
- Upcoming · The lab and the kit: Library: Create's room specimen never fails (its stand-in always makes the event), so
  the held beat is pressed nowhere in the lab; a stand-in that fails once (`create-room-demo.tsx`) draws it.

## Handoff (replaces the chat report)

S below is `/Users/gibby/local/ai/partyreel-wt/_scratch/create-wizard-wiring` (logs and captures; pruned with the lane).

- **Commits.** The work is `4aa71ecc2`, pushed to `origin/lp/create-wizard-wiring`; this manifest is the commit after it
  (the head in the chat line). No sync: `launch-prep` moved only by record commits since the cut (`156e3090` to
  `82eba704`: PROGRAM, ROADMAP, STATUS and two manifests).
- **Gates on `4aa71ecc2`**, each on its own exit code, through `scripts/build-lock.sh`: `pnpm typecheck` EXIT 0
  (`S/gate-typecheck.log`); `pnpm lint` EXIT 0 (`S/gate-lint.log`); `pnpm test` EXIT 0, 1058 files and 13316 tests,
  run with the component setup's dummies exported (`NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key`), as the Orchestrator's note asks until the vitest env fix
  lands (`S/gate-test.log`); `pnpm build` EXIT 0 (`S/gate-build.log`); `pnpm lab:smoke --base http://localhost:3136`
  EXIT 0, 198 checks and 0 failing over create-wizard and the six boards that import a changed file, the Library and
  the lab's pages (`S/gate-labsmoke.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, this file, and these, each a line
  or compile-only:
  - `docs/systems/host-app.md`: the System-doc edits above.
  - `src/lib/disposable/album-style.ts`: the NIT's one home; `styleLine` speaks through `roll.ts`'s `rollShots` (one
    line and its import), so Settings' card and Create's say "1 shot each" alike.
  - `src/app/(dev)/design/sandbox/create-wizard/close.tsx` and `styles.tsx`: compile-only. Production's `BeatSteps`
    retired with `close=next`, so the r4 board keeps its own copy for its `marks` option; `DevelopRow` lost its
    open/shut props, so the board's quiet option wraps the row itself (keeping the slot hooks its caption reads) and
    its focused screen lays the roll beside it. The board's `styles.built` frame now draws the wired step (nothing
    under the card), since that option retired: the board retires, or r5 redraws it.
  - `src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx`: the Create specimen's lede named "Settings'
    steps beneath"; it says the one line and the Disposable's own screen.
  - `content/help/create-your-first-event.mdx`: help tracks shipped reality; step 2 (the time's own screen), step 4
    (the one line, a failure held with Try again), the description (under its 200-character cap).
  - `src/app/(app)/dashboard/new/page.tsx` and `src/lib/dashboard/stage.ts`: one stale comment each (the toast on a
    limit; "Create's last beat draws the same rail").
- **The items.**
  - styles=focused: the three cards stand still, nothing under them; Disposable adds its own screen after them ("When do
    the photos develop?", "Everyone's open at once": the album the morning it opens, the develop row, the roll;
    `develop-step.tsx`); the steppers grow to five while it is picked; a refused or passed time lands her there with
    its words under the row; `DevelopRow` is a plain row.
  - close=next: the beat closes on one line under Print and Share, "Guests still need your code: print it, or share
    it.", read off the new event's readiness (`readiness.ts`'s `stillNeeded`, the words beside the code's item); the
    five marks (`BeatSteps`) are gone; room said beside it where storage runs short; the line breaks after its colon
    when it must wrap.
  - failed=held: the beat holds a failure (`held.ts`): "Couldn't create it yet", the sample standing still with its
    word, "Nothing was lost: your name, style and look are kept." then why and the way; the foot is Try again (Upgrade
    at the plan's limit, opening the plans' sheet in the room); Back leads to the look; no toast, no navigation.
  - wait=breath: as built, untouched.
  - The Immediate NIT: "1 shot each" at a roll of one (`add-step.test.tsx` pins it on the card).
  - Tests reshaped on purpose, scars kept and expired reasons named in place: `create-event-wizard.test.tsx` (the close,
    the four failure paths, the style at birth through the Disposable's screen), `add-step.test.tsx` (nothing under
    the cards, the develop screen, the roll there), `room.test.tsx` (the new screen and the hold in his layout, the
    steppers growing, Back from a hold), `lamp-flag.test.tsx`; new `held.test.ts`, `readiness.test.ts`'s close.
  - The red-team, local on :3136 in a headless Chrome of my own, test host willg97 (Pro): at 375 the cards with
    Disposable (`S/rt/p1-add-disposable.png`), its screen (`S/rt/p1-develop.png`), Other at one shot
    (`S/rt/p1-develop-other.png`, the card then reads "1 shot each"); Create offline held with the dropped line, focus
    on Try again, the status said (`S/rt/p1-held-dropped.png`); Try again offline held again, online made it
    (`S/rt/p1-made.png`; the row is camera, roll 1, develops 13:00Z, 9 am New York, one row only); a real server
    refusal (session cookies cleared at the look, the action's answer read off the wire: `unauthorized`) held with
    "Please sign in and try again."; at 1440 the cards, the screen, a hold and the arrival with room at 92%
    (`S/rt/d1-*.png`), the plate at the same 213 px held and made; reduced motion: no breath, the hold whole at once;
    Tab on the hold: Try again, Back, Close, each with the halo (`S/rt/p3-held-tab-foot.png`), and a real Enter
    retries; on the develop screen: the field, the roll, Continue, Back, the name, Close; 375 by 667 with Other open
    fits unscrolled, the picture yielding to 123 px (`S/rt/p3-667-develop-other.png`), a past time refused under its
    row (`S/rt/p3-667-develop-refused.png`); Back from a hold walks look (Dots kept), the time's screen (time kept),
    the cards (Disposable kept). The limit's hold (`S/rt/p3-held-limit.png`) was drawn on a throwaway local page that
    handed the real wizard a failing `create` (never committed, deleted), since the Free test host sits at its cap and
    meets the door; its Upgrade opened the plans' sheet and Esc returned focus to it, the hold intact.
  - Walks I could not drive, for the desk: the limit refused by the real server for a Free host, then Upgrade through
    Checkout; a real phone's native date wheel on the Disposable's screen; VoiceOver reading the hold (the status text
    was checked in the DOM); a line that drops after the server made the event (CDP's offline let the in-flight Create
    finish, see the first Deferred line).
  - Test data, listed for deletion (left active; I pressed no delete in the app): willg97's
    `ea9115da-60ab-48f4-9349-56a2653fa333` "create-wizard-wiring (disposable)" and
    `3e997ec3-913f-4b0c-86ab-e421289d5867` "create-wizard-wiring (disposable) slow-drop".
- **Assets requested from Will:** none.
- **Board ideas:** r5's close-as-payoff is already Will's; beside it, the steppers could grow by easing the new
  hairline in when Disposable is picked (today it appears in a frame, as the board drew it).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (the first Deferred line would want one).
- **Calls his to overrule:**
  - The limit's hold offers Upgrade alone at its foot, with Back; never Try again there.
  - The storage line stays beside the close's one line where the account runs short.
  - A held failure says the server's own sentence after "Nothing was lost", the create's catch-all as "Please try
    again."; a line that never answered says to check the connection.
  - Focus stays on the foot's key when a failure lands; the arrival still takes it to the question.
  - The code never moves between the wait, the hold and the arrival (the board's held frame let it drop).
- **Look at first:** the hold at a phone (`S/rt/p1-held-dropped.png`), then the Disposable's screen
  (`S/rt/p1-develop.png`) and the close (`S/rt/p1-made.png`).
