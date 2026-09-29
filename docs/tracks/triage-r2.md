---
track: triage-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "aed50c02"            # the launch-prep SHA the branch was cut from
board: admin-triage
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/admin-triage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/admin-triage.json
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
---

# lp/triage-r2

**Goal.** Draw `admin-triage` round 2: the reports queue as a fast, batch-first workflow where every report carries the context to decide it (Will's note on `look`), a way to ask a reporter for proof, and `phone` asked again so it cannot read as look's phone version.

## The brief

**His round 1 answers** (`docs/reviews/admin-triage.json`, each note there in full): `reason=marked`, `verdict=note`, `closed=window`, `escalate=door`, `idiom=shape`, `notice=deleted` (with a note that `triage-wiring` builds as written, below). They leave `asks`, and their picks are the ground in every frame: `triage-wiring` builds them now, beside you.

**`look=split`, and his note, the direction for this round:** "I don't believe these are our best ideas. I think some balance of this option plus option 3's review queue grid, but reshaped for better speed workflows (fast/batch handling) rather than slow, one at a time. Each report should provide all the context needed to handle or make a decision." And: "while these reports warrant action if true, we may need some way to collect that proof (like email the reporter if needed). Otherwise, we risk taking down real media because of fake reports ... The report mechanism is truly meant for harmful content ... I'll likely ignore/dismiss anything not clearly harmful without clear supporting proof."

**Round 2's questions:**
1. **`look`, the queue.** The widest good set, balancing the split row's words with the grid's speed:
   - batch handling (dismiss many at once: the host queue's picked grammar, 4:5 tiles, a peek, arrows, Enter and Backspace, Undo; see `src/components/app/event-feed/`);
   - every report's whole context at a glance (the frame, the reason or its absence, the reporter's kind, the uploader's other items and reports, the event, any hold);
   - a clear-harm path apart from the rest.
2. **Asking for proof.** How an operator asks a reporter to back a claim, and what the report form must collect for that to be possible. Today a guest's report is anonymous (`report-a-problem-as-a-guest.mdx`: "Reports are anonymous"), so a reply-to address would be new and optional. Draw whether the form asks for one, and what the operator's Ask for proof sends. Mails are the emails board's family: ask nothing `emails` asks (its `reporter` question is a mail to a confirmed reporter about the outcome; this one is a request for proof before one).
3. **`phone`, reworded.** He asked: "Is this simply the mobile version of the question I just answered?" It is not. It asks how much of the act a phone is trusted with (take it down only, the whole act, or take down plus a preserve flag). Word it so it cannot read as look's phone layout, and draw it on your new queue at 375.

The board moves to `round.n: 2` with round 1 in `history` and his notes as the direction. Its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` are yours for this round (named exceptions).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Four asks, not three.** The brief's three plus `harm`: "a clear-harm path apart from the rest" needs something to
  sort it, and whether a guest's Report asks a kind is a guest-facing call with its own drawing (her form at 375), so it
  is an ask staged after `look`, not a carried call. Recommended: ask it (built). Overrule: fold it back into `look` as
  a carried call (kinds on the form, his H either way).
- **One root.** `look` is the root; `harm`, `proof` and `phone` wait on it and are drawn on his queue pick (its
  recommendation before he answers), each reading the others at today. Recommended: as built.
- **`look` recommends `grid`**: the front as small split cards and the sweep as the host queue's grid, his note's
  balance, with the pane (the portal's list beside the report) as the overrule. Measured under each frame: grid 14
  reports on a screen, 4 facts each; pane 9, 3 each, the one in focus 260 px wide with 5; sheet 9, 4 each; albums 10,
  4 each.
- **`proof` redrawn on the relay of his emails `reporter=note`** (a confirmed address only, kept until the report
  closes) and his email-policy note. The typed, unconfirmed optional email first drawn was dropped as against that line.
  The three are: no one (today), only a guest already signed in, and anyone who confirms her email on the form with the
  door's own code. Ask for proof is a mail an operator sends by hand, never automatic, and the address is never printed
  in the portal. Recommended `confirm`; overrule `account`.
- **`phone` gains `sweep`** (take it down, plus the sweep's one Dismiss with its Undo), a middle the batch queue made
  real, and `all` is marked today (the portal withholds nothing at 375). Recommended `stop`, as round one.
- **The kinds' words** are working words for size and wrapping, the wiring's (or voice's) to refine: the album form's
  "Sexual content, or a child at risk", "Violence, a threat or hate", "Someone's private details on show", "Me or my
  child, and I want it down", "Something else", and the person form's "Someone pretending to be me".
- **Four carried calls, drawn above the board**: the keys (the review queue's, mapped: arrows move, X ticks, Enter
  dismisses, Space opens it whole, H moves it to the front), a photo reported twice is one entry, a report shows only
  whether its reporter was signed in, and the front never takes ticks.
- **Doctrine drawn, not asked**: the worst kind arrives with its frame covered (the runbook's "keep human viewing to a
  minimum") and never carries Ask for proof.
- **What the picks would need at wiring** (named so its cut can size it; nothing is built here): one `reports` column
  for whether the reporter was signed in (the only new fact on a report); a report kind under `harm=kinds` or `steer`;
  under `proof=confirm` the form's confirm step on the door's code, and the proof thread (asked and answered on the
  report, a one-time answer page); the kept confirmed address is `reporter=note`'s own. Grouping by media id and the
  photo's state read from rows that exist.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte)

## Deferred (ROADMAP one-liners, bucket named)

- Admin: `reports.media_id` is `on delete set null`, so once a reported photo is purged (a removal's window ending, an
  uploader's withdrawal) its report reads as an album report under All; what a report named should outlive the row
  (found drawing triage-r2's item states).

## Handoff (replaces the chat report)

- The work commit `4f6b9e5f`, pushed; this manifest follows alone. No sync: launch-prep moved (voice-wiring at
  `dbba6a0e`, records after), but nothing landed in this lane's reads and `git merge-tree --write-tree HEAD
  origin/launch-prep` is clean (exit 0), so PROGRAM's Sync rule leaves it to the merge gate.
- Gates on `4f6b9e5f`, each on its own exit code (logs in `partyreel-wt/_scratch/triage-r2/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0 (5 warnings, none in a file this lane touched); `pnpm test` 0 (520 files, 5868
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (222 checks,
  admin-triage 740 of 1200 words); `pnpm lab:demo --board admin-triage --base http://localhost:3131` 0 (look 58.16%,
  harm 49.11%, proof 10.76%, phone 31.11%, no warnings). The board also checked at 375 (the step page) with the frames
  under reduced motion, and the console clean on a fresh tab across every option.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 14 paths under
  `src/app/(dev)/design/sandbox/admin-triage/` + `src/app/(dev)/design/touchpoints.ts` (the board's own row, this
  round's named exception) + this file. `registry.ts` and `boards.ts` needed no change (the same exports).
- The items:
  - `look`: four shapes at 1440 (sheet, list beside the report, review grid with words, by album), the three with a
    peek drawing it as a second frame, live in the frame (ticks, Enter dismisses and the cursor moves on, Undo, arrows,
    Space, Escape).
  - `harm`: three options, each the queue at 1440 on his pick and two guests' Report at 375.
  - `proof`: three options, each her Report and her inbox at 375 and her report in focus at 1440.
  - `phone`: four options at 375 on his pick, the report in front open with only the acts each allows.
  - Round one's drawing files retired with its answered asks (`report.tsx`, `escalate.tsx`, `notice.tsx`,
    `inboxes.tsx`, `confirm.tsx`), so the relayed `TRACKER_WORDS` comment has no file left to refresh.
- Assets requested from Will: none.
- Board ideas:
  - A guest's way to ask the host to take a photo down, short of a report: the help article and `steer` both say "ask
    the host first", and nothing in the product lets a guest ask.
  - The person report (`/u/<slug>`) takes the same kinds if `harm` lands on `kinds` or `steer`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none from this lane (the wiring's needs are under
  Questions).
- Calls his to overrule: `look=grid` (else the pane); `harm=kinds` (else his eye alone, or `steer`); `proof=confirm`
  (else `account`); `phone=stop` (else `sweep`); the four carried calls; `harm` as its own ask.
- Look at first: `/design/lab/admin-triage?session=admin-triage.look` on the grid and its "Space on one" peek, then
  `harm` on `kinds` (the four in front, the student's frame covered).
