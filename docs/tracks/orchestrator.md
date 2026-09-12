---
track: orchestrator
status: open
cut: "592da24"
preview: false
owns:
  - src/app/(dev)/design/rules/bible.ts
  - src/app/(dev)/design/rules/bible.test.ts
  - src/app/(dev)/design/rules/rules.ts
  - src/app/(dev)/design/rules/page.tsx
  - src/app/(dev)/design/rules/rules-registry.test.ts
  - src/app/(dev)/design/rules/component-index.test.ts
  - src/app/(dev)/design/rules/rules.generated.json
  - src/app/(dev)/design/record/
  - src/app/(dev)/design/motion/
  - src/app/(dev)/design/stream-probe/
  - src/app/(dev)/design/boom/
  - src/app/(dev)/design/reel-parity/
  - src/components/dev/
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - scripts/vercel-ignore-build.mjs
  - docs/decisions/design-record.md
  - docs/perf/v1-baseline.md
  - src/components/marketing/system/
  - src/app/globals.css
  - src/app/(marketing)/marketing.css
  - src/lib/events/visibility-labels.ts
  - src/lib/shared/use-entered-frame.ts
  - scripts/design-rules/
announces:
  - the "less is more" reset (2026-09-12) rewrote the lab's rules surface and deleted look-pin tests across src/; design-gallery and home-hero cut at its close and own their lab paths (the gallery the family pages and the index, home-hero the sandbox, the dispatcher and touchpoints.ts); the rules files, the record and the diagnostics stay here
  - the rounding and tweaking GUI round (after design-gallery integrates) touches src/components/dev/ (the tuner), src/app/(dev)/design/motion/ and the radius tokens in src/app/globals.css and src/app/theme.css; the light rulings follow it
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, and what
landed. Agents sync `origin/launch-prep` mid-round only when a line below touches one of their
`reads` or the MDX registries; otherwise they sync once, before handoff, if it moved.

**This window (the "less is more" reset, from 2026-09-12):** milestone-23 (`d52b1e6`) shipped the
Vercel cost round and round C's staging; Will's ruling at the merge deferred the sittings and reset the
rules bible: a 22-rule bible, contracts on the components, the look-pins and copy-pins deleted, ★
meaning landmine only, the posture rewritten for big swings. No track is open; at the round's close
`design-gallery` and `home-hero` cut in parallel (the queue in [`README.md`](README.md)). The previous
window's landed list (the library phase's rounds A to C and the cost round) is in the CHANGELOG,
milestones 22 and 23.

## Landed this window

- `f79a711` the bible replaces the registry: `src/app/(dev)/design/rules/bible.ts` (22 rules, Will's),
  the collector reads only tests tagged `@contract-for`, the verdict island and the annotations layer
  deleted, the record page's enforced column gone. A lane adding a component's contract tags the test
  with `// @contract-for: <path>` and regenerates (`pnpm design:rules`), or `pnpm test` says so;
  nothing else it writes is a rule.
- `91606e9` the look-pins and copy-pins deleted (`album-copy.test.ts` and `marketing-voice.test.ts`
  whole; cases in `feature-pages`, `blog-tags`, `feature-door`, `legal-document-contract`); no copy is
  pinned by a test.
- the star pass and the posture: `design-system.md` 40 stars to 18, `marketing-content.md` 52 to 15,
  every survivor a landmine; `CLAUDE.md`'s Build step and convention line, the agent template, the stub
  prompt and the provisional-rules principle now license the big swing.
- `09587a7` `9d89e05` round C staged: `--spill-cadence` in `src/app/globals.css` read by every lamp
  (`footer-glow.tsx`, `film-strip-glow.tsx`, `reel-screen-lamp.tsx`, `system/screen-lamp.tsx`), the
  cadence and rounding knobs in `src/components/dev/motion-tuner-config.ts` (the rounding list shared
  with the lab's playground). A lane placing a lamp syncs this.
- `d5e9389` one FLIP: `src/lib/shared/use-flip.ts` exports `runFlip`; `use-sortable-grid.ts` calls it.
- `4abfa60` `d1a4c66` the Vercel cost round: `next.config.ts` (`outputFileTracingExcludes`, sharp out of
  every route bundle), `scripts/vercel-ignore-build.mjs` (`launch-prep` builds only on `[preview]`),
  `scripts/prune-vercel-deployments.mjs` (new), and the gate's description in `CLAUDE.md`,
  `docs/PROGRAM.md` and `docs/tracks/README.md`. ★ A lane that wants its own preview still says
  `[preview]` or flips its manifest; nothing about `lp/*` changed.
