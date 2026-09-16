---
track: orchestrator
status: open
cut: "5cdebfe0"          # this window opened at Round 1 of the revamp (2026-09-16)
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/layout.tsx
  - src/app/(dev)/design/(shell)/page.tsx
  - src/app/(dev)/design/_data/links.ts
  - src/app/(dev)/design/_data/links.test.ts
  - src/app/(dev)/design/_data/docs.ts
  - src/app/(dev)/design/_data/docs.test.ts
  - src/app/(dev)/design/_data/legacy-routes.ts
  - src/app/(dev)/design/_data/legacy-routes.test.ts
  - src/app/(dev)/design/touchpoints.ts
  - src/app/(dev)/design/touchpoints.test.ts
  - src/components/dev/motion-tuner.tsx
  - src/components/dev/motion-tuner-config.ts
  - src/components/dev/marketing-motion-tuner.tsx
  - src/components/dev/tuner-store.ts
  - src/components/dev/candidate-style.tsx
  - src/components/dev/app-design-island.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/dev/lamp-set.ts
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - scripts/vercel-ignore-build.mjs
  - .github/workflows/ci.yml
  - src/app/globals.css
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
reads:
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/components/marketing/system/section-shell.tsx
announces:
  - "Round 1 of the revamp (2026-09-16, 5cdebfe0): the lab guards itself against a stale stylesheet (src/components/lab/lab-chrome.tsx reads --lab-css-generation off .lab-shell; bump lab-css-generation.ts and design.css together when a shell rule changes; a stale copy after one reload means the SERVER: stop it, rm -rf .next/dev, start it); every pick toggles (review-store.ts writers toggleAnswer / setAnswerNote / setBoardNote / toggleItemVerdict / setItemNote, an `items` map keyed by itemHoldId); a wide page at 1:1 runs edge to edge (data-lab-bleed on Stage and FrameRow; a bleed inside a bleed keeps its box); board-spec.ts carries ITEM_VERDICTS, LIBRARY_VERDICTS, BuilderVerdict, Candidate.one/verdict/facts, Control.clearable, BoardSpec.catalog and LIMITS.readingWords; .lab-catalog is the unlayered grid in design.css. Two lanes cut: lab-catalog (the review's item scope, the catalog kit, the toolbox, the reading budget, the palette as proof; owns scripts/lab-smoke.mjs this round) and lab-sweep (walk every lab page and fix the shell; owns design.css and _data/glossary.ts this round). docs/reviews/README.md stays here: a grammar change is written into Handoff verbatim and landed at the merge."
  - "The protocol (2026-09-16): docs/PROGRAM.md is the loop (the round, the question route, integration, the record's depth), docs/tracks/README.md the one-round manifest template and the spawn paragraph; a manifest is deleted in its merge commit from here on."
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, what every
open track is doing, and what waits on Will. Agents sync `origin/launch-prep` mid-round only when a
line under `announces` touches one of their `reads`; otherwise once, before handoff, if it moved.

**This window: the revamp (opened 2026-09-16).** Will found the lab broken on localhost and the
explorations turning into papers; the plan he approved runs four rounds: the lab (Round 1, in flight),
the docs diet and the track protocol (Round 2, the Orchestrator's, the protocol part landed), the
Library as the complete inventory and a review surface (Round 3), the six paper boards rebuilt as
catalogs (Round 4, cut once he has walked the palette catalog). The alias still serves Phase 1 of the
Library x Lab round until Vercel's cap frees (2026-09-17 00:13 UTC); every review meanwhile is a local
`pnpm dev` after a hard reload.

## In flight

| track | board | waits on |
| --- | --- | --- |
| `lab-catalog` | `/design/lab/palette` (the proof), `/design/lab/kit` (the toolbox), the desk's item scope | its handoff; then Will's walk of the palette catalog |
| `docs-adr-fold` | none (the 25 ADRs folded into the system docs) | its handoff |

## Waiting on Will

The desk derives it (`/design/lab?key=`: every open ask and every unruled item of every board, from
the specs minus the ledgers in `docs/reviews/`). Assets: [`../ASSETS.md`](../ASSETS.md). Next from
him: a walk of the palette catalog once `lab-catalog` integrates, then the six catalog briefs.

## Landed this window

- `5cdebfe0` the foundation (the guard, the toggle rule, the bleed, the shared types); `28d1aa95` the
  two manifests and the catalog grid; `0c0269ee` to `e8ce341e` the protocol and the record diet;
  `88dafe50` lab-sweep integrated (the shell walked and fixed; its manifest deleted at the merge;
  design.css generation 4); `52241e4f` the dev indicator bottom-right; `ce21ac31` the lab functions'
  file trace cut to 718 files (docs.ts's dynamic root marked turbopackIgnore).

Older windows are in the CHANGELOG (two rounds deep) and in git.
