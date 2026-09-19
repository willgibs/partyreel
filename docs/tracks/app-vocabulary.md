---
track: app-vocabulary
status: handed-off
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

- The goal named "five to seven decisions"; this board carries seven, splitting Will's one ask ("the
  gallery's controls") into two staged asks (`gallery-controls-home`: where it lives and what shape it
  takes; `gallery-controls-persistence`: how the pick is remembered, `after` the first). Recommended: keep
  the split. His question named "where", "what it offers", "whether sort and filter join it" and "how it
  persists" in one breath, and the last reads as its own decision once the first three are answered, not a
  config of them.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- None (lab-only, as planned; no `docs/systems/` fact changed).

## Deferred (ROADMAP one-liners, bucket named)

- Now: From `app-vocabulary` (2026-09-19): the Reel Studio (`dashboard/[eventId]/reel/page.tsx`) awaits the
  same presign-heavy read as Dashboard and the event page but carries no `loading.tsx` at all, freezing the
  previous screen rather than showing either treatment, regardless of which `loading` option wins.
- Now: From `app-vocabulary` (2026-09-19): the Likes tab draws two different empty treatments for one
  interaction depending on timing alone (`EmptySectionTeaser` when `dashboard/page.tsx` already knows it is
  empty; a bare `EmptyState` inside `my-likes-gallery.tsx`'s own client-side fallback when unliking the last
  photo empties it), worth one shared answer regardless of which `empty-states` option wins.

## Handoff (replaces the chat report)

- **Head SHA:** `fa9f6a03` (the gate below ran at `04d66530`, the last code commit; this manifest fill is
  the one commit on top, prose only, nothing the gate touches).
- **The gate, each step its own exit code, run on the synced (post-merge) tree:**
  - `pnpm design:rules`: ok (regenerated `docs/design/library.md`, `rules/rules.generated.json`).
  - `node src/app/(dev)/design/gallery/collect-specimens.mjs`: ok (regenerated `specimens.generated.json`).
  - `pnpm typecheck`: exit 0.
  - `pnpm lint`: exit 0 (8 known warnings, 0 errors; none of the eight are mine).
  - `pnpm test`: exit 0 (241 files, 2505 tests).
  - `pnpm build`: exit 0.
  - `pnpm lab:smoke --base http://localhost:3134`: exit 0 (275 checks, 0 failing; `app-vocabulary` reads at
    424 of its 1200-word budget).
  - `pnpm lab:demo --board app-vocabulary --base http://localhost:3134`: exit 0 (7 steps, 0 failing, "every
    step draws its options"; stage movement runs 0.20% to 90.86% across the seven. The two lowest,
    bulk-toolbar and confirm-switch, share one large REAL, unchanged bar or form above a small varying
    excerpt by design; see "look at first" below).
- **The lane check**, `git diff --name-only origin/launch-prep...HEAD`:
  ```
  docs/design/library.md
  docs/tracks/app-vocabulary.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/app-vocabulary/board.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/bulk-toolbar.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/confirm-switch.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/empty-states.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/fixtures.ts
  src/app/(dev)/design/sandbox/app-vocabulary/gallery-controls.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/loading-surfaces.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/scene.tsx
  src/app/(dev)/design/sandbox/app-vocabulary/spec.ts
  src/app/(dev)/design/sandbox/app-vocabulary/tile-grammar.tsx
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Every line is inside `owns`, this manifest, or an explicitly allowed registration file
  (`sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`); `docs/design/library.md` is the
  generated artifact `pnpm design:rules` owns, expected to move. Nothing outside that set.
- **Synced:** `origin/launch-prep` moved between boot and handoff (`album-wiring` and `privacy-concept`
  merged, retiring `album-hero`/`album-page`/`river-card`/`river-visual` and landing `album-motion` and the
  standing `app-shape` board). `git merge origin/launch-prep` (never rebase) at `fa455474`; the three
  registration files conflicted against `album-motion`/`app-shape` landing the same lines: both sides kept
  by hand. Full gate re-run green after (this Handoff's numbers are from the post-merge tree). `app-shape`'s
  own spec.ts confirms the seam: it explicitly defers "the five 'nothing here yet' components, the two bulk
  toolbars, the two tile-action models, the skeletons, the gallery's controls" to this board, so no overlap.
- **The seven decisions, one line each (full text and every option in `spec.ts`):**
  1. **Nothing here yet**: recommend three ratified tiers (a neutral line; the card-less "Reel treatment"
     icon section; a hero with imagery and a CTA for zero events alone), retiring five treatments (six,
     counting Likes' own self-disagreement) to three.
  2. **Loading**: recommend one shared skeleton primitive wired only where a route has a real pre-paint
     wait: Dashboard, the event page, and the Reel Studio, which has none today and freezes blank.
  3. **One tile, one grammar**: recommend two unified (the host grid's and the bin's button-row overlays
     merge into one `TileActionRow`), two left distinct (whole-tile select; the chrome-less personal feeds).
  4. **The bulk toolbar**: recommend icons on both bars: the only grammar that fits the Gallery's five
     actions inside its own measured 375px row (measured live, not assumed from its code comment).
  5. **The gallery's controls, where**: recommend a segmented control joining the row each surface already
     has (the guest album's Download all; the host's Download plus Select), with two reserved,
     non-interactive Sort/Filter slots for the seam Will named in the same breath as tile size.
  6. **The gallery's controls, persistence**: recommend `localStorage`, per device: never an event or
     account setting, and the one mechanism that already works identically for an anonymous guest and a
     signed-in host, at no infra cost.
  7. **The confirm switch**: recommend a shared `ConfirmSwitch` primitive (a glyph plus the deferred-open
     dialog dance, owned once), retiring the two hand-rolled `setTimeout` copies in `uploads-section.tsx`.
- **The one question, and its recommendation:** above ("Questions"); carried on as recommended, per the
  program's rule that an agent never stops to ask in chat.
- **Assets:** none asked. Every option is drawn on real components and real (or copied, captioned) markup;
  nothing here wanted an image, video or generated frame.
- **System-doc lines:** none (see "System-doc edits" above).
- **Deferred lines:** two, above, both "Now"-bucket, both independent of every option on their own decision.
- **Captures:** `pnpm lab:demo` screenshots in its own throwaway Chrome profile and diffs in memory; it
  saves nothing to disk by design (its own file has no `writeFileSync` for a PNG). Verified instead by its
  "0 failing" + "every step draws its options" report, `pnpm lab:smoke`'s clean 424-word reading, and a
  `curl` of the board's SSR'd HTML confirming every decision's title and question actually render (no error
  boundary, no stale copy).
- **Look at first:** `gallery-controls-home` (Will's own ask, the widest stage movement among the "real
  shape changes" group at up to 77% between its three widget shapes, and the one every subsequent decision
  and both sibling boards (`app-shape`, `guest-shape`) will read `--album-column` off) and `tile-grammar`
  (the single widest movement, 90.86%, four real behaviours grouped three different ways). `bulk-toolbar`
  and `confirm-switch` read smallest on the automated diff by construction (two REAL, unchanged surfaces
  anchor every option; only a small excerpt varies): read their words beside the small excerpt, not the
  overall stage.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Round one of app-vocabulary drew the parts under both the host app's and the guest pages' shapes: seven
decisions on the real components, at 1440 and 375, never edited. Recommended: three empty-state tiers over
five treatments; one loading primitive wired to the three routes with a real wait, naming the Reel Studio's
own gap; two of the four tile grammars unified (host, bin), two left distinct (select, chrome-less); icons
on both bulk toolbars, the only grammar the Gallery's five actions fit at 375; the tile-size control joining
each surface's existing row, remembered per device; a shared ConfirmSwitch primitive for the settings
page's two hand-rolled confirm dialogs. Merged at <sha>.
