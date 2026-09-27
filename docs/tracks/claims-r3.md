---
track: claims-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: identity-claims
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-claims/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-claims.json
  - src/components/app/dashboard/claims-card.tsx
  - src/lib/guest/use-confirm-return.ts
  - src/lib/guest/confirm-beat.ts
  - src/components/guest/follow-moment-card.tsx
  - docs/systems/guest-flow.md
---

# lp/claims-r3

**Goal.** Draw `identity-claims` round 3: `pointer` alone, asked again with the best options on the table now that his r2 answers settle the review (each decision saved as it's made, the dialog at the Not mine card, Open album and a quieter Follow).

## The brief

**His r2 answers** (`docs/reviews/identity-claims.json`): `save=once` (a claim is added as she taps it; a Not mine is deleted once its dialog says so; closed early, what she did stays done), `confirm=card` (the dialog at the Not mine card), `next=both` (Open album on every row, a quieter Follow beside it where the host has a page). His note on confirm: "Individual, immediate handling 1 by 1 is likely best for claims here..." And on `pointer`, unclear a second time: "Coming off of some of my prior selections, I just wanted to flag this to be sure we have our best options on the table."

**The question** (r2's words: "When Priya confirms at one album and 4 more events wait under her email, what should the album say?"). With his answers the review is a queue that saves as it goes, so the album's answer can be more than a line: draw the widest good set, each on the real album and the real dashboard, each option's consequence for her four other events visible (where she sorts them, when, and what she sees if she never does). Candidates to weigh, not a list to copy: nothing here, the dashboard's banner the one place; a line where she lands, linking to the dashboard's review; the review opened right there over the album, one card at a time; the moment card itself naming them with a Review; a notification. Rewrite the question itself so it cannot read as a page per event (his r1 reading).

The board's other asks leave `asks` (the ledger keeps them); its drawings of r2's picks become the ground. `claims-wiring` builds r2's answers after `popups-wiring` merges (the review in the lists panel): draw the review as `popups`' `lists=panel` places it (a side panel at a desk, its own screen in a hand). The board's `touchpoints.ts` rows are yours (nothing else in that file); `node usher/kit/board-card.mjs --desk` lists every open ask.

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
