---
track: glow-engine-defects
status: integrated
merged: "75069ba"      # the branch head merged into launch-prep
cut: "791fd4f"
preview: true
owns:
  - src/components/shared/glow.tsx
  - src/components/shared/glow-contract.test.ts
  - src/lib/shared/use-in-view-once.ts
  - src/lib/shared/sampled-palette.ts
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
reads:
  - src/components/dev/lamp-set.ts
  - src/app/globals.css
  - src/components/vendor/border-beam
---

# lp/glow-engine-defects

**Goal.** The spill engine's known defects, fixed in the engine and nowhere else; NO placements (those
are Will-paced rounds: the guest surfaces, the Get Pro beam and the lit surface, the publish beat).
(1) The unarmed bloom band rests: before arrival arms it, the band must sit at its from-keyframe
(off-layer), never a point inside the travel (law 4's reduced-motion half already says so for the
resting value; make the unarmed state obey it too). (2) `useInViewOnce` gains a viewport-relative
arming option (a `rootMargin` or fraction expressed against the viewport rather than the element),
default behaviour unchanged, so a tall lamp can arm before its own top edge scrolls in. (3) The
sampler's loader swaps to `decodeImage` on `previewUrl`, so law 3 (sampled where there is media) fires
on real media instead of falling to the lit fallback when a full-size original is slow. (4)
`effectiveAlpha` models base + band, not the band alone, so the contrast instrument reports what the
eye sees. (5) The compiled-away `@supports not` in the engine block is settled: either the fallback it
guarded is written so Tailwind keeps it, or the block is removed with the reason recorded. (6) Every
`BorderBeam` wrapper pins `theme` so the beam never inherits a wrong ground. Size M.

**Rulings in force.** none for the engine; every placement ruling stands untouched (the spill
doctrine and the placements are on the record: `docs/decisions/design-record.md#glow-doctrine` and
`#glow-moments`). The engine's laws in `docs/systems/design-system.md` "Light" are binding: a change
that would alter a shipped placement's look is out of scope and goes to Handoff as a proposal.

**Also touches, by ruling (explain in the lane check):** the engine block of `src/app/globals.css`
(between its own banner comments) for items 1 and 5 only; the four `BorderBeam` call sites for item 6
(one attribute each; name every file in Handoff).

**Verify on.** `pnpm test` (the glow contract, the contrast test and the keyframe pin stay green, and
grow a pin per item where one is missing); the home's hero underlight, the footer seam and the reel
lamp on the launch-prep alias after integration; the two glow boards in the lab
(`/design/c/glow-doctrine`, `/design/c/glow-moments` with the key) on the branch preview for items 1,
3 and 4, since the boards are the specimens the placements were argued on (push with `[preview]` or
flip `preview: true` for that).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/design-system.md`, "Light" and "Where the machinery is": the engine facts that change
  (the resting band, the arming option, the sampler's loader, the alpha model).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff

Written by the Orchestrator on 2026-09-11: the agent's session was terminated by an API error after
its sixth commit and before it could hand off, so this section records what the branch contains and
what the Orchestrator verified, not what the agent reported.

- Head `75069ba`, pushed; preview `partyreel-git-lp-glow-engine-defects-partyreel.vercel.app` (the
  agent's last commit carried `[preview]`).
- Cut at `791fd4f`, which was still the `launch-prep` tip at integration, so no sync was needed
  (staleness 0).
- Gates on that tree, run by the Orchestrator in the track's worktree, each on its own exit code:
  typecheck ok, lint ok, test ok (1592), build ok (244 pages). CI green on both of the branch's pushes.
- Lane check `git diff --name-only launch-prep...origin/lp/glow-engine-defects` = the six owned paths,
  their three tests (`glow-contract.test.ts` is owned; `sampled-palette.test.ts` and
  `use-in-view-once.test.ts` sit beside their owned modules), the engine block of `globals.css` (the
  ruled exception, for items 1 and 5), `docs/systems/design-system.md` (the listed edits) and this
  manifest. Item 6 needed no production edit: the one wrapper (`pro-card-beam.tsx`) already pins
  `theme`, so the commit pins the invariant in the glow contract test instead.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: the resting state of a bloom (`[data-glw-shape="bloom"] [data-glw-band]` at its
  from-keyframe), the no-mask fallback now hiding the whole lamp, and `armingThreshold`'s geometry.

## Record

Merged into `launch-prep` at `<sha>` (2026-09-11). Six engine defects fixed, no placement touched: an
unarmed bloom now rests at its own from-keyframe instead of sitting fully lit before the beat it
exists to mark; `useInViewOnce` gained a viewport-relative arming option (`viewportFraction`, taking
the earlier of the two thresholds, so a lamp taller than the screen can arm at all and every shorter
element behaves as before) and the lamp uses it; the URL sampler decodes through the reel engine's
`decodeImage`, CORS-clean and cache-safe, so law 3 fires on presigned guest media when handed a row's
`previewUrl`, with the DOM form documented as the one that still taints; `effectiveAlpha` models base
and band composited source-over, so the contrast instrument reports the light the eye meets rather
than two thirds of it; the no-mask fallback was measured in the production build (Lightning CSS keeps
it, rewritten stricter) and now hides the whole lamp rather than leaving an unmasked field; and every
`BorderBeam` wrapper's `theme` is pinned by the glow contract test. Fourteen new tests.
