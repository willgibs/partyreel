---
track: docs-adr-fold
status: open
cut: "44090827"          # Round 2 of the revamp, the docs diet (2026-09-16)
board: none
owns:
  - docs/adr/
  - docs/systems/
  - docs/SYSTEMS.md
  - docs/PRICING.md
  - README.md
  - docs/specs/reel-v1.md
  - docs/perf/
  - docs/decisions/t1-
  - docs/decisions/t2p5-marketing-ia.md
  - docs/decisions/rpc-suite-blocked.md
reads:
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - docs/design/README.md
  - docs/PROGRAM.md
  - docs/CHANGELOG.md
---

# lp/docs-adr-fold

**Goal.** Fold the 25 architecture decision records into the system docs and delete the directory, so
the repo has one home for every fact (Will, 2026-09-16: "we're over-indexing the importance of archival
documentation"; docs handle "anything active"; history is "highly limited to very recent work" and
"the git history holds the rest"). For each ADR: every invariant that is STILL TRUE becomes one
dateless line under the owning system doc's invariants (or its existing section), in the doc's own
voice, with no provenance clause; a fact the doc already states gets no second line; a decision that a
later change superseded gets nothing (the CHANGELOG and git hold it). The mapping: 0001, 0004, 0014,
0016 → `database-security.md`; 0002 → `architecture.md`; 0003, 0018 → `uploads-and-r2.md`; 0005,
0006 → `marketing-content.md`; 0007, 0008, 0010, 0015, 0017, 0022 → `guest-flow.md`; 0009 →
`notifications.md`; 0011 → `auth-accounts.md`; 0012, 0024 and 0023's reel rulings → `host-app.md`;
0013 → `durability-backups.md`; 0019 → `profiles-social.md`; 0020 → `trust-safety-forensics.md`;
0021, 0025 and 0023's billing rulings → `billing-caps.md` and `docs/PRICING.md`. Then sweep every
"(ADR-00xx)" and `adr/` citation inside your lane (`docs/systems/`, `docs/SYSTEMS.md` loses its ADR
column, `docs/PRICING.md`, `README.md` loses its ADR row) to the plain fact or a link to the system
doc's section; delete `docs/adr/` whole. The same treatment for the rest of your lane: the five
`docs/decisions/t1-*` and `t2p5-marketing-ia.md` tombstones and `rpc-suite-blocked.md` (its two
still-useful lines go in Handoff as ROADMAP one-liners, since the ROADMAP is the Orchestrator's);
`docs/specs/reel-v1.md` (its settled scope and style catalog fold into `host-app.md`'s reel section,
compressed; the file goes); `docs/perf/v1-baseline.md` (one Handoff line gives the Orchestrator the
ROADMAP pointer `git show <your cut>:docs/perf/v1-baseline.md`; the file goes). Not in this round: the
narrative strip of the four heavy system docs (a second lane, after you) and `docs/decisions/design-record.md`
(code still reads it; it leaves with the Library's record pages).

**Binds.** The doc contract in CLAUDE.md "Keeping the docs healthy" (every fact one home; edit in
place; nothing under docs/ is history). ★ NEVER rename or delete a heading in `design-system.md` or
`marketing-content.md`: `touchpoints.ts` anchors these by slug and `docs.test.ts` refuses a missing one
(`#the-identity-achromatic-media-is-the-color`, `#the-shipped-light`, `#light-spill-beam-and-the-lamp-set`,
`#type-the-heading-face-the-tiered-scale`, `#rounding-sharp-surfaces-round-actions`,
`#the-floating-layer-contract`, `#elevation-contract-one-depth-technique-per-mode`,
`#the-arrival-choreography-phase-45-ratified-calm-700ms`), and `docs.test.ts` pins the ★ landmine
blocks' shape (a ★ opens a bullet; a ★ mid-sentence is prose). `docs.ts` reads `design-system.md`,
`marketing-content.md` and `docs/specs/*.md` by path: the six board specs stay. No em-dashes in any
line you write. Keep every edit surgical: the `lab-catalog` and `lab-sweep` tracks run beside you and
may refine a system-doc line for a fact in their lanes, and the Orchestrator reconciles at the merge.

**Verify on.** `pnpm test` green (the doc readers: `docs.test.ts`, `links.test.ts`,
`legacy-routes.test.ts`); `grep -rn "ADR-00\|adr/\|reel-v1\|perf/v1-baseline\|decisions/t1\|rpc-suite" docs README.md`
empty except a `git show` pointer; the Library's doctrine pages for the two design docs render on a dev
server (`/design/library/doctrine/design-system`, `.../marketing-content`) with their anchors intact.

**Discipline on this machine.** Four agents at once is the ceiling: one process at a time; a dev server
only for the render check, on a port of your own, killed by PORT (`lsof -tiTCP:<port> -sTCP:LISTEN | xargs kill`),
never an unscoped `pkill`; never `[preview]` or `[ci]` in a commit message; stage files explicitly;
the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer on every commit.

**Questions.** A decision the goal leaves open goes here, numbered, with your recommended answer; carry
on with the recommendation.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- the whole lane is system-doc edits: list, per doc, the invariant lines added and the citations swept

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The fold, ADR by ADR: kept as <doc>#<section> line "<the line>", or "already stated", or "superseded by <what>"
- The citations left OUTSIDE your lane, for the Orchestrator's sweep at the merge: the `(ADR-00xx)` mentions in `src/` and `docs/ROADMAP.md`, each with the doc and section it now means
- The ROADMAP one-liners from `rpc-suite-blocked.md` and the perf baseline's git pointer
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
