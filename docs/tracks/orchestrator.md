---
track: orchestrator
status: open
cut: "ffa12b6"
preview: false
owns:
  - src/app/(dev)/design/
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
  - the library phase (Orchestrator-run, no agents; Will, 2026-09-11) touches src/components/marketing/system/ (the hero registers), src/app/theme.css and src/app/globals.css (the rounding), src/components/marketing/sections/features/shared/ and src/lib/constants/feature-pages.ts (the feature-family furniture), the MonoCaption call sites and the single-source homes; no track cuts until it lands
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, and what
landed. Agents sync `origin/launch-prep` mid-round only when a line below touches one of their
`reads` or the MDX registries; otherwise they sync once, before handoff, if it moved.

**This window (the library phase, from 2026-09-11):** rounds A and B shipped at milestone-22
(`ffa12b6`); round C is Will's three sittings and their landings; no track is open. The phase runs on `launch-prep` with no agents: the rules bible in the library
(`/design/rules`), lab to library, the rounding, the hero registers, the feature-family furniture and the
single sources, the light rulings. Its plan is written in its own round; the queue in [`README.md`](README.md)
opens after it. The previous window's landed list (round 3: the operating model, the library round, wave 1,
the glow engine, the marketing branch) is in the CHANGELOG, milestones 17 to 21.

## Landed this window

- `2ae8773` `e062b1e` `38053e8` the rules registry (`scripts/design-rules/`, `src/app/(dev)/design/rules/`,
  `/design/rules` with the verdict island, the component index on `/design`), the library's frames and
  feature-family specimens, and `src/components/marketing/system/caption.tsx` (new, the Inter caption
  atom; the MonoCaption sweep onto it is round B). A lane adding a guard test or a ★ rule regenerates
  the artifact (`pnpm design:rules`) and annotates the file, or `pnpm test` says so.
- `bb00a14` the hero registers: `src/components/marketing/system/page-hero.tsx` (`entrance: blur`, `backdrop`),
  `/help`, `/contact`, `/careers` and `/pricing` composed onto it, `marketing-h1-policy.test.ts` refusing
  `mkt-line` on an h1. A lane composing a hero syncs this.
- `ed85a13` `1c9e025` `e98e5d9` `52c9cb4` `c29c195` `cf5416c` the single sources:
  `src/lib/events/visibility-labels.ts` (the labels left `visibility-selector.tsx`), `REPLY_LINE` in
  `src/lib/constants/contact.ts`, `--mkt-rail-top` in `marketing.css` (every sticky rail), the css policy's
  brace parser, `.surface-ink` in `globals.css` (the footer wears it), `src/lib/shared/use-entered-frame.ts`.
  A lane touching a rail, the footer, the visibility word or the reply line syncs this.
- `84cd975` the MonoCaption sweep: twelve marketing files moved their labels to `system/caption.tsx`.
- `09587a7` `9d89e05` round C staged: `--spill-cadence` in `src/app/globals.css` read by every lamp
  (`footer-glow.tsx`, `film-strip-glow.tsx`, `reel-screen-lamp.tsx`, `system/screen-lamp.tsx`), the
  cadence and rounding knobs in `src/components/dev/motion-tuner-config.ts` (the rounding list shared
  with the lab's playground). A lane placing a lamp syncs this.
- `d5e9389` one FLIP: `src/lib/shared/use-flip.ts` exports `runFlip`; `use-sortable-grid.ts` calls it.
