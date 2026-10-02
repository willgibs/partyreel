---
track: door-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/door/
  - src/components/guest/door.css
  - src/components/guest/entry-modal
  - src/components/guest/entry-shell
  - src/components/guest/entry-step-transition
  - src/components/guest/password-gate
  - src/components/guest/door-settles.test.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/guest/use-upload-queue
  - src/app/(guest)/e/[token]/
  - src/components/marketing/help/step-screens/door-screens.tsx
  - docs/systems/guest-flow.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - src/app/(dev)/design/sandbox/locked-door/
  - src/lib/events/visibility-labels.ts
  - src/lib/event/door/words.ts
  - docs/systems/database-security.md
  - supabase/migrations/20261001233000_guest_event_cap.sql
  - src/app/not-found.lazy.tsx
  - src/components/shared/not-found-screen.tsx
---

# lp/door-wiring

**Goal.** Wire Will's locked-door picks into production: the doorway family as one shared design whose words and light change by state, a cleaner photo chooser on the waiting door, and the shut door, empty, for a broken link; round 2's door swing as the working reveal; the album read's redaction held.

## The brief

**Why.** Will answered `locked-door` r2 on 2026-10-02 (`docs/reviews/locked-door.json`). Every pick was the board's recommendation:
- `family=doorway`: "A drawn door whose leaf is the state (open, ajar, shut)."
- `shape=shared`: one design for every door state; only the words and the light change.
- `wait=pick`: while she waits at a held door she can choose photos; the queue sends them the moment she's let in.
- `lost=follows`: a broken guest link meets the shut door, empty.

His notes, verbatim:
- on `family`: "This is absolutely gorgeous, big win for our design assets and really sets a good new standard on experiential design. Two additional notes. First, the album behind the door opening doesn't feel very polished, kind of makes the door hard to see. I love the door (and light leak in the other versions), just want to nail this state too. Second, even the wait/shut states should have some sort of minimal, calmer, looped animation to keep the page a little interesting. Maybe a slight glow to the light or something?"
- on `wait`: "The \"while you wait\" upload UI should definitely be designed cleaner within this, but adds a lot of value to the waiting door."

His two `family` notes (the album behind the opening, the idle loops) are a round-3 board cut from the production you leave. Ship round 2's door swing as the working reveal, and build no idle loop. His `wait` note is yours: design the chooser clean.

**What to build.** Port the board's doorway into `src/components/guest/door/`: `sandbox/locked-door/doorway.tsx`, the `furniture.tsx` pieces it uses, and `locked-door.css`, plus whatever they import. Read the board's frames as the target at 1440 and 375, with reduced motion. One shared design across every door state:
- the welcome or ask;
- waiting (`waiting-step.tsx`), with the chooser;
- shut (`shut-door.tsx`);
- the broken link (`e/[token]/not-found.screen.tsx`).

The words stay production's, from `lib/event/door/words.ts` and `visibility-labels.ts`, which you read and do not edit tonight.

**Rules and boundaries:**
- ★ **Privacy, Will's answer of 2026-10-02.** The door shows only what `get_event_by_qr_token` already gives: a gated door names the album and never the host; private, Only me and blocked doors name nothing (the sneaky block reads as private). No RPC change. The board's carried call `shows` (the doorway naming the host) is overruled. Test the redaction on each kind of door.
- **States the board never drew:** production's "Ask to join" step, and the welcome at an approve-each or invite door. Draw them in the shared grammar.
- **The chooser:** the queue (`use-upload-queue.ts`, `takeJoin` and the `doorOpen` effect) already holds her files and sends them on the soft refresh that lets her in. They live only in the open tab: the door says so, quietly. IndexedDB is a Deferred line.
- **The 404:** it stays behind `src/app/not-found.lazy.tsx` (`not-found.test.ts` enforces it). `shared/not-found-screen.tsx` stays for every other 404.
- `door/lit.tsx` and `lit.css` stay: other screens use them. Keep exporting `DoorLamp` and `DoorPool`, which the demo hero imports.
- `entry-modal.tsx` is 1,418 lines; export what you need from it. The help center's `door-screens.tsx` draws copies of the door: redraw them as the doorway.
- Don't edit the board folder: round 3 reworks it from your production.

**Record.** In `guest-flow.md`, the door family as built. ROADMAP lines go in your Deferred section (the chooser's storage, anything else).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; `pnpm lab:demo --board locked-door --base http://localhost:3131` (the board still renders over your production); every door state read in a headless Chrome of your own at 1440 and 375 with reduced motion, signed out on localhost (sign-in and upload cannot run there: name those steps for build 40's red-team in your Handoff); the redaction's cases by test.

## Questions (a recommended answer each; the Orchestrator relays them)

- **ANSWERED: "A gated door names the album and never the host": every gate, or the password alone?** Answered by Will's
  own words of 2026-10-02, "Only what's shown today" (the brief's paraphrase had read them as never naming the host): the
  doorway keeps today's privacy exactly, so the overrule is applied (`760cc982`). The doors the host answers name her as
  production always did (the welcome's byline where she lets each guest in or a list keeps, the email step, the ask, the
  held door, the unlisted reader's "Ask Maya to let me in"); the password door names the album and never its host; the
  shut door (Only me, a closed door, a decline, a block, someone who was in) names nothing; the board's doorway naming the
  host on its shut door stays overruled.
- **What a gate's sheet stands over.** Built: at a gate the sheet's own steps (the password, the email) rise over the
  doorway, shut, under a light dim with no blur (`STAGE_SCRIM`), so the door keeps its state above them (beside the panel
  at a desk) and swings open on the step's own success; at a Public album the steps after the welcome rise over the
  blurred album as today, the open door having led in. Overrule: the blurred album behind every sheet (the door on its own
  pages only), or the door behind every sheet, a Public album's included.
- **Where the door stands.** Built: at one height below the header on every door screen (about a tenth of the screen
  down) rather than the board's vertical centre, so a door whose words change while she watches (asked, waiting, let in)
  never moves. Overrule: centred as the board drew it (the door shifts as its words change).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the door family as built (the doorway and its page, the stage over the album, a gate's
  server-drawn twin, the two scrims, the shut door and the broken link as the doorway, the welcome and the demo's role
  words at the door, the wait's chooser and the queue's hold, the redaction per kind of door), the stale lines (the
  locked river, the not-found family wearing a lock, "Ask Maya", the drawer's 55svh) taken out.
- `docs/systems/marketing-content.md` (one line, an exception: the fact moved with this lane): "Six `not-found.tsx`
  files share one presentational core" is now five, the guest link's wearing the empty doorway.

## Deferred (ROADMAP one-liners, bucket named)

- Guest flow: the wait's chosen photos live in the open tab alone (a `File` is the page's); keep them in IndexedDB so a
  reload or a closed tab keeps her choice, and drop the door's "Keep this tab open." with it.
- Help content: `content/help/how-guests-join-and-upload.mdx` still says one sheet over the blurred album; the welcome
  and the wait are the doorway's page now, and the wait's chooser is unsaid.
- Code comments: `shared/not-found-screen.tsx`'s head counts the guest's bad-link 404 and its private lock among its
  call sites; both wear the doorway now.
- Lab: `door.css`'s 55svh welcome rule (`[data-entry-sheet] [data-welcome-step]`) now serves only `locked-door`'s quoted
  sheets; it goes with the board (round 3).

## Handoff (replaces the chat report)

- **Commits**, pushed: `de964afc` (the door family), `38c9fb61` (the stage's modal semantics, the view cleared with its
  album, the records), `93217837` (nothing drifts behind a shut leaf), `ad200d2f` (sync: `git merge origin/launch-prep`
  at `6f1da1a3`, ready-wiring, crumbs-46, lab-prefetch and mkt-wiring; `visibility-labels.ts` and
  `marketing-content.md` had moved, no conflict), `760cc982` (today's privacy restored at the doors the host answers,
  the Orchestrator's correction). The head is this manifest's commit.
- **After `760cc982`** (the steps it touches, logs `_scratch/door-wiring/gate2-*.log`): typecheck 0, lint 0, test 0 (745
  files, 8,822 tests), `pnpm lab:smoke --base http://localhost:3131` 0 (136 checks).
- **Gates on the synced tree `ad200d2f`**, each on its own exit code (logs in `_scratch/door-wiring/gate-*.log`):
  `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0; `zsh scripts/build-lock.sh pnpm test` 0 (745 files, 8,822
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (136 checks);
  `pnpm lab:demo --board locked-door --base http://localhost:3131` 0 (no open step; with `--only` the board's `today`
  frames draw the new production's doorway, `_scratch/door-wiring/board-after/`); `pnpm lab:demo` scoped to the change,
  0, with one PREMISE line: `disposable-mode`'s open asks (video, cost) describe `guest-flow.md` and
  `event-experience.tsx`, which this lane touched, so they are worth a re-read before his next sitting.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns` or this manifest, plus four
  exceptions, each one pin or line whose subject moved with this lane: `docs/systems/marketing-content.md` (one line,
  above); `src/components/marketing/help/step-screens/step-screens.test.ts` (the welcome is drawn by the real
  `WelcomeWords` now, so its quote pin retired), `src/components/marketing/mock-parity.test.ts` (the welcome's words
  live in `door/welcome.tsx`), `src/components/shared/legal-consent-line.test.tsx` (the welcome carries the consent
  line now).
- The doorway (`door/doorway.tsx`, `doorway.css`): the board's doorway renamed `door-way-*`, its leaf the state (open,
  ajar, shut, an empty frame); the album's light and photographs only where it is handed them, a photograph only
  through an open door; pinned in `door/doorway.test.tsx`.
- The door's page (`door/door-page.tsx`, server-safe): `DoorColumn`, `DoorWords` in the door's text reveal, `DOOR_MAIN`
  (the door at one height), `DOOR_FOOT`.
- The stage (`door/stage.tsx`): the welcome (`door/welcome.tsx`; the demo's `RoleWords`), the ask, the wait and the
  let-in beat as the door's page over the album, a modal layer named by its headline (so `layer-is-up`'s waiters, the
  photo link's among them, wait behind it), the album `inert` under it, the page capped to one screen; a gate drawn by
  the page itself from the first paint (`event-experience.tsx`); pinned in `entry-modal.test.tsx` ("the door as the
  page") and `door-settles.test.tsx` ("the door as the page, at the page").
- The shut door and the 404 are the doorway (shut; empty), still behind the one lazy boundary (`not-found.test.ts`
  green).
- The wait's chooser (`door/wait-picks.tsx`), cleaner than the board's card: one outline button and one line, then her
  row, a count, a Change and the tab note; the queue's `holdAtDoor` holds it and the runner sends nothing while a door
  holds her (`use-upload-queue.test.tsx`, "her choice at the held door", red without the guard); sent on the let-in.
- Privacy, today's exactly: `page.tsx`'s `shellEvent` and the unlisted ask are production's lines (the host where the
  door answers to her, never at a password, nothing at the shut door); `page.redaction.test.tsx` pins every kind of
  door, red both ways (a host leaked at the password door fails one, a host lost where she answers fails another).
- The help center's welcome, wait and password pictures redrawn as the doorway (`door-screens.tsx`).
- **Read in a headless Chrome of my own**, signed out on localhost, reduced motion, 375 and 1440 (light; dark where the
  light matters): `_scratch/door-wiring/final/` (44 PNGs: the 404, a Public welcome and the chooser after it, a password
  welcome and its sheet over the door, an approve and an invite welcome and their email steps, the held door empty and
  with a choice, the let-in beat, a closed gate, Only me for a newcomer and for someone who was in, the help's three
  pictures). The held door and the beat ran on a disposable event of mine with a waiting ticket set by SQL, its row
  flipped to `in` to play the beat (`Door wiring gate (disposable)`, `576c5555-…`, since soft-deleted); no request but
  the check-in left the held door while a choice stood (network logged).
- **Build 40's red-team, what localhost cannot run**: the ask at an approve door as a confirmed visitor (Google), then
  the held door ajar; a real choice at the held door, the host's Let in, the beat, and her photos landing (no upload
  request before the let-in); the unlisted ask ("Ask Maya to let me in") at an invite door; the email step at both
  gates, confirmed by code; the Public welcome's sampled light and photographs on the alias (R2's CORS refuses
  localhost); the password's unlock with the door swinging open behind the sheet; iOS Safari's page cap, `inert` and the
  keyboard over a gate's sheet.
- Assets requested from Will: none.
- Board ideas: the doorway in the Library's component catalog (his "big win for our design assets"); a gate's own steps
  (the password, the email) drawn on the door's page rather than a sheet over it.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the welcome's byline without the host's face (the board's doorway drew none); the chooser's
  words ("Choose what you'll add", "Nothing is sent until you're let in.", "3 photos ready · Change", "6 photos & videos
  ready" for a mix, "They go in the moment you're let in. Keep this tab open.", and "Sending your 3 photos" under "You're
  in"); the let-in beat's mark is the door swinging open, no lit check; the room's drift behind an open or ajar door is
  round 2's own (still behind a shut leaf), and no idle loop was built for the wait or the shut door (round 3's); the
  demo's chevron back re-shows its own role step (the doc's rule; production showed the guest's welcome).
- **Look at first:** `final/waiting-picked-375.png` and `final/beat-let-in-375.png` (the chooser, then the let-in),
  `final/password-sheet-1440.png` (a gate's sheet over the door), `final/public-welcome-375.png`, and
  `page.redaction.test.tsx`.
