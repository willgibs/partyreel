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
  - src/lib/track-manifests.test.ts
  - src/lib/single-source-policy.test.ts
  - scripts/vercel-ignore-build.mjs
  - docs/decisions/design-record.md
  - docs/perf/v1-baseline.md
announces: []
---

# The integration branch

The Orchestrator's rolling manifest: what `launch-prep` itself is changing this window, and what
landed. Agents sync `origin/launch-prep` mid-round only when a line below touches one of their
`reads` or the MDX registries; otherwise they sync once, before handoff, if it moved.

**This window (round 3, 2026-09-02):** the operating model, the library round, then wave 1 (six
tracks, all integrated; milestones 17 to 19). `src/components/dev/` is released: the library round is
shipped and the `glow-engine-defects` track claims `glow-contrast.ts` there.

## Landed this window

- `ece2a8a` this directory and the manifest guard (`src/lib/track-manifests.test.ts`); no production path.
- `e58dff4` the single-source guard (`src/lib/single-source-policy.test.ts`); no production path.
- `7284933` the MDX registry split: `src/components/marketing/mdx-components.tsx` is now a composer;
  the map moved to `src/components/marketing/mdx/spec-shared.tsx`, with `spec-help.tsx` and
  `spec-blog.tsx` for the content lanes; `content/help/AUTHORING.md` and `content/blog/AUTHORING.md`
  point at them. A lane adding a spec component syncs this.
- `8eeff91` the build gate on request (`scripts/vercel-ignore-build.mjs`) and the marketing stub
  manifest; `3115a6c` `cb38b50` `e45efea` `31697da` the program docs. No production path.
- `89e8e8d` the design gate moved to `src/lib/design-gate/` and `/api/design-gate`; the marketing
  motion tuner (`src/components/dev/marketing-motion-tuner.tsx`) probes the new route. A lane touching
  the tuner syncs this.
- `13920fe` `src/components/dev/lamp-set.ts` (the five lamp literals for JavaScript).
- `9b75ec1` `3e0dfa7` `cee27ae` the lab: `src/app/(dev)/design/` is the library pages, `sandbox/` and
  the four probes; `docs/decisions/design-record.md` holds the rulings; four code comments in
  `blog/`, `press/` point at it. `src/app/(marketing)/marketing.css` now also loads under `/design`
  (its header says so; the file's rules are unchanged).
- `000ecd6` `src/app/globals.css` gained `@source not` for the lab and `docs/`; its `@theme` block and
  the `dark` variant moved verbatim to `src/app/theme.css`. A lane editing tokens edits VALUES in
  `globals.css` and the MAPPING in `theme.css`; `css-source-policy.test.ts` explains.
- Wave 1 integrated: `product-truth` (`1352bb7`: the dashboard, the guest door, `visibility-selector.tsx`,
  `media.ts`, `host-media.ts`, `uploader.ts`), `ci-workflow` (`192c708`: `.github/workflows/ci.yml`; CI
  now gates every push), `legal-billing-truth` (`2f98157`: `.env.example`, the print block in `globals.css`,
  `features.ts`, `jsonld.tsx`, the home privacy ledger, `PRICING.md`, `billing-caps.md`). A lane touching
  any of those syncs this.
- `ec69d7f` `demo-seed` (`scripts/seed-demo-event.mjs`). `b0c2ba3` + `d157d15` `ops-hardening`: `next.config.ts`
  (headers), `src/app/api/cron/purge/route.ts`, `src/app/api/internal/`, `src/app/admin/jobs/`, `src/lib/security/`,
  the Sentry files, `workers/backup/src/`, `.github/workflows/db-backup.yml`, `src/lib/db/types.ts` (job_runs).
  A lane touching the cron route, the Sentry files or the limiters syncs this.
- `244f57e` + `9be533d` `account-deletion`: `src/app/(app)/account/`, `src/app/admin/accounts/`,
  `src/lib/db/mutations/account.ts`, `src/lib/lifecycle/account-deletion.ts`, `src/lib/stripe/account-cancel.ts`,
  the legal constants (1.1), two help articles, `src/lib/db/types.ts` (deletion_requested_at), the cron route
  (one sweep). A lane touching the legal constants or the account page syncs this.
