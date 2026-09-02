---
track: glow-engine-defects
status: open
cut: "791fd4f"
preview: false
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

- to be filled at handoff

## Record

- to be filled at integration
