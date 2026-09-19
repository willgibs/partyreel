---
track: app-vocabulary
status: open
cut: "73451c79"
board: app-vocabulary   # round one: the shared parts under both shapes: empty, loading, the tile, the toolbar
owns:
  - src/app/(dev)/design/sandbox/app-vocabulary/
reads:
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - src/components/shared/empty-state.tsx
  - src/components/app/dashboard/empty-section-teaser.tsx
  - src/components/app/dashboard/events-empty-teaser.tsx
  - src/components/app/event-feed/feed-section-empty.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/app/event-feed/review-actions.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/my-uploads-gallery.tsx
  - src/components/app/event-settings/uploads-section.tsx
  - src/components/shared/masonry.tsx
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/gallery-skeleton.tsx
---

# lp/app-vocabulary

**Goal.** Round one of `app-vocabulary`: the shared parts under the host app's and the guest pages' shapes, drawn
once so the shapes can assume them. Will (2026-09-19): "a better system from its foundation". Five to seven
decisions on the real components with fixtures at 1440 and 375: NOTHING HERE YET (five different empty states for
one interaction: `EmptyState`, `EmptySectionTeaser`, `EventsEmptyTeaser`, `FeedSectionEmpty`, an inline paragraph;
one parameterised primitive, three ratified tiers, or the status quo written down); LOADING (skeletons for two of
seven routes; a matching primitive everywhere or none); ONE TILE, ONE GRAMMAR (hover-reveal chips on the host
grid, an always-on bar on the bin, tap-to-select on review, chrome-less personal feeds; one component with a mode,
a written decision tree, or two unified and two distinct); the BULK TOOLBAR (labelled buttons on review versus
icon-only on the gallery for the same actions); the GALLERY'S CONTROLS, Will's ask ("Could we make image tile size
an adjustable option in the galleries, likely within/around our filter/sort/controls?"): where a control lives on
the guest album and the host event page, what it offers (the three tile steps: 180, 240, 300), whether sort and
filter join it, how the choice persists; the CONFIRM SWITCH (a switch that asks before it flips, and how a host can
tell). Drawn on the wired galleries (240 to the window). **Not in this round:** any production byte.

**Binds.** The bible; the app's chrome achromatic, media the colour; `masonry.test.tsx` (the overlay a sibling of
the lightbox button); `lit-edge-contract.test.ts`; no em-dashes; the copy is open.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3134`,
  `pnpm lab:demo --board app-vocabulary` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment.
- Every option at 1440 and 375 on the real components with fixtures; a capture of every option beside its words,
  the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- (fill)

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None expected (lab-only).

## Deferred (ROADMAP one-liners, bucket named)

- (fill)

## Handoff (replaces the chat report)

- (fill: the head SHA, the gates on the synced tree, the lane check pasted, the items one line each, the
  questions and their answers, assets, system-doc lines, deferred lines, look at first)

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

(fill)
