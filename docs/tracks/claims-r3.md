---
track: claims-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each is built as recommended and is his to overrule; the board draws the first five as its carried calls.

- Where does an option's row sit in the moment card? **Under what she keeps, above the host's row** (her photos lead,
  Follow follows: his guest-capture ordering); else last, under Claim a handle, as r2 drew it. (`line-place`)
- Does the review ever open by itself? **Never**: she opens it from a line, a count or the banner (his banner note).
  (`by-itself`)
- Is a toast or an email a way to point? **No toast** (the confirmation is one beat); **no mail here**: which moments
  send one is `emails`' `moments`, whose overrule already waits on this answer as its echo. (`toast-mail`)
- Does the door's You're in point too? **No**: a held beat with nothing to press (identity-door's). (`door-beat`)
- What happens to an event she never sorts? **It waits**: only a Not mine deletes; the banner keeps counting it; the
  moment card says it once. (`unreached`)
- Does "a notification" reach the album? **Yes**: `bell` counts on her avatar on any album as well as on the app's
  bell, since a guest lives on albums where the app's bell never shows; one row each, never one per event.
- Does `line` say where its button goes? **Yes**: "4 more events have photos waiting on your dashboard." (`here` says
  "waiting for you"), so the tap that leaves the party is no surprise.
- Could two answers pair (a line now, a count until sorted)? **A note on his pick**, not a sixth option: each option
  is drawn alone so the step compares strategies.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/claims-r3`: `f8b0c73c` (the board, round 3) and `224809b4` (the double-tap guard, below);
  this manifest's commit is the head. **No sync**: launch-prep moved by `964c4986` (records) and the `hero-card` merge
  `2f49d417` (its own board, a new `touchpoints.ts` row directly after this board's), neither in my reads;
  `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (tree `a0fd90a9`).
- **Gates** on `224809b4`'s tree, each its own exit code (logs in `../partyreel-wt/_scratch/claims-r3/`):
  `pnpm typecheck` 0 (`typecheck2.log`); `pnpm lint` 0, 5 warnings all in untouched files (`lint2.log`);
  `pnpm test` 0, 499 files, 5624 tests (`test2.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`build2.log`);
  `pnpm lab:smoke --base http://localhost:3135` 0, 249 checks, identity-claims 524 of 1200 words (`smoke3.log`);
  `pnpm lab:demo --board identity-claims --base http://localhost:3135` 0, 1 step, 1.7 screens, 312 words, the stage
  moves up to 26.88% (`demo4.log`). Its one "same picture" warning, quiet = bell, is the compared first frame, which
  differs only by the 16 px count on her avatar by design; their second and third frames differ.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the nine files under
  `src/app/(dev)/design/sandbox/identity-claims/`, this manifest, and `src/app/(dev)/design/touchpoints.ts` (the
  board's own row only: asks, why, note, variants, and `lives` widened to what the options would touch; the brief's
  named exception).
- **Verified** at the 375 and 1440 knob on a 1440 lab, light, dark and reduced motion emulated (captures in
  `_scratch/claims-r3/cap/`, `cap/dark/`, `cap/reduced/`), and pressed live on the step: `line`'s Review all 4 turns
  frame 1 into the dashboard with the review open (Back reads "Dashboard"); Claim, Not mine, the card's dialog,
  Delete, the rest claimed, "All sorted" (9 photos from 3 events; Quiz Night offers Open album alone), Done: the album
  with the toast and the moment card's row gone; Back after two: Tom's Guest card arrives, the banner reads "5 photos
  from 2 events are still waiting for you"; `bell`'s avatar menu row and its bell row each open the review; Not mine
  then Go back decides nothing; closing mid-dialog deletes nothing. Console clean on the step.
- **Items**:
  - `pointer` alone, rewritten around one review: "Priya just confirmed at Maya & Jay's album, and 4 older events wait
    under her email in one review. Where should she first meet it?"; label "Where she meets the review".
  - Five options, each a whole strategy: `quiet` (today), `line`, `here` (recommended), `named`, `bell`.
  - Each drawn as three live frames in the order time runs: now at the album; where she sorts the 4; her dashboard a
    week on if she never does (a row of three phones; a column at the 1440 knob). The step is 1.7 screens (r2's pair
    was 3.7).
  - The ground: r2's picks are the machine's one mode (`batch.ts`); the review is `popups`' `lists=panel` (the side
    panel at a desk; its own screen in a hand whose Back names the page under it).
  - The album as production lays it for a just-confirmed guest: her avatar, the left-pinned column, stats, Add photos
    over Invite, the moment card with its told name, the album's first rows; the shipped PageInviteCard (with Not now).
  - A found hazard, guarded on the board: with each decision saved as made, a double tap on Claim claimed the next
    event too (Tom's and the bonfire in one double tap). An answer now names its card and an arriving card holds its
    answers 250 ms (`224809b4`). `claims-wiring` should carry both, plus the wait for the write.
  - Captions read off the frame and say nothing about a page not on show (the other page after a press, the page
    under an open review).
- **Assets requested from Will**: none (the twelve marketing stills).
- **Board ideas**:
  - `lab:demo`'s same-picture check compares an option's first frame only, so an option whose difference lives in a
    later frame is flagged as the same picture (here quiet = bell); comparing every frame of the stage would end it.
  - A portalled `Frame` copies the lab's `<html>` theme class once per load (`frame.tsx`'s `themeClass` never
    re-subscribes), so the lab's theme toggle leaves every open frame in the old theme until a reload.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the eight Questions above.
- **Look at first**: the desk step `identity-claims.pointer` at a laptop, flipping 1 to 5 (frame 1 what the album
  says, frame 2 where she sorts, frame 3 a week on), then Review all 4 on `line` and on `here`: the same review over a
  different page.
