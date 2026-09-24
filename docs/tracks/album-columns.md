---
track: album-columns
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6afa7831"            # the launch-prep SHA the branch was cut from
board: album-columns
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/album-columns/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/shared/masonry.tsx
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/album-columns

**Goal.** The album's column rule explored afresh: how the album fills the width on a phone, a laptop and a big screen, drawn as decisions on real albums.

## The brief

**The ask.** Will wants the album's column rule explored from the ground up, now. It is the grid every album is: the guest's album, the host's feed, the skeleton and the marketing album stage.

**Production today, a working version.** The shared masonry (`src/components/shared/masonry.tsx`) runs two columns under 640 px. Above that, it lays columns of a target width, `--album-column`, with a 220 px floor, and the guest's three-step tile-size control sets that width. The gap is `--gap-gallery`. The host's feed (`src/components/app/event-feed/event-gallery.tsx`) and the guest album (`src/components/guest/live-gallery.tsx`) share the rule. Other boards drew this rule as settled, which is exactly why nobody improved it. Treat nothing about it as decided. Look at real albums at 375, 1440, 1920 and wider, and find the best rule you can.

**Room to explore** (you find the real questions; these are only the territory):
- how wide the album runs: a contained column, a wide container, or full bleed;
- how the columns are chosen: a target width, a count per breakpoint, a density the viewer sets, or something new;
- the gaps and the tile corners at that density;
- the phone, and the largest screens;
- whether the host's feed and the guest album share one rule;
- whether the tile-size control stays, and in what form.

**Drawing.** Draw every option on a real fixture album (`src/app/(dev)/design/sandbox/gallery-fixtures.ts`) with mixed aspects, at the widths where the difference shows. Add a width control wherever it helps him judge.

**Registration.** Your board's lines in `sandbox/registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts` are the one listed exception to your owns. `library-lean` owns those files and is reshaping `touchpoints.ts`, so register after `album-motion`, the nearest standing board, and ask nothing it asks. Whichever lane lands second syncs past the other.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 375, 1440 and 1920 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board album-columns` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `5998f20d` on `lp/album-columns`, pushed. No sync commit: `origin/launch-prep` moved 23 commits
  (`dca06bfe` → `df58f7e4`, mostly `systems-lean`'s merge and doc records) while this lane ran, but
  `git diff --stat dca06bfe origin/launch-prep -- touchpoints.ts registry.ts boards.ts masonry.tsx gallery-fixtures.ts`
  is empty: `library-lean` has not merged, nothing in `reads` moved, so this hands off on its base per the
  Orchestrator's sync rule (code touching this lane's work has not landed).
- Gates, all on `5998f20d`: `pnpm typecheck` clean; `pnpm lint` 0 errors (8 pre-existing warnings, none in
  this lane's files); `pnpm test` 434 files / 4778 passing / 1 skipped; `pnpm build` via the shared build-lock,
  exit 0; `pnpm lab:smoke --base http://localhost:3133` 496 checks, 0 failing, this board's reading 293/1200
  words; `pnpm lab:demo --base http://localhost:3133 --board album-columns` 5 steps, 0 failing (one honest
  "same picture" note on `phone`: at its default 600px, `scales` and `step-three` both land on 3 columns,
  which is real — with only two possible counts in the phone range and three options, some pair always ties).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 9 files under this lane's `owns`, plus
  `registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts` (the one listed exception, registered directly
  after `album-motion`: an import + a `REGISTERED`/`BOARD_COMPONENTS`/`SandboxId`/`RulingId`/`DESK_ORDER` line
  each, and one new `RULINGS` row), plus `docs/design/library.md` (regenerated by `pnpm design:rules`, required
  by `rules-registry.test.ts` the moment `touchpoints.ts` changes; a mechanical byproduct, not an editorial edit).
- Five decisions, each the real `MasonryColumns` on the real fixture album, never a mock:
  - `width` — the album's own gutter: a fixed 20px edge (today), a ~2200px cap then centred, or true bleed
    (0px, phone included). Recommended: edge, as today.
  - `scale` — the biggest screens: an unlimited 220px floor forever (today, ~15 columns at 3440), a floor that
    steps up past 1920, or a hard 8-column ceiling. Recommended: the growing floor.
  - `phone` — below 640px: a fixed two columns everywhere (today), the same width rule with a ~160px floor, or
    one more explicit breakpoint at 480px. Recommended: fixed two, as today.
  - `scope` — tile size is one cookie (`pr_tile_size`, `path: "/"`) shared by hosting and guesting today,
    found while reading `tile-size-cookie.ts`, decided by nobody. Options: shared (today), split into two
    cookies, or one cookie with different untouched defaults. Recommended: split.
  - `control` — the tile-size control: three named steps (today), a continuous slider, or five named steps.
    Recommended: three steps, as today.
- Assets requested from Will: none (every preview reuses the fourteen bootstrap stills already in
  `gallery-fixtures.ts`).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `width`: if the biggest screens read thin and scattered, take contained; for a native camera-roll feel on
    a phone, take bleed.
  - `scale`: if more, smaller photographs is genuinely the goal at any size, unlimited is the honest answer.
  - `phone`: if a big-phone/small-tablet guest audience is real, step-three earns real space back.
  - `scope`: if "my size, wherever I am" is the simpler mental model for the rare host-who-also-guests, shared
    stays.
  - `control`: if reviewers keep landing between two steps wanting one neither offers, five-step or the slider
    earns its keep.
- Look at first: `scale` (`#album-columns-scale`) — the one genuine "found a bug" moment (an unbounded 220px
  floor really does put ~15 columns on a 3440px monitor) — then `scope` (`#album-columns-scope`), the
  shared-cookie coupling nobody decided on purpose.
