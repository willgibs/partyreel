---
track: bible-ten
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f912bb94"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/design/
  - docs/systems/admin-observability.md
  - docs/systems/design-system.md
  - docs/systems/host-app.md
  - docs/systems/marketing-content.md
  - docs/systems/testing-verification.md
  - src/app/(dev)/design/
  - src/app/(marketing)/
  - src/app/globals.css
  - src/app/not-found.tsx
  - src/app/theme.css
  - src/app/two-faces-policy.test.ts
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/share/event-code-modal.tsx
  - src/components/app/share/share.css
  - src/components/app/welcome-flow.css
  - src/components/lab/
  - src/components/marketing/
  - src/components/shared/album-stream/album-stream.test.tsx
  - src/components/shared/album-stream/album-stream.tsx
  - src/components/shared/album-stream/stream-engine.test.ts
  - src/components/shared/backdrop/backdrop-engine.test.ts
  - src/components/shared/backdrop/photo-section.css
  - src/components/shared/backdrop/photo-section.test.tsx
  - src/components/shared/backdrop/photo-section.tsx
  - src/components/shared/backdrop/room-frames.ts
  - src/components/shared/error-digest.tsx
  - src/components/shared/failure-grammar.test.tsx
  - src/components/shared/media-lightbox.css
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/river/river.css
  - src/components/shared/river/river.tsx
  - src/components/shared/trail/trail-engine.test.ts
  - src/components/shared/trail/trail-engine.ts
  - src/components/shared/trail/trail-frames.ts
  - src/components/shared/trail/trail.css
  - src/components/shared/trail/trail.tsx
  - src/components/social/guest-list.tsx
  - src/components/ui/card.tsx
  - src/components/ui/command-palette.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/floating-layer.test.ts
  - src/components/ui/floating-layer.ts
  - src/components/ui/navigation-menu.tsx
  - src/components/ui/popover.tsx
  - src/components/ui/select.tsx
  - src/lib/billing/storage-guard.test.ts
  - src/lib/constants/how-it-works.ts
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/content-policy.test.ts
  - src/lib/elevation-policy.test.ts
  - src/lib/glass.test.ts
  - src/lib/glass.ts
  - src/lib/shared/arrival.ts
  - src/lib/shared/use-scroll-direction.test.ts
  - src/lib/shared/use-scroll-direction.ts
  - src/lib/stripe/change-plan.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/bible-ten

**Goal.** The bible consolidated to the ten principles Will ruled, and every citation in the codebase made to agree: a restating citation removed, a useful one naming its rule, lab data following the old-to-new map.

## The brief

**Will's ruling (2026-09-24).** He asked: "are we sure 25+ rules are better than a good 10?" The answer was no, and he chose "Consolidate to these ten": the bible becomes ten principles. The details the old rules held (radii, elevation, the floating-layer family, the four grounds, the lamps, the masthead) live in the Library's tokens and components, where he can see them. The enforcing tests stay.

**Your first step.** Copy `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/bible-ten/bible.ts` verbatim over `src/app/(dev)/design/rules/bible.ts`. The Orchestrator wrote it from his words, and it passes `bible.test.ts`. Never edit its rules.

**Your job: make the codebase agree with it.** `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/bible-ten/map.json` maps every old rule number to its new one. In your owns:
- A citation of a rule number that only restates what a test or the Library already shows goes. Will: "every added line dilutes the rest."
- A citation that still earns its place names the rule (for example "the bible's One system rule") instead of a number, so the next consolidation can't break it.
- Lab data that resolves rules by number or id (`_data/links.ts`, `influences.test.ts`, `catalog.test.ts`, `status.test.ts`, and anything else the tests find) follows the map.
- Whatever renders the bible's groups follows the four new groups (rising tides, experience, identity, copy).
- Finally run `pnpm design:rules`, which regenerates `rules.generated.json` and `docs/design/library.md`, then the full gate.

**Not yours.**
- The held `reel-guest-wiring` lane owns eight files with citations: `docs/systems/guest-flow.md`, `src/components/guest/entry-modal.tsx`, `src/components/guest/gallery-empty-state.test.tsx`, `src/components/guest/gallery-empty-state.tsx`, `src/components/guest/guest-action-dock.tsx`, `src/components/guest/guest-bar.tsx`, `src/components/guest/upload/stack-tile.tsx`, `src/components/guest/upload/upload-terms.test.ts`.
- `CLAUDE.md` and `docs/PROGRAM.md` are the Orchestrator's.

List each stale citation in those ten files in your Handoff, with its replacement.

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
