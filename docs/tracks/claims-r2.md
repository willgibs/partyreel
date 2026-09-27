---
track: claims-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: identity-claims
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-claims/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-claims.json
  - docs/reviews/guest-capture.json
  - src/components/app/dashboard/claims-card.tsx
  - src/app/(app)/dashboard/claims-actions.ts
  - src/lib/db/queries/claims.ts
  - src/lib/guest/claim-uploads.ts
  - src/components/guest/follow-moment-card.tsx
---

# lp/claims-r2

**Goal.** Draw `identity-claims` round 2: the claim batch Will's notes lean to (one event at a time, each decision kept and confirmed inside the batch, each claimed event entered or followed up as you go), with `pointer` asked again in words that fit it.

## The brief

**His r1 answers** (`docs/reviews/identity-claims.json`): `ticket=banner` (a slim banner above the feed with Review), `pass=cards` (one event at a time, each with its own small preview; deciding advances), `confirm=dialog`, `after=profile`, and `pointer=?`.

His notes:
- On `ticket`: "This allows users to handle when they'd like to, rather than filling the screen with a tall card immediately... This question also conflicts with the next, where if we're handling multiple events on a screen here but the next question suggests each claim leads to its own confirmation page, we need a consensus - batch handling with in-batch confirmations, or separate handling? Likely batch, with an action to 'enter'/follow up on each claimed event as you go."
- On `pointer`: "How is this handled with the previous batch of claimable events? For example, I have 4 claimable events - am I visiting a separate follow up confirmation page for each event I claim?"
- On `pass`: "One at a time gracefully forces the handling of each to continue, rather than allowing them to stack endlessly."
- On `confirm`: "Popping up a modal is a very clear way to ensure confirmation. A second in-flow click more easily allows users to think the action was performed without confirmation."

**Production today is one batch** (`src/components/app/dashboard/claims-card.tsx`, `src/app/(app)/dashboard/claims-actions.ts`, `src/lib/db/queries/claims.ts`):
- four events are four rows in one card, with Claim / Not mine per row and Claim all;
- one Finish is one server action: `claim_guest_rows_by_email`, then `disown_guest_rows_by_email` for the rest;
- one dialog covers the leftovers, and one toast follows;
- there is no page per event;
- the device-token path (`claim_anonymous_uploads`, `src/lib/guest/claim-uploads.ts`) claims silently at the album's confirm.

`pointer` asked how she learns that rows wait at other events when she confirms at one album. Production says nothing today: `follow-moment-card.tsx` names only this event.

**This round draws the batch he leans to**, on his r1 picks (banner, cards, dialog and the profile toast, drawn as settled):
- what a decision does as you make it: kept in the batch and undoable until Finish, or saved at once;
- where a deletion's confirmation sits inside the batch: his dialog at the card that says Not mine, or once at Finish;
- the follow-up on each event as you go: "enter" the claimed event's album, or follow its host. This carries `guest-capture`'s follow note: "needs to work within any multi-claim handling. Follow doesn't have to be pushed as hard as a feature relative to uploads/verifications/etc."

Rewrite `pointer` so it cannot read as a page per event.

**Out of this round:**
- Where the banner's review opens (a side sheet in r1's drawing) is the new `popups` board's question, being drawn now. Draw it as r1 did, and ask nothing about the surface.
- `profile-setup` is wiring `after=profile`'s toast line now.

The board's `touchpoints.ts` rows are yours, and nothing else in that file; `node usher/kit/board-card.mjs --desk` lists every open ask.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
