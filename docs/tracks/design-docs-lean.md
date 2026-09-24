---
track: design-docs-lean
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "38246c39"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/design-system.md
  - docs/systems/marketing-content.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/design-docs-lean

**Goal.** The design system, marketing content and host app docs keep only how the systems work, their invariants and gotchas, and the product's principles as guidance, organized for retrieval.

## The brief

**The job.** Three system docs, `design-system.md` (about 16,000 words), `marketing-content.md` (about 8,800) and `host-app.md` (about 8,500), keep only what a strong model cannot find or infer. That rule's home is CLAUDE.md "Keeping the docs healthy": docs are for security practice, data handling, user safety, how the systems work and their gotchas. Design and past decisions are guidance with their reason, never a law; nothing is treated as perfect, and a change is one edit in its one home.

**What stays:**
- how each system works, where the code alone would not tell a reader;
- the invariants and ★ landmines (a CSS trap, a rendering constraint, a content pipeline's rule);
- security and data facts;
- Will's product principles, as current guidance without dates.

**What goes:**
- tables and walkthroughs that restate what the code or the Library shows (the type ladder, radii, elevation, token values, page-arc walkthroughs);
- design written as law ("binds", "ruled", "must", "never re-judged");
- quotes, dates and provenance;
- platform knowledge that current docs give;
- a fact whose home is another doc (point there once).

**The Library is changing under you.** The `library-lean` lane is turning the Library into three parts, the brand kit, the catalog and the bible's ten, and it retires the rules machinery (`design:rules`, `rules.generated.json`, `docs/design/library.md`, the contracts, policies, landmines and levels). Cut every line that describes that machinery. Where a doc needs the Library, one line says it shows the brand kit, the catalog and the ten at `/design/library`.

**Organize for retrieval.** Each doc opens with the questions it answers, and its sections follow the task that would send someone there.

**Pointers.** Code comments and other docs cite these files, sometimes by section (`git grep -n "<name>.md"`). Keep a section's name where something cites it, or list each pointer to change in your Handoff.

**Hand off with:** words before and after for each doc; the kinds of line cut, one example each; the invariants and ★ lines kept, counted; the pointers to change outside the lane.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` green (the docs tests read these files); every link in a changed doc resolves; the Handoff's before-and-after table.

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
