---
track: triage-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
