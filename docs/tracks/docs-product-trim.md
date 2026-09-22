---
track: docs-product-trim
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "adbb90e0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/PRD.md
  - docs/PRICING.md
  - content/blog/AUTHORING.md
  - content/help/AUTHORING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - docs/systems/billing-caps.md
---

# lp/docs-product-trim

**Goal.** `docs/PRD.md`, `docs/PRICING.md` and the two content authoring guides state current truth in the present tense: no dates, rounds, "ruled" or "built" provenance, cut numbers or narratives; every number and claim checked against the code; the pricing doc gains Pro's case. A docs-only lane: no behaviour changes.

## The brief

**Will's words for this (2026-09-22):** "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight that distills future-facing efforts. It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'." The four reshape lanes already did this for the ROADMAP, ASSETS, the system docs and the rulings log; these four files were outside them.

**The rule:** a doc states the current rule, fact or state in the present tense, with at most a one-line why. Delete dates ("locked 2026-05-29"), provenance ("ruled + BUILT", "Will's decision"), phase and cut labels ("Phase 3", "Cut 4b"), and narratives; a stale line is deleted, never marked. Keep every heading that another doc or the code links to (`git grep -n "PRICING.md#\|PRD.md#" -- src docs content CLAUDE.md` before renaming anything) and every fact an agent needs (the tier table, the caps, the Stripe price table with its env keys, the grandfathering policy stated as policy, the unit economics).

**Verify every number and claim** against `src/lib/constants/tiers.ts` (the single source of pricing and limits; `public.tier_limits()` mirrors it) and the code it names; a claim the code contradicts is corrected to the code, and listed in the Handoff.

**Pro's case, a new line in `PRICING.md`'s model section (from the rulings the docs-rules lane distilled):** "Pro's case is what one big event needs (videos, more storage, the longer reel), never only hosting again: most paid hosts hold one event, a wedding above all, so a line that sells Pro as 'for your next event' loses them."

**Leave the reel's lines alone** in both docs (PRD step 5, PRICING's watermark and reel-length lines): they describe what ships until the reel round's wiring replaces the stored reel, and that round's sweep lane rewrites them. `content/help/` and `content/blog/` articles are not yours; only the two `AUTHORING.md` guides.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` (the content and docs policies), `pnpm lint`; no build needed for a docs-only lane. The Handoff lists every line changed for a fact (what the doc said, what the code says) and every heading kept for a link.

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
