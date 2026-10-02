---
track: door-reveal
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e771e80b"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
  - src/components/guest/door/album-light
  - src/components/guest/door/album-view
  - src/components/guest/door/ask-step
  - src/components/guest/door/chooser
  - src/components/guest/door/door-page
  - src/components/guest/door/doors.test
  - src/components/guest/door/doorway
  - src/components/guest/door/heading
  - src/components/guest/door/lit
  - src/components/guest/door/no-autofocus
  - src/components/guest/door/shut-door
  - src/components/guest/door/signin-step
  - src/components/guest/door/stage
  - src/components/guest/door/switch-email
  - src/components/guest/door/unlisted-ask
  - src/components/guest/door/wait-picks
  - src/components/guest/door/waiting-step
  - src/components/guest/door.css
  - src/components/guest/entry-modal
  - src/components/guest/entry-shell
  - src/components/guest/entry-step-transition
  - src/components/guest/password-gate
  - src/components/guest/identify-step
  - src/components/guest/guest-name-step
  - src/components/guest/door-settles
  - src/components/guest/event-experience
  - src/lib/guest/use-welcome-seen
  - src/lib/guest/entry-steps
  - src/app/(guest)/e/[token]/page
  - content/help/how-guests-join-and-upload.mdx
  - content/help/messages-guests-might-see.mdx
  - content/help/require-verified-emails-explained.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - docs/systems/database-security.md
  - src/components/guest/door/welcome.tsx
  - src/lib/event/door/words.ts
---

# lp/door-reveal

**Goal.** Wire locked-door r3's picks (the walk through the doorway into the album's cover, nailed, and the turning, breathing idle light), make the door always the first paint (the album never visible before any door a visitor should meet first), ask the name after the email where verification is required, keep the waiting door's chosen photos across a reload, and retire the board.

## The brief

**Why.** Will answered `locked-door` r3 on 2026-10-02 (`docs/reviews/locked-door.json`); the board's drawings are `src/app/(dev)/design/sandbox/locked-door/` (yours: port what you need, then retire the board by deleting its folder). His words:
- `reveal=through`: "I think this feels so much cooler than the single image alone, really feels like you're entering this door into the world of the album. The animation/transition has some bugs and could definitely be more polished to feel like seamless magic. If we can't nail it, the party's light (option 1) can be our failsafe for a smooth fullscreen fade transition that should be easier to perfect. Would like to nail the option 3 though."
- `idle=turn`: "Hitting different colors across the rainbow makes this feel really cool, rather than being a static predictable color every time. Maybe it could be subtly combined with the light breathing? Also, could we speed up just slightly so a visitor is more likely to notice the animation before closing a gated page?"

**And from his live walk on the alias the same afternoon** (an open, hold-for-approval album, signed out on his phone):
- "entered the address, full guest album was visible before gate appeared over it (big bug)". Reproduced on build 42: the album paints for 1 to 3 s, then the welcome door rises over it. The cause: the welcome's seen-state lives only in localStorage (`src/lib/guest/use-welcome-seen.ts`), so the server always renders the album and the door mounts after hydration. His rule, verbatim: "let's ensure that the album is never visible before any door/gate that should be encountered first. Very bad UX for both revealing the album (could catch screen recording) and the guest flow 'what just happened? i saw the album, now i'm out'." Make it an invariant held by a test on the server's first paint for every door (the welcome, the ask, the wait, a password, the email step, the shut door): the first byte a newcomer receives draws the door, never the album. For instance the seen-state mirrored to a cookie the server reads, so a returning guest still lands on her album at once. Gated doors are already decided on the server (build 40 proved them redacted); keep it so.
- He typed "Will Test Mobile" at the name step, then verified an email whose account is "Will Gibson", and the upload was credited "Will Gibson" with no word. His answer: "where verification is required i think it makes more sense to handle name after so we aren't handling two different versions for every new event on that account." So where verification is required the email comes first and the name is asked only of an account that has none; where it is off, the name stays the one step.

**What to build.**
1. **The walk-through, nailed** (`reveal=through`): the album's own photographs small and lit through the doorway; walking through, the doorway grows past the screen and they settle into place on the cover (`header-wiring`'s landing: the head is `[data-event-head="album"]`, its photographs `[data-head-stills]`, each still `img[data-head-still="<slot 0-5>"]`, slot 0 the one at rest and the one reduced motion sees). It plays on a Public album's Continue and when someone is let in. Seamless is the bar: no flash, no jump, no double paint, at 375 and 1440, on a slow phone. If it cannot be made seamless, say so in your Handoff with captures of both, and build his failsafe (the party's light, a smooth full-screen fade).
2. **The idle** (`idle=turn`, with his notes): the light under the waiting and the shut door turns through the rainbow, never one predictable colour, breathing subtly with it, a little quicker than drawn so a visitor sees it move before leaving. Outside, nothing of the album shows: on a gated or shut door the colours are the house's, never sampled from the album. Reduced motion stands it still.
3. **The door first**, as above, by test.
4. **The name after the email** where verification is required, as above, with the help articles that walk the steps brought to it.
5. **The waiting door's chosen photos survive a reload** (the ROADMAP line: kept in IndexedDB, and the door's "Keep this tab open." goes with it).
6. **The swing's 50 ms gap** (red-team 40's NIT), if the walk-through leaves any swing.

**Boundaries.** `door/welcome.tsx` stays untouched while demo-framing r4 is open (it is in that board's `lives`): read it, and route any change it needs through your Questions. The guest head (`event-experience-head.tsx`) is yours for the landing only: the cover's look is settled. Privacy exactly as built: the door shows only what the album's read gives today.

**The direction** (Will, 2026-10-02): "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." Bespoke, experiential, sleek; a modern consumer app, cool to 18 to 50.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; the first-paint invariant by test for every door; the walk-through and the idle captured frame by frame in a headless Chrome of your own at 375 and 1440 (a phone's CPU throttled 4x), reduced motion honoured; sign-in, the let-in and uploads cannot run on localhost, so name those steps for build 44's red-team in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

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
- Calls his to overrule, one line each
- Look at first: ...
