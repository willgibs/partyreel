---
track: docs-systems-strip
status: open
cut: "aea90fd3"          # Round 2 of the revamp, after the ADR fold merged (2026-09-16)
board: none
owns:
  - docs/systems/
  - docs/design/guidance.md
reads:
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - docs/design/README.md
  - docs/PROGRAM.md
---

# lp/docs-systems-strip

**Goal.** Strip the narrative out of the four heavy system docs so each is the system and its
invariants and nothing else (Will, 2026-09-16: docs handle "anything active"; history is "highly
limited to very recent work"; "if we design something weird badly in the same form we've done before,
we can address and refine in track"). The four: `design-system.md` (about 990 lines, 45 dated
passages, 28 ★), `marketing-content.md` (about 640 lines, 31 dated), `testing-verification.md` (about
350 lines, 23 dated), `host-app.md` (about 445 lines, 14 dated). A date survives only as the
attribution of a ruling that is still the rule; provenance clauses, milestone and round names, and
every sentence narrating how a fact arrived go; a fact stays as one dateless line in the doc's voice.
**Every ★ is audited against Will's rule**: a ★ marks a silent breakage if reverted, never a design
decision. A true landmine stays byte-identical but for its provenance clause; a design preference
wearing a ★ is demoted to a plain line or deleted (design-system.md is the likeliest place for lore).
The craft-guidance section leaves `design-system.md` for `docs/design/guidance.md` (the Library
renders both; guidance is not a rule). Add one landmine the `lab-sweep` track found, under
`testing-verification.md`'s CSS section: ★ a bare `overflow-x: clip` is dropped by Lightning CSS for
the configured targets and survives only inside `@supports (overflow: clip)`; the `@supports` in
`design.css` is load-bearing; read the compiled chunk, not the source, before believing a lone modern
value. The other system docs get the same treatment only where a sentence is pure narrative; do not
rewrite them.

**Binds.** CLAUDE.md "Keeping the docs healthy". ★ The headings `touchpoints.ts` anchors and
`docs.test.ts` checks are FROZEN: `#the-identity-achromatic-media-is-the-color`, `#the-shipped-light`,
`#light-spill-beam-and-the-lamp-set`, `#type-the-heading-face-the-tiered-scale`,
`#rounding-sharp-surfaces-round-actions`, `#the-floating-layer-contract`,
`#elevation-contract-one-depth-technique-per-mode`,
`#the-arrival-choreography-phase-45-ratified-calm-700ms` (this one may be renamed only together with
its `lives` line in `touchpoints.ts`, which is the Orchestrator's: ask in Handoff). `docs.test.ts`
pins three landmine fixtures by text (run it after every ★ edit; it names the one it lost). A ★ opens
a bullet; a ★ mid-sentence is prose. No em-dashes in any line you write.

**Verify on.** `pnpm test` green; the Handoff's before-and-after counts per doc (lines, dated
passages, ★) with every demotion listed as "was: <line> / now: <line or deleted> / why"; the two
doctrine pages rendered on a dev server with their anchors intact.

**Discipline on this machine.** Four agents at once is the ceiling: one process at a time; a dev
server only for the render check, on a port of your own, killed by PORT; never `[preview]` or `[ci]`;
stage files explicitly; the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

**Questions.** A decision the goal leaves open goes here, numbered, with your recommended answer;
carry on with the recommendation. A ★ you cannot classify is a question, not a coin toss.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- the whole lane: per doc, the counts before and after and the demotions

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Per doc: lines before/after, dated passages before/after, ★ before/after; the demotions listed
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
