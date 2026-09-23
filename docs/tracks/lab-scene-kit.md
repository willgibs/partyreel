---
track: lab-scene-kit
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
