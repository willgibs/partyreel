---
track: locked-door
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/locked-door

**Goal.** Draw a new board, `locked-door` r1: the one lock screen a guest meets when she can't get in (the host made the album private, the album is closed to newcomers, or she was blocked, which must look identical), polished because it is high-traffic, with a line for previous guests asked as a question.

## The brief

**His words** (event-safety r1, `git show 69afdbc5:docs/reviews/event-safety.json`):
- On `door=private`: "Nice use reusing an existing lock screen to lock out blocked users, without the 'blocked' experience feeling distinct so guests won't be able to immediately discern they were blocked. Sneaky block, I like it."
- On `newcomer=same`: "when a host closes an album, there are no cases where that closure should be differentiated by new guests that can't access beyond 'Closed'? Maybe a private version so previous guests of an event can see the host made it private versus a closed album (gated access) ... Feel like the design could be polished though, if this'll be a high-traffic screen."

**The screen today:** the private branch of the guest album page, `src/app/(guest)/e/[token]/page.tsx` ("This event is private" / "The host has this event set to private. Check back later, or ask them to make it public."). `safety-wiring` is sending a blocked person to it now, and the join modes (`event-settings`) will send a newcomer to it when an album is closed.

**The questions:**
1. **The screen itself, polished.** The widest good set, in the door's family (the lit look: `DoorLamp`, `DoorHeading`, the lamp from the album's own previews when it may show any; production's door parts under `src/components/guest/door/`). Each option must stay truthful for all three causes at once, so a block is never distinguishable: words, a way on (the host's name, a way back later, nothing), what of the event it shows (its name, its cover, nothing). Graded against today's screen.
2. **A previous guest's line** (his "maybe a private version"). Should someone who was already in see that the host made it private, while a newcomer sees it closed? The trap to draw honestly: a blocked previous guest must read exactly what every other previous guest reads when the host makes it private. So a line that tells previous guests apart can only speak of the album's state, never of her. Draw options that keep that true, including "one screen for everyone".

**Frames:** 375 first (a guest off a code), and 1440; light and dark; reduced motion.

**Registration:** register directly after `emails` in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). Author with `defineExploration`; ask nothing another standing board asks (`node usher/kit/board-card.mjs --desk`).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Built on these answers, each carried on the board (`spec.ts`, `carried`), his to overrule:

- **One render per cause?** Recommended yes, as `door=private` and `newcomer=same` have it: who is reading moves the header and the back-in line, never why she is out (`fixtures.ts` carries the cause for frame titles only; no drawing reads it).
- **Where does "Already a guest? Confirm your email" stand?** Recommended on every cause, for anyone with no confirmed email on the phone. event-safety drew it under the closed door (`newcomer.same`) and not the blocked one (`door.private`), which told the causes apart.
- **An ask-the-host button on the door?** Recommended none: `newcomer=same` left the closed door without one, and on a block it would hand the blocked person a way to reach the host. The invite list's own door (`unlisted=ask`) is `event-settings`'.

## System-doc edits (in place, owned facts only)

- none (a board ships no production byte; nothing in `reads` moved)

## Deferred (ROADMAP one-liners, bucket named)

- Now, Guests: a blocked guest's Guest card leaves her dashboard with her uploads (a card lives only while one of hers is live, `getMyGuestEventCards`), while a private album's card stays and says "The host made this event private" (`lib/dashboard/guest-events.ts`), so an account holder can tell a block from a private album there, whatever the locked door says (from `locked-door`; `safety-wiring` may want it now).
- Now, Guests: the password gate titles a password album "{name} is private" (`password-gate.tsx`), the word the private visibility and its lock own; whichever words `lock` takes, the gate may want its own (from `locked-door`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/locked-door`:** `3ee43961` (the board and its three registrations), `33b3f9a0` (the trio's order, so `lab:demo` compares a frame that changes). No sync: `launch-prep` moved only by the record commit `3d9a04c3` (`docs/STATUS.md`, `docs/tracks/orchestrator.md`).
- **Gates on `33b3f9a0`, each its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (0 errors; 5 warnings, all in files outside the lane: `review-session.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`, `review-switch.tsx`); `pnpm test` 0 (520 files, 5863 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 ("209 checks, 0 failing", locked-door 419 of 1200 words); `pnpm lab:demo --board locked-door --base http://localhost:3132` 0 (`lock` moves up to 98.32%, `previous` up to 2.97%, "2 steps, 0 failing").
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `src/app/(dev)/design/sandbox/locked-door/` (board, fixtures, locked-door.css, parts, scene, spec, words) + this file + the three named registration exceptions, each one line after `emails`: `sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts` (its `SandboxId`, row and `DESK_ORDER`).
- **`lock`, the locked screen:** five whole screens, each one render for all three causes: today's as it ships (the reference), today's column lit (the real `NotFoundScreen` through its `visual` slot, the lock in a pool of the house light), the door held shut (the gate's heading, "Closed", the host as the way on), the host's door shut (recommended: the welcome's hero closed, the album's name beside Maya's face, "Only Maya can let you in"), and the host's door over its cover (its lamp sampled off the photograph). The Who knob shows the newcomer, Priya (was in, private) and Dom (was in, blocked).
- **`previous`, a previous guest's line** (after `lock`, drawn in its pick): one screen for everyone (recommended), told it's private (his "private version"), told who can see it changed. Three phones (Priya, Dom, the newcomer); the caption above them measures Dom's words against Priya's, word for word, on every option.
- **Every caption is read off the frame:** words and headline lines, what of the album it shows (found by its marks), the lamp's own `data-door-hues`, the sheet's height, the back-in line (`scene.tsx`, `measureLock`, `useReaderProbe`).
- **Verified:** 375 and 1440, light and dark, reduced motion (`lab:demo` emulates it) and motion allowed (settles whole), in a private headless Chrome, never the shared pane.
- **Assets requested from Will:** none (the cover is the bootstrap `wedding-golden` still).
- **Board ideas:** a door held over nothing (the ghost river under `DOOR_SCRIM`) reads as a flat grey slab in light, here and on the password door; a lighter scrim where nothing real stands behind would lift both. · A locked door that opens by itself the moment the host lets her in (the album's doorbell or a slow poll), the strongest way back later; its cost is a listener on every locked page, a blocked one's included.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** `lock=host` (a private album's lock starts showing its name and host, as a password album shows its name; the host-facing promise, "Guests see a friendly locked screen", holds). · `previous=one`. · Today's screen is option 1, the reference his "polished" is graded against, though its words are true of one cause. · `cover` is drawn though event-safety's carried `nothing-behind` keeps real media off a closed door: it is the far end of what a lock may show, its cost in its means. · The host is named, never a pronoun ("Only Maya can let you in"), since a display name can be anyone's. · The three carried calls above.
- **Look at first:** `lock` at 375, the host's door against the held door, then flip Who is at the door to Dom (only the back-in line moves); then `previous`, the measured line over the three phones. And the first Deferred line: the dashboard, not the door, is where a block shows today.
