---
track: pointer-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9427c912"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/follow-moment-card
  - src/components/guest/claim-handle-prompt
  - src/components/guest/event-experience
  - src/lib/guest/confirm-beat
  - src/lib/guest/use-confirm-return
  - src/lib/guest/claim-uploads
  - src/app/(dev)/design/sandbox/identity-claims/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-claims.json
  - docs/systems/guest-flow.md
  - docs/systems/profiles-social.md
---

# lp/pointer-wiring

**Goal.** Build Will's `identity-claims` r3 answer, `pointer=line`, as his note shapes it: the moment after she confirms acknowledges, in one line, the events waiting under her email for her dashboard later, with no way out of the event; fold the card's existing other-events line into it; then retire the board.

## The brief

**His answer** (`docs/reviews/identity-claims.json`, r3): `pointer=line` ("A line here; sorted on her dashboard"), with this note, which shapes it: "Events should feel mostly self-contained for the benefit of the host receiving guest uploads, not attempt to point guests out of the event to their dashboard or past events. Simply acknowledging the existence of other events and allowing that to be handled back on the dashboard later is enough. Don't want too many complications around this, especially prior to upload. Main goal after confirmation is still acting as an active, contributing guest at that event."

**So the line acknowledges, and never leads out:**
- one line in the moment card (`follow-moment-card.tsx`, under what she keeps) says the events waiting under her email are there for her on her dashboard, whenever she likes;
- no Review button and no link out of the event (the option's "Review all 4" is what his note drops);
- the dashboard's banner and the claims review (claims-wiring `19ff4d33`) stay where they are sorted.

**Say the other events once** (ROADMAP's Identity line, from `claims-wiring`): the card already says `ELSEWHERE_LINE` ("Your uploads from other events are in your account too.", `confirm-beat.ts`) when this device's session tokens carried uploads elsewhere (`claim-uploads.ts`'s `elsewhere`). The waiting events are a different fact: rows typed under her email elsewhere, waiting in the claims review. Fold both into one line, true in each case (only one of them, both, neither), so the card never says "other events" twice. The count of waiting events needs a read she is entitled to as the signed-in owner of that email; use what the dashboard's banner reads, and never trust the client for it.

**Before her first upload** (a confirmation from her name menu or the door before any upload): nothing about the waiting events. His "especially prior to upload"; the dashboard's banner holds them.

**Then retire `identity-claims`** in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions; the ledger is the Orchestrator's to delete). Its other answers are built (claims-wiring).

**Words:** plain and warm, in the card's own voice (`voice-guest` round 2 is asking the keep's and the tracker's words, not these). Say your wording under Questions for Will to overrule.

**Verify:**
- Vitest for the line's cases: here only; elsewhere only; waiting only; both; before an upload.
- The moment card at 375 and 1440.
- The live walk needs a real confirmation with claimable rows, which is Will's staging, stacked with the claims review's walk; say what the red-team cannot see.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The line's words.** Built: waiting only, "4 more events have photos waiting on your dashboard, whenever you
  like." ("Another event has photos waiting…" for one); her uploads elsewhere alone keep "Your uploads from other
  events are in your account too."; both, "Your uploads from other events are in your account too, and 4 more events
  have photos waiting on your dashboard, whenever you like." Recommended as built: his `line` tile's own words plus
  the brief's "whenever you like". Overrule: the tile's words alone, measured one line shorter at 375 (waiting 2
  lines, not 3; both 4, not 5).
- **Where the line sits.** Built: events waiting under her email are their own row, with the dashboard banner's
  envelope and nothing to press, under what she keeps and above the host (the tile's carried `line-place`); her
  uploads elsewhere alone still finish the keep's sentence, as they ship; both are that one row. Recommended as built.
  Overrule: one place always (the row even for her uploads elsewhere alone, or the keep's sentence even for waiting
  events, with no row at all).
- **This album is never one of them.** Built: rows typed under her email at this very album on another device are
  left out of the count (they are not "more events"), and her dashboard's banner holds them. Recommended as built.
  Overrule: count them too, in words that do not say "more".
- **Only the moment says them.** Built: the one toast a confirmation without a moment says (every one before her
  first upload here, and a sign-in no confirm door opened) never names the waiting events. Recommended as built.
  Overrule: the toast's description joins them after a first upload.

## System-doc edits (in place, owned facts only)

- none by the lane: `guest-flow.md` is a read, so its two lines are in the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- Work commits, pushed: `40c970e8` (the moment card says the other events once, in one line that never leads out),
  `8941708f` (`identity-claims` retired, one commit). No sync: launch-prep moved to `2c7c86e0` (safety-refresh,
  hero-r2, help-refresh, marketing-refresh and their records), none touching this lane's reads, and the merge is
  clean (`git merge-tree --write-tree HEAD origin/launch-prep` exit 0; a trial `git merge --no-commit` ran
  `src/app/(dev)/design` and the track manifests green, 25 files and 361 tests, then aborted). The head is in the
  chat line.
- Gates on `8941708f`, each on its own exit code (logs `partyreel-wt/_scratch/pointer-wiring/`): `pnpm typecheck` 0
  (`typecheck-2.log`); `pnpm lint` 0 (`lint-2.log`: 0 errors, 5 warnings, none in a touched file); `pnpm test` 0
  (`test-2.log`: 511 files, 5761 tests); `zsh scripts/build-lock.sh pnpm build` 0 (`build-1.log`);
  `pnpm lab:smoke --base http://localhost:3132` 0 (`smoke-1.log`: 234 checks, 0 failing). Before the wiring commit
  the same first three were green on its content before the formatter and one comment's rewording (`*-1.log`: 511
  files, 5763 tests), and after them the touched files' lint and the guest suites (60 files, 716 tests).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, with the exceptions:
  `src/app/(dev)/design/touchpoints.ts`, `src/app/(dev)/design/sandbox/registry.ts` and
  `src/app/(dev)/design/(shell)/lab/boards.ts` (the brief's named retirement exceptions, `identity-claims`' lines
  only); `src/components/app/dashboard/claims-batch.ts` and `claims-review.tsx` (one comment each drops the retired
  folder's path, which would otherwise name a directory that no longer exists). `src/lib/guest/confirm-beat-action.ts`
  and its test are new files under the owned `src/lib/guest/confirm-beat` prefix.
- `otherEventsLine` (`confirm-beat.ts`): one line for the two facts about other events, true in each case (here only
  null; her uploads elsewhere `ELSEWHERE_LINE`, unchanged, still the toast's words; waiting; both as one sentence
  saying "other events" once), counts through `formatCount`.
- The moment card (`follow-moment-card.tsx`, `waiting`): waiting events stand as one row
  (`data-follow-moment-others`, lucide `Mail` as the dashboard banner wears it, the handle row's type) under what she
  keeps and the told name, above the host; no button, no link (the tile's "Review all 4" is what his note dropped);
  her uploads elsewhere alone stay in the keep's sentence; the waiting events alone are enough for the card to stand.
- The count (`confirm-beat-action.ts`, `countWaitingEventsAction(qrToken)`): a Server Function over the dashboard
  banner's own read, `getMyClaimableGuestRows()` without previews (its `getRequestAuth` re-verifies with `getUser()`,
  and `list_guest_rows_by_email` keys on `auth.uid()` and lists nothing for an unconfirmed address); the album on
  screen, resolved from its token by `getEventByQrToken`, is left out; nothing waiting is one read and never resolves
  the album; a number and nothing else leaves; a token that is not a 1 to 200 character string reaches no read; any
  failure answers 0 and is captured (`account`, seam `moment_waiting`). No new SQL.
- Read for the moment alone (`claim-handle-prompt.tsx`): the count is asked only when the album hands the slot
  `moment`, beside the profile read, and the card waits for it and is drawn once (resolving renders nothing); a
  failed read drops the line, never the moment. No moment plays before her first upload here (a claim that moved
  nothing of this album plays nothing, `use-confirm-return.test.tsx`'s own pin), so nothing asks and nothing is said,
  and the toast (`confirmBeatToast`) takes no count at all. `event-experience.tsx`: the return's comment says so (and
  one import line the formatter split).
- Pins: `otherEventsLine`'s cases (here only, elsewhere only, waiting only at 1, 4 and 1,234, both, "other events" at
  most once) and the toast before an upload (`confirm-beat.test.tsx`); the card's four cases, its row's place and
  nothing pressable in it (`follow-moment-card.test.tsx`); the prompt asking only for the moment, for this album, not
  signed out, not before a first upload, and saying nothing on a failed or empty read (`claim-handle-prompt.test.tsx`);
  the action's parse, scope, one read, number-only answer and failure (`confirm-beat-action.test.ts`, new). Three
  mutations (the album not left out, the read on every rung, her uploads elsewhere as a row) each failed exactly its
  pin, then were reverted.
- Verified locally on :3132: the production card in the album's column (a temporary, uncommitted harness route
  rendering `FollowMomentCard` per case), captured in headless Chrome at 375 (mobile) and 1440, light and dark,
  reduced motion (`caps/`, 20 PNGs, `cap.mjs`): the row reads 3 lines at 375 and 1 at 1440 for waiting only, 5 and 2
  for both, and holds 0 pressables; the card stands 306px at 375 with no other events, 354 with her uploads elsewhere,
  411 with waiting events, 459 with both. The Server Function through Next's real pipeline, signed out: a token, an
  empty string, a number, a list, an object, a 5,000-character string and null each answered `0` (a number), in 0 to
  2ms (`dev.log`). The demo album answers 200 with the new import graph; the retired board's URL answers 404, as
  `identity-door`'s does.
- What the red-team cannot see: the alias carries this lane only from the Orchestrator's next build, and even then
  the row shows only for a real confirmation (a code or Google) that claims this album's own uploads while rows typed
  under that address wait at other events. That is Will's staging, stacked with the claims review's walk: pending
  rows at two or more other events for the account, one photo uploaded signed out at a names-mode album, then Confirm
  your email through the chooser; the card should say "N more events have photos waiting on your dashboard, whenever
  you like." with nothing to press, and the dashboard's banner should count the same events plus any at this album.
  Without staging the red-team can see the card with no row, the toast before a first upload with no row, and the
  action answering 0 to a signed-out or malformed call.
- `identity-claims` retired (`8941708f`): the Orchestrator deletes `docs/reviews/identity-claims.json`.
- `guest-flow.md`, for the Orchestrator, each in place:
  - `ClaimHandlePrompt`'s ladder, **just confirmed**: "the other events said once, in one line that never leads out
    (`otherEventsLine`, [`confirm-beat.ts`](../../src/lib/guest/confirm-beat.ts): her uploads elsewhere finish the
    keep's sentence; events waiting under her email stand as one row with the dashboard banner's envelope and nothing
    to press, "4 more events have photos waiting on your dashboard, whenever you like."; both are that row)".
  - "A CONFIRMATION IS ONE BEAT", after "its card says the other events once and tells the name;": "the events waiting
    under her email are the moment's alone, counted on the server from the dashboard banner's own list and never this
    album ([`confirm-beat-action.ts`](../../src/lib/guest/confirm-beat-action.ts)) and read only when the moment plays,
    so a confirmation before her first upload here, and every toast, says nothing of them (her banner holds them);".
- ROADMAP line this closes: Identity's "when `identity-claims`' `pointer` is wired, its moment-card row and the card's
  other-events line … folded into one row with its one Review" (folded as one line, with no Review, as his note asks).
- Assets requested from Will: none.
- Board ideas: the moment card now stands 411px at 375 when events wait (the keep, the told name, the waiting row, the
  host, the handle; 306px with none), under Add photos; a board could ask whether the handle's row waits for her next
  visit when the waiting row stands, keeping the album close under the upload (his "Main goal after confirmation is
  still acting as an active, contributing guest at that event").
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the four under Questions (the words, where the line sits, this album left out, only the
  moment says them); and the card waiting for the server's count so it is drawn once (a slow read delays the card, a
  failed one drops only the line).
- Look at first: `caps/waiting-375-light.png` and `caps/both-375-dark.png` in `partyreel-wt/_scratch/pointer-wiring/`,
  then `otherEventsLine` in `confirm-beat.ts` and `confirm-beat-action.ts`; live, the staged walk above with the
  claims review's.
