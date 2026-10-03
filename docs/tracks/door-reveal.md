---
track: door-reveal
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended; every one is Will's to overrule.

- **Q1. Create account at a name-only event keeps its one name-and-email screen?** His words named the events where
  verification is required; Create account is a way in she picks at the chooser, its typed name the account's from
  the start, so nothing is ever two names. Recommended: keep it. Overrule: one flag (`identify-step.tsx`'s
  `asksName`), and the name step after the code serves both.
- **Q2. The idle's pace: around the whole rainbow in 24 s (the board drew 36 s), stepped through 360 hues, the
  breath on a third of it, each visit starting at a random point (`doorPhase`)?** The held door's dot breathes on the
  same clock rather than pinging. Recommended: as built; the pace is one variable (`--door-turn-ms`, `doorway.css`).
- **Q3. The walk plays on a Public album's Continue and the moment she is let in, and nowhere else?** The
  password's door is shut (its unlock keeps the sheet's reveal); the email's confirmation happens over an album
  she has already walked into. Recommended: as built (a board idea below for the password).
- **Q4. The walk takes 1,000 ms, and the album stands 420 ms before a step the door still owes rises over it?**
  Recommended: as built (her press moves at once; the stride ends on the cover with no glide).
- **Q5. The door is in the guest page's first load (+26.6 KB gzip, 77 KB raw: `EntryModal`'s chunk, which every
  guest page already fetched after hydration as a lazy chunk)?** The stage the server draws is live at hydration
  with no second round trip; the bytes are the same. Recommended: keep. Overrule: `React.lazy` again (still
  server-drawn, but Continue waits on the chunk).
- **Q6. The welcome flag is a cookie for a year (`pr_welcome_<qr>`, path `/`, Lax, readable by the page so the
  client can put it down with the ticket)?** Recommended: as built; `/privacy` lists it at the legal pass (Deferred).
- **Q7. The held door keeps her choice 14 days, for a confirmed account only (the waiting door is always one), and
  the album she returns to sends it with "Sending your 3 photos from the door"?** Recommended: as built.
- **Q8. Red-team 43's words for a develop album:** her rows "Waiting to develop", the list's line "Uploads appear in
  the album when it develops, Sat, Oct 3, 9:00 AM.", the badge "Your uploads, 3 waiting to develop", the keep's "Your
  3 photos are waiting to develop, Sat, Oct 3, 9:00 AM." Working words until `the-wait` draws the wait's own.
  Recommended: as built.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md` (`6d55c8e1`, `1239ce2d`): the first byte is the door (`doorArrival`, the welcome's
  cookie, the scrim and its handover, the two first-paint tests; the gate's twin retired); the walk through an open
  door (`stage-walk.ts`, the curtain and `[data-door-below]`, the settle, its fade under reduced motion); the
  turning, breathing idle; the open door's view is the album's cover (`album-view.ts` retired); verified mode's
  itinerary and the confirmation's writes (the email first, the name only for an account with none); the held
  door's choice kept on the device; the welcome line's cookie; the header over the cover from the first byte; the
  head as the walk's landing; red-team 43's lines (her tracker stands wherever what she adds waits, the sealed row
  and its words, the keep's develop line, the empty album's first-paint check, `develops_at` off a gate's payload).

## Deferred (ROADMAP one-liners, bucket named)

- Launch checkpoint, legal: `/privacy`'s Cookies table says three cookies; since `door-reveal` the welcome's flag is
  a fourth (`pr_welcome_<qr>`, a year, essential: the page draws the door first from it), out of the local-storage
  paragraph and its inventory comment (`legal-privacy.tsx`), and the held door keeps a copy of the photos she chose
  in this browser's IndexedDB (hers alone, up to 14 days, put down once she is let in) (from `door-reveal`).
- Code hygiene: `foreign-ticket.test.tsx` pins the welcome by the legacy `pr_welcome_<qr>` localStorage key, which
  `forgetWelcome` still puts down; the flag is the cookie since `door-reveal`, so its five assertions would read
  `document.cookie` (from `door-reveal`).
- Code hygiene: the develop time is said in two homes, the host's (`camera-settings.tsx`'s `DEVELOPS`) and the
  guest's (`upload-tracker.ts`'s `developTimeWords`), one format; a formatter in `lib/disposable/` would hold both
  (from `door-reveal`).

## Handoff (replaces the chat report)

- **Commits on `lp/door-reveal`, pushed:** work `c8780853` (the door first, the walk, the idle, the board retired),
  `41487f5c` (the name after the email; the held door's choice), `b6cd71e4` (the walk's pins; the page's work after
  its first frame), `6d55c8e1` (guest-flow.md), sync `a30ffe48` (origin/launch-prep `338e61f0`), `cb76ab5f` (the
  email help article, an exception below), `1239ce2d` (red-team 43's MEDIUM, the page half), then this manifest.
  launch-prep has since moved to `642c04d6` with records and `event-header-r2`'s lab-only board: `git merge-tree`
  is clean, and the board's imports from `event-experience-head.tsx` (`EventHead`, `HeadStills`, `AlbumCover`,
  `HouseLight`, `HeadStill`) keep their shapes, so no second sync.
- **Gates on `1239ce2d`** (the synced tree with the fix), each on its own exit code (logs in
  `../partyreel-wt/_scratch/door-reveal/gate-*.log`): `pnpm typecheck` 0; `pnpm lint` 0 (0 warnings); `pnpm test`
  0 (788 files, 9,324 tests); `pnpm build` 0 (the built stylesheet keeps `@property --door-turn` and
  `tan(atan2(...))`); `pnpm lab:smoke --base http://localhost:3131` 0 (155 checks, 0 failing). No `lab:demo`: no
  board (locked-door retired).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and these outside
  `owns`: `src/components/guest/save-account-prompt.tsx` (+ test; red-team 43, taken on your word);
  `src/components/guest/upload-tracker.tsx`, `src/lib/guest/upload-tracker.ts` and
  `src/lib/guest/waiting-on-arrival.server.ts` (+ tests; red-team 43: her tracker mounting is not enough while a
  sealed row reads as "In the album", and the empty album's check counted only held rows; no lane holds them);
  `content/help/why-an-event-asks-for-your-email.mdx` (two lines: it walked the old order, the name before the
  email; no lane holds it since `crumbs-50`); `src/components/marketing/help/step-screens/registry.ts` (one line:
  the `door-email` screen's caption, "your email" alone); `src/lib/guest/use-upload-queue.ts` (one comment,
  `holdAtDoor`'s note on the copy kept on the device; `disposable-camera`, cut after this lane, now owns the file).
- **Items:**
  - The door is the first byte for every door: `doorArrival` decides it on the server from the welcome's cookie
    (`use-welcome-seen-cookie.ts`), the ticket cookie and the profile's name; the stage is server-drawn, the scrim
    stands where a sheet step comes first and hands over to the sheet with no fade; pinned by
    `page.first-paint.test.tsx` and `event-experience.first-paint.test.tsx` (welcome, teaser, password, the email
    step, ask, wait, scrim, returning, owner, shut door).
  - The walk through the doorway onto the cover, seamless by construction (`door/stage-walk.ts`, `CoverPicture`):
    pinned on its geometry (`stage-walk.test.tsx`: lands to the subpixel, a scrolled stage too, past every edge)
    and its states (`entry-modal.test.tsx`, "the walk through the open door"); captured at 4x CPU, 375 light
    (`w9`, `w11`) and 1440 dark (`w10`), each with `sheet.jpg`; a 4x trace of the press drew 121 frames with no gap
    over 34 ms. Reduced motion fades the stage.
  - The idle: a shut or ajar door's light turns through the rainbow and breathes, each visit from its own point;
    the open door holds the album's light; reduced motion still (`idle1/strip.jpg`; `doorway.test.tsx`).
  - The name after the email where verification is on: `identify` asks the email alone, the name comes after the
    code only for an account with none; Create account keeps both (Q1); four help articles walk the new order.
  - The held door's choice outlives the tab (`door/wait-picks-store.ts`, IndexedDB under the album and the account,
    14 days); "Keep this tab open." only where it cannot be kept; the album she returns to sends it once.
  - The swing's 50 ms gap: not reproduced. A 4x trace from navigation found no frame gap over 34 ms after first
    paint (the swing rode a 417 ms hydration task on the compositor), and a Public album's welcome now stands open
    from the first byte. Retire the line; build 44 can watch for it.
  - The board retired (`src/app/(dev)/design/sandbox/locked-door/` deleted); its ledger
    (`docs/reviews/locked-door.json`) is yours to retire.
  - Red-team 43's MEDIUM, the page half (`1239ce2d`): one reading, `uploadsWait`, taken by the page's server
    (approval, or a develop time ahead through `developState`); her tracker stands on it, a sealed shot waits as
    "Waiting to develop" (counted, removable), the keep never says joined, the empty album's first-paint check
    counts sealed. Nine pins, red on the approve-only reading (checked by setting the fix aside).
  - Found beside it, fixed: a gate's payload carried the develop time (the foundation's columns rode the
    `shellEvent` spread); `develops_at` is blanked at access `none` with the date (`page.redaction.test.tsx`).
- **ROADMAP lines this lane retires** (yours to delete): `entry-steps.ts`'s head "one held sheet"; the swing's
  ~50 ms gap; the held door's IndexedDB; `door.css`'s 55svh welcome rule; and refine three that named the board:
  `locked-door`'s `scene.tsx:35` (the `ui/responsive-menu.tsx` half stays), `Strip` copied in `locked-door` and
  `event-ready` (event-ready's alone), the door family board quoting `WelcomeStep`/`SuccessStep` (the help center's
  door screens alone).
- **Assets requested from Will:** none.
- **Board ideas:** the password's unlock could end in the walk too (the door at rest swinging open on the unlock,
  then through onto the cover), one arrival for every door.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** Q1 to Q8 above.
- **Look at first:** the walk on a real phone; the verification door's order; the develop album's tracker.
- **For build 44's red-team (cannot run on localhost):**
  - A Public album signed out, 375 and 1440: the welcome from the first byte (no album flash), Continue walks onto
    the cover, the sheet after the settle; a reload lands on the album; a sign-out brings the welcome back.
  - A verification album: the welcome, the walk, the email step, the code; a nameless account then names itself,
    a named one is never asked (his "Will Test Mobile" case).
  - An approve album: the ask, the wait (the ajar door turning, breathing); photos chosen at the wait survive a
    reload; with the tab closed, a let-in from another device and the let-in mail's link sends them ("Sending your
    N photos from the door"); with it open, the beat, then the walk, then they go.
  - A password album: the door at rest turning from the first byte; the unlock's sheet reveal; the shut door.
  - Red-team 43's W1 again (a develop album, a ticket guest sends 3): the keep says they wait to develop, with the
    time; the tracker "3 waiting to develop", each row with Remove; after a reload they are still listed; a gate's
    payload carries no `develops_at`.
  - Safari (iOS): the cover filling the opening (`tan(atan2())`), the turn (`@property`), the scrim's handover with
    no double dim, the walk's smoothness; reduced motion: the door still, the stage fading.
