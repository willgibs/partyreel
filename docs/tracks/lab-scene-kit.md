---
track: lab-scene-kit
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "6d27b17a"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/
  - src/app/(dev)/design/sandbox/guest-capture/scene.tsx
  - src/app/(dev)/design/sandbox/host-curation/scene.tsx
  - src/app/(dev)/design/sandbox/host-storage/scene.tsx
  - src/app/(dev)/design/sandbox/identity-claims/scene.tsx
  - src/app/(dev)/design/sandbox/identity-door/scene.tsx
  - src/app/(dev)/design/sandbox/identity-profile/scene.tsx
  - src/app/(dev)/design/sandbox/profile-page/scene.tsx
  - src/app/(dev)/design/sandbox/reel-cut/scene.tsx
  - src/app/(dev)/design/sandbox/reel-front/scene.tsx
  - src/app/(dev)/design/sandbox/reel-host/scene.tsx
  - src/app/(dev)/design/sandbox/voice-guest/scene.tsx
  - src/app/(dev)/design/sandbox/reel-screen/wall.tsx
  - src/app/(dev)/design/sandbox/site-chrome/stage.tsx
  - src/app/(dev)/design/sandbox/voice-guest/parts.tsx
  - src/app/(dev)/design/sandbox/voice-guest/lines.ts
  - src/app/(dev)/design/sandbox/voice-guest/spec.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
---

# lp/lab-scene-kit

**Goal.** Lift the lab's copied `Fit` and `Measured` helpers into the kit (`src/components/lab`) so every board imports one version, keep `Scene` per board (its props differ), and clear the voice-guest board's comments that still name save. Nothing any board draws may change: Will is reviewing these boards on the desk.

## The brief

**The ROADMAP line (the rulings round wrote it).** "The lab and the kit: `Scene`, `Fit` and `Measured` are copied verbatim in three boards (`guest-capture`, `identity-door`, `voice-guest`); lift them into `src/components/lab`." The Orchestrator's maps found it wider: `Fit` is identical in 12 files (the `scene.tsx` of `guest-capture`, `host-curation`, `host-storage`, `identity-claims`, `identity-door`, `identity-profile`, `profile-page`, `reel-cut`, `reel-front`, `reel-host`, `voice-guest`, and `reel-screen/wall.tsx`); `Measured` matches `guest-capture`'s in several boards with small variants in others, and `voice-guest`'s re-measures after web fonts load (a strict superset); `Scene` is NOT one component: its props differ board to board (`screen`, `short`, `tall`, `caption`), about 24 board files call the local ones, and `site-chrome/stage.tsx` holds a different `Scene` with its own `type Measured`.

**The job.** Lift `Fit` and `Measured` (voice-guest's, with the fonts re-measure) into `src/components/lab/scene.tsx`, exported from `src/components/lab/index.ts`; every board copy imports them instead, in ONE change, so `src/components/lab/kit-discipline.test.ts` can add the two names to the kit-owned list (it refuses any registered board that declares a kit name). `Scene` stays per board: say so in the kit's comment and narrow the ROADMAP line to that finding in your Handoff (the Orchestrator rewrites it). A board whose `Measured` differs in a way that matters keeps its behaviour through the kit's props, never by a silent change in what it draws.

**Also in this lane.** The comments that still name save in the `voice-guest` board: `parts.tsx:418`, `:425`, `:473` (`save-event-button.tsx` no longer exists; the `save` wear is called `keep` now), `lines.ts:148`, and `spec.ts:383` ("the door's save words"). Will's own quoted words (`spec.ts:379`) stay.

**Nothing a board draws may change.** Will is reviewing these boards on the desk now. Verify with `pnpm lab:smoke` whole and `pnpm lab:demo --board <id>` on every board you touch, and compare captures before and after (the drawings stay byte-for-byte or the Handoff names the difference and why).

**Boundaries.** Own only the files you edit, by name: `src/components/lab/` and each board file (never a whole board folder: `guest-followons` owns five boards' `fixtures.ts`, and a new `event-safety` board is being built beside you). No production file. This lane merges first; the `event-safety` board imports the two from the kit after it syncs past you.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>` whole, and `pnpm lab:demo --board <id> --base http://localhost:<port>` on every board you touch, with the captures compared before and after.

## Questions (a recommended answer each; the Orchestrator relays them)

- Whether `Measured`'s truthy-check read (`if (said) report.current(said)`) may replace `host-curation`'s and
  `profile-page`'s own unconditional `report.current(probe(el, win))` — recommended and taken: yes, after reading
  every probe those two boards pass (`measureBiggest`, `measureBar`, `measureReach`, `measurePictures`, `measureHead`,
  `measureList`, `measureReach`, `measureCard`, `measureBack`); none ever returns `""`, so the two reads are
  behaviourally identical for every real caller. One shared `Measured` shape, not two.
- Whether `voice-guest/parts.tsx:489`'s `data-account-door="save"` (a real attribute value, not a comment) should
  become `"keep"` alongside the named comment fixes — recommended and taken: yes; `DoorWear` (`account-door.tsx`) has
  had no `"save"` member since the rename, so the old value was already wrong, not just dated, and no selector reads
  it (`grep` for `data-account-door` outside that one line: none). No pixel changes either way.

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- **Work commit** `61ca864c` — "lab kit: lift Fit and Measured off 12 boards; clear voice-guest's save comments",
  on `lp/lab-scene-kit`, pushed. **Sync**: `origin/launch-prep` had moved one commit (`9dd4fc3e`, "tracks: the four
  lanes are building", `docs/tracks/orchestrator.md` only) by the time of handoff; fast-forwarded onto it (no merge
  commit: nothing on this lane's paths conflicted). This manifest is the commit after, alone.
- **Gates, on the synced tree, each its own exit code**: `pnpm design:rules` 0 (regenerated
  `rules.generated.json` — `Fit`/`Measured` now listed; `docs/design/library.md` regenerated byte-identical, so it
  is not in the work commit), `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (`specimens.generated.json`
  byte-identical, not in the commit), `pnpm typecheck` 0, `pnpm lint` 0 errors (9 pre-existing warnings, all in files
  this lane never touched), `pnpm test` 0 (362 files, 4032 passed, 1 skipped — includes `kit-discipline.test.ts` with
  `Fit`/`Measured` added to `OWNED`), `pnpm build` 0, `pnpm lab:smoke --base http://localhost:3133` 507 checks, 0
  failing (same count as an untouched run). `pnpm lab:demo --base http://localhost:3133 --board <id>` on all 12
  touched boards: 0 failing on every one, and every step's reported screens/words/move-percent is IDENTICAL to a
  capture taken on the pre-change tree (`git stash` to the cut, recaptured, `stash pop`, recaptured again).
- **The byte-for-byte check, and why it isn't byte-for-byte.** A SHA-256 pass over all 218 before/after PNG pairs
  (`--save-shots`) found 104 identical and 114 with differing bytes. Decoding both sides to raw pixels (the same
  `decodePng` `lab-demo.mjs` itself trusts) showed real, small pixel drift in most of the 114 (typically under 1%
  of the frame, channel deltas of 1-23) and a handful of larger ones (the biggest: `host-storage`'s prices matrix at
  43.77%). Two independent checks say none of it is this lane's doing: (1) `voice-guest`'s own `Fit`/`Measured`
  behaviour is provably UNCHANGED by this lift (its original already carried the exact webfont wait the kit now
  defaults to for everyone), yet its captures still drift by the same small amounts; (2) re-running the UNCHANGED
  post-lift code a second time on `reel-cut`'s neighbour `reel-front` and on `host-storage` reproduced drift of the
  same character, including a 43.77% outlier on the SAME board (a different step captured it — the board's own
  fixtures pick unevenly between runs). Structurally, `lab-demo.mjs`'s own capture clips to the largest `<iframe>`'s
  bounding box (`scripts/lab-demo.mjs`'s `box()`), never the caption text under it, and the caption string is the
  only thing `Measured` ever touches — so this lane's change cannot reach the pixels being compared even in theory.
  Read: pre-existing capture/content nondeterminism (headless rendering timing, and at least one board's own
  randomized fixture pick), not a regression. Look at the two outliers yourself first if you want a human's 10
  seconds on it: `host-storage.prices` (its matrix/rows/cards swap) and `reel-front.verbs`/`reel-front.states`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = every file this manifest's `owns` names EXCEPT
  `site-chrome/stage.tsx` (owned, untouched: its `Scene`/`Measure`/`type Measured` are a wholly different mechanism,
  confirmed by reading the file — no `Fit` at all, and its `Measured` is a 3-number shape, not this component), plus
  one generated-artifact exception: `src/app/(dev)/design/rules/rules.generated.json` (mechanically regenerated by
  the required `pnpm design:rules` gate step off this lane's own new kit exports; `docs/design/library.md` and
  `specimens.generated.json` regenerated too but came back byte-identical, so they never entered the diff).
- **The items:**
  - `Fit` and `Measured` lifted into `src/components/lab/scene.tsx`, exported from `index.ts`; all 12 boards
    (`guest-capture`, `host-curation`, `host-storage`, `identity-claims`, `identity-door`, `identity-profile`,
    `profile-page`, `reel-cut`, `reel-front`, `reel-host`, `voice-guest`, `reel-screen/wall.tsx`) import instead of
    declaring. `Measured` grew a `timers?: number[]` prop (default `[200, 900, 1800]`, the kit's own webfont-ready
    wait added unconditionally) and a `className?: string` prop, so `reel-cut` passes its own `ENGINE_TIMERS`
    (`[200, 900, 1800, 3600, 6000]`, the engine's late pass) and `reel-screen/wall.tsx` passes `WALL_TIMERS`
    (`[200, 900, 2200]`) and `className="size-full"` — the two boards whose behaviour differed for a reason, kept
    through props rather than flattened.
  - `Scene` (and `reel-screen`'s `Wall`/`Desk`) stay per board; each board's own head comment now says `Fit` and
    `Measured` are the kit's rather than claiming verbatim-copied machinery it no longer has.
  - `kit-discipline.test.ts`'s `OWNED` list now names `Fit` and `Measured`; the test (part of the full `pnpm test`
    run above) confirms no registered board re-declares either.
  - `voice-guest/parts.tsx:418,425,473`, `lines.ts:148`, `spec.ts:383` no longer name `save-event-button.tsx` or a
    `save` wear (it is `keep` now); `spec.ts:379`, Will's own quoted words, is untouched. `parts.tsx:489`'s
    `data-account-door` value fixed alongside (see Questions).
  - **ROADMAP.md, for the Orchestrator to edit (not this lane's `owns`):** line 31 ("The lab and the kit: `Scene`,
    `Fit` and `Measured` are copied verbatim...") is DONE — delete it; the finding it produced (`Scene` stays per
    board, on purpose) is recorded in `src/components/lab/scene.tsx`'s own head comment, not the roadmap. Line 30
    ("Code hygiene: comments that still name save: ...") narrows to drop the now-fixed `voice-guest` clause,
    leaving only what this lane never owned: "Code hygiene: comments that still name save: `likes-provider.tsx:26`
    (SaveEventButton), `queries/guest-events.ts:19` (`save_event` among the anon-client RPCs)."
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:**
  - `Measured`'s two shapes (the nullable "said" read and `host-curation`/`profile-page`'s unconditional read)
    merged into one truthy-checked read, verified safe against every probe those two boards actually pass (Questions).
  - `voice-guest/parts.tsx:489`'s `data-account-door="save"` corrected to `"keep"`, one line beyond the manifest's
    named comment fixes (Questions).
  - `parts.tsx:425`'s comment reworded to drop the dead `SaveEventButton` name rather than deleting the sentence's
    point (a plain button replaced a bookmarked trigger); the history it explains (merge `0d6eb748`) stays.
  - The kit's default timers array is `[200, 900, 1800]` (guest-capture/identity-door's own, the most common shape)
    rather than voice-guest's identical numbers under a different name — same values either way, named for clarity.
- **Look at first:** the two capture outliers named above (`host-storage.prices`, `reel-front.verbs`/`.states`), only
  if you want your own 10-second look before trusting the pixel-diff reasoning; otherwise this lane reads clean.
