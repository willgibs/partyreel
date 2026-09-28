---
track: pointer-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
