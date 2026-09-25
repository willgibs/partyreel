---
track: retire-reel-boards
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "dbd04163"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-front/
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-host/
  - src/app/(dev)/design/sandbox/reel-view/
  - src/app/(dev)/design/sandbox/registry.ts
  - src/app/(dev)/design/(shell)/lab/boards.ts
  - src/app/(dev)/design/touchpoints.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/README.md
  - docs/systems/reel.md
---

# lp/retire-reel-boards

**Goal.** Retire the five reel boards whose picks are now built and live on build 9 (`reel-cut`, `reel-front`, `reel-screen`, `reel-host`, `reel-view`), in the house convention, so the desk shows only what still asks Will something.

## The brief

The live reel shipped tonight: the guest and host sides, the clip creator and the tile, per these boards' answers. A board retires once its picks are built.

**The convention** (commit `452f1713`, "guest-verify retired"; read it with `git show 452f1713`): one atomic change across the lists a board lives in:
- `SandboxId` and `DESK_ORDER` in `touchpoints.ts`;
- each board's `RULINGS` row rewritten as shipped, its `lives` list naming the production files that carry the ruling now, and its `board` block removed;
- the spec's entry in `sandbox/registry.ts`;
- the component's entry in `(shell)/lab/boards.ts`;
- the board's folder off the tree.

A badge or a batch marker that points only at a retired board's asks goes with it.

Nothing outside these folders imports them but `boards.ts`. If a retired folder holds a piece another board draws (say `reel-story` or `media-viewer`), move that piece into the reader's own folder rather than keeping the board. `PosterCard` lives in `src/components/reel/` and stays.

The ledgers (`docs/reviews/<board>.json`) are the Orchestrator's to delete at the record, so leave them. `reel-story`, `media-viewer`, `identity-door` and `album-columns` stay.

Run the three lab tests (`touchpoints.test.ts`, `sandbox/registry.test.ts`, `(shell)/lab/_desk/queue.test.ts`) and the whole gate, including `pnpm lab:smoke`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; the three lab tests; `pnpm lab:smoke --base http://localhost:<port>` whole; the desk at `/design/lab` lists none of the five and every remaining board opens.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Carried, not asked** (the current file outranks the manifest's cited example): the brief's convention cites
  `452f1713` (guest-verify), where a retired board's `RULINGS` row is rewritten "as shipped" and kept, `board`
  removed. That convention is gone: `library-lean` (`2bac8693`, already on this branch's cut) turned `touchpoints.ts`
  into standing-boards-only — the file's own header says so ("A board's row goes when its picks are built... nothing
  is rewritten as a rule"), `ruled` became `asks`, `shipped` left, and `Ruling.board` is now REQUIRED, not optional,
  so a kept row with no `board` no longer typechecks. I deleted all five rows whole instead of rewriting them, which
  also matches CLAUDE.md's own map ("What shipped → git log"): this commit is the row's home now. Not a guess — the
  type system settles it — so built rather than raised, per the working loop's "surface... with a recommended
  answer, builds that answer". Also moot: the badge/batch-marker convention the brief mentions is gone too (the
  `overtaken` mechanism it depended on retired before this cut), so there were no badges on any of the five to carry.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commit `6a9da158` on `lp/retire-reel-boards`, pushed. No sync commit: `git merge-base HEAD origin/launch-prep`
  equals `origin/launch-prep`'s tip (`10122b56`) — launch-prep had not moved since the branch was cut from it.
- Gates, all on `6a9da158`: `pnpm typecheck` clean; `pnpm lint` 0 errors (6 pre-existing warnings, all in files this
  lane never touched: `_desk/review-session.tsx`, `home-hero/shared.tsx`, `contact/contact-form.tsx`,
  `album-fill-grid.tsx`, `review-switch.tsx`); `pnpm test` 5322/5322 passed across 480 files; `zsh
  scripts/build-lock.sh pnpm build` green, no warnings. The three named lab tests alone:
  `pnpm vitest run touchpoints.test.ts sandbox/registry.test.ts "(shell)/lab/_desk/queue.test.ts"` → 56/56.
  `pnpm lab:smoke --base http://localhost:3132` → 274 checks, 0 failing (the one 500 in the log is
  `/design/lab/tools/boom`, a permanent intentional boundary probe the script itself allow-lists at `[200, 500]`,
  unrelated to this lane). No `board:` on this manifest, so no `lab:demo`.
- Live check beyond the gate: with the dev server up, all five retired routes 404
  (`/design/lab/{reel-cut,reel-front,reel-screen,reel-host,reel-view}?key=fiesta`); `/design/lab` lists none of them
  and every remaining board still opens (the smoke run above walks all of them at 200).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is exactly the five folders' contents plus
  `registry.ts`, `boards.ts` and `touchpoints.ts` — the full `owns` list, nothing else — plus this manifest file.
  No exceptions: no other lane's file was touched.
- The items: the five boards' `SandboxId` entries, `RULINGS` rows and `DESK_ORDER` entries removed from
  `touchpoints.ts`; their specs removed from `sandbox/registry.ts`; their components removed from
  `(shell)/lab/boards.ts`; `sandbox/{reel-cut,reel-front,reel-screen,reel-host,reel-view}/` deleted whole
  (`git rm -r`). `docs/reviews/{reel-cut,reel-front,reel-screen,reel-host,reel-view}.json` left in place, per the
  brief, for the record commit to delete. `reel-story`, `media-viewer`, `identity-door` and `album-columns` untouched.
  `PosterCard` untouched at `src/components/reel/poster-card.tsx`. A handful of WHY-comments elsewhere still name one
  of the five as the origin of a piece of code or a prior-art citation (`src/lib/validation/event.ts`,
  `src/lib/db/queries/events.ts`, `src/components/app/event-card.tsx`, `src/lib/event/reel-progress.ts`,
  `src/app/(dev)/design/sandbox/identity-door/scene.tsx`, `src/components/lab/scene.tsx`, and a few more boards'
  own spec prose) — left as-is: not imports, and the same footing as any WHY-comment naming a retired board, which
  this codebase leaves standing on purpose (`components/lab/scene.tsx`'s own comment says so: "a board's directory
  is deleted whole at its ruling").
- Assets requested from Will: none.
- Board ideas: none beyond this lane.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each: the RULINGS-row deletion above (Questions section) is the only one; built as
  the current file's own type requires, listed for him to overrule if he wants a "shipped" record kept somewhere
  else instead.
- Look at first: the Questions entry above — it is a mechanical, type-forced call, not a product one, but it is the
  one place this lane's output differs from the brief's literal words.
