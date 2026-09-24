---
track: docs-sharpen
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "49752a48"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - usher/kit/spawn-prompt.txt
  - usher/kit/README.md
  - usher/HEARTBEAT.md
  - usher/moltbook/README.md
  - usher/README.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - AGENTS.md
  - docs/STATUS.md
  - docs/tracks/orchestrator.md
  - src/lib/record-depth-policy.test.ts
---

# lp/docs-sharpen

**Goal.** The docs every session and lane reads at boot, sharpened to what is followed: one-off rules, history, repeats and wordiness cut, every ruling of Will's and every guardrail kept, each cut listed with its reason.

## The brief

**Will's words (2026-09-24, verbatim):** "I feel like we've created more rules than we need to operate on a daily basis. One-offs were likely hit by lesser models and don't need to be written rules that distill others. Our internal workflow docs are key - every added line distills the rest, so it's important we're constantly reviewing that to keep it sharp. Attempting to follow intense comprehensive docs in every round of context reduces both how many things actually get followed, as well as creative context remaining. Elegance tends to win."

**The task.** Sharpen the docs that every session or lane reads at boot:
- `CLAUDE.md` (1,857 words, loaded into every session);
- `docs/PROGRAM.md` (3,013 words, read at every lane's boot);
- `usher/kit/spawn-prompt.txt` (578 words, every lane);
- the Orchestrator's own `usher/kit/README.md` (1,709), `usher/HEARTBEAT.md`, `usher/moltbook/README.md` and `usher/README.md`.

**Cut:**
- a rule that records a one-off mistake rather than a hazard that recurs;
- history, or the story of how a rule was learned (git holds it);
- the same rule stated in two docs (keep it in the one whose question it answers, per CLAUDE.md's "every fact has one home", and point to it at most once);
- a rule a script or test already enforces, where the prose adds nothing the refusal doesn't say;
- phrasing that takes three lines to say one.

**Keep:**
- every ruling of Will's (his quoted words and what they decide);
- the security guardrails;
- the working loop's steps;
- the facts a newcomer cannot find in the code.

When unsure, keep it and list it under Questions. Aim for a real reduction, around a third of the words, but never cut a live rule to reach a number.

**Hand off with** a table of every cut, each with its doc, the line or rule in a few words, and one reason (one-off, history, repeat of X, enforced by Y, compressed), so the Orchestrator can review it in minutes; and the before and after word counts per doc.

**Boundaries.**
- You own the five usher files. `CLAUDE.md` and `docs/PROGRAM.md` are the Orchestrator's alone (no lane may own them): write your sharpened copies to `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/docs-sharpen/CLAUDE.md` (at most 150 lines, the record-depth test's cap) and `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/docs-sharpen/PROGRAM.md`, with their cuts in the same table, and the Orchestrator reviews and applies them at your merge.
- The tests that pin these docs stay green: `src/lib/record-depth-policy.test.ts` (CLAUDE.md at most 150 lines) and anything else the gate finds.
- Never change a rule's meaning while compressing it.
- No other doc is touched: a doc outside these that repeats a rule goes in your Handoff as a line to change.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
