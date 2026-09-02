---
track: orchestrator
status: open
cut: "0589ccf"
preview: false
owns:
  - src/app/(dev)/design/
  - src/components/marketing/mdx/
  - src/components/marketing/mdx-components.tsx
  - src/lib/design-gate/
  - src/app/api/design-gate/
  - src/components/dev/
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - scripts/vercel-ignore-build.mjs
  - docs/decisions/design-record.md
  - docs/perf/v1-baseline.md
announces:
  - "the design gate leaves the lab: gate.ts / links.ts / gate-check move to src/lib/design-gate and /api/design-gate (the library round); only the marketing motion tuner and the lab import them"
  - "the lab distillation: src/app/(dev)/design shrinks to the library, the record and four open boards; @source not excludes it from the production CSS scan"
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, and what
landed. Agents sync `origin/launch-prep` mid-round only when a line below touches one of their
`reads` or the MDX registries; otherwise they sync once, before handoff, if it moved.

**This window (round 3, 2026-09-02):** the operating model (this directory, the two guards, the
registry split, the build-gate policy, the program docs), then the library round on the lab.

## Landed this window

- `ece2a8a` this directory and the manifest guard (`src/lib/track-manifests.test.ts`); no production path.
- `e58dff4` the single-source guard (`src/lib/single-source-policy.test.ts`); no production path.
- `7284933` the MDX registry split: `src/components/marketing/mdx-components.tsx` is now a composer;
  the map moved to `src/components/marketing/mdx/spec-shared.tsx`, with `spec-help.tsx` and
  `spec-blog.tsx` for the content lanes; `content/help/AUTHORING.md` and `content/blog/AUTHORING.md`
  point at them. A lane adding a spec component syncs this.
- `8eeff91` the build gate on request (`scripts/vercel-ignore-build.mjs`) and the marketing stub
  manifest; `3115a6c` `cb38b50` `e45efea` the program docs. No production path.
