# Design system (V1 identity + tokens + motion)

> ROLE: the locked V1 visual system: token contracts, type, rounding, elevation, motion, state
> colors, the error taxonomy's UX contract, and the craft-guidance stack.
> BELONGS HERE: what the system IS + its invariants + don't-reverts. · NOT HERE: how it was chosen
> (→ the design lab + `adr/`), per-surface redesigns (each surface's owning phase), shipping
> narrative (→ [`../CHANGELOG.md`](../CHANGELOG.md)).
> GROWS BY: edit-in-place as tokens/rules evolve; the lab (`/design`) stays the experimentation
> venue, this doc records what's ratified.

## What it is

Ratified in V1 program Phase 1 (the gated `/design` lab; decisions live in
`src/app/(dev)/design/touchpoints.ts`), made real in Phase 2: production tokens in
[`src/app/globals.css`](../../src/app/globals.css), the craft pass across `src/components/ui/*`,
and the error taxonomy in [`src/lib/errors/`](../../src/lib/errors). The lab is a standing
instrument: prototype + compare there, ratify into `touchpoints.ts`, then transplant here.

## The identity: monochrome, media is the color

- **Zero-chroma chrome in BOTH modes.** Light = paper (bg `oklch(0.99 0 0)`, card `0.997`, fg
  `0.13`); dark = night (bg `0.14`, translucent card `oklch(0.21 0 0 / 0.62)`, opaque popover
  `0.23`). No pure white anywhere (Hobday rule, adopted): the bg/card lift is real but hairlines do
  the layering, not contrast.
- **`--brand` is an ALIAS of `--primary`** (ink). Don't reintroduce a brand hue; photography
  supplies all color. ("Saturate your neutrals" was consciously DECLINED: zero-chroma is the
  identity; a 0.002-0.004 warm-tint variant may get a lab round later, never silently.)
- **Feedback + actions are ALWAYS colored** (the one exception): `--success` green, `--warning` amber,
  `--like` rose, `--destructive` red, and `--save` blue (the first non-state ACTION hue), each with
  light/dark variants. State, not decoration. **The action-color system (P5 S3·3c) is UNIVERSAL** (guest +
  host; only the action SET differs — guests have no hide/approve/delete): one color per action everywhere
  it appears (like=rose, save/download=blue, hide/show=amber, approve=green, delete=red), for
  recognizability + legible state. Emil rule: **monochrome at rest → color on direct icon-hover + active
  state** (liked = filled rose); native `title` tooltips. Lives on the gallery tiles + the shared lightbox
  pill; brand stays mono (color is punctuation). → [host-app.md](host-app.md) for the action model.
- **`--gallery*` stays always-dark in both themes** (media surfaces; never overridden in `.dark`).
- `BRAND_HEX` (`src/lib/constants/site.ts`) is ink `#101010` for OG/satori; the real logo/OG design
  pass is Phase 6.
- The QR preset corner tints (e.g. the legacy coral) are INTENTIONAL exceptions: existing events
  keep their chosen rendering, scanners locate corners by shape, and the share studio (ROADMAP)
  redesigns presets wholesale. No longer tied to any UI token.

## Type: the five-knob display layer

`font-heading` is a Tailwind `@utility` in globals.css, NOT a theme font token. Five knobs: face
(`--font-display` = Instrument Serif, loaded in the root layout via next/font), size calibration
(`font-size-adjust: 0.6`; display serifs render ~18% small at equal CSS size), zero tracking, real
weight 400 (the face ships one weight), synthetic display weight (`-webkit-text-stroke: 0.013em`;
`font-synthesis: none` forbids faux-bold). Swap the brand face forever by repointing
`--font-display` + retuning those five lines.

**The system rule: Instrument is for IDENTITY moments only** (page titles, event names, marquees);
functional headings stay Inter. Pre-V1 surfaces still misuse `font-heading` on functional headings;
each surface's owning phase (4-6) corrects its own. `--tracking-tight` is `0em` (IS wants zero), so
legacy `tracking-tight` usages are no-ops cleaned per-surface.

## Rounding: sharp surfaces, round actions

| Layer | Token | Value |
| --- | --- | --- |
| Surfaces (cards, inputs, sections) | `--radius` | `0.125rem` (sharp) |
| Actions (buttons) | `--radius-action` / `-lg` / `-sm` | `1rem` @ h-10 · `1.2rem` @ h-12 · `0.8rem` @ h-8 (ratio ~0.4 x height; in-between sizes interpolate: h-6 `0.6rem`, h-7 `0.7rem`, h-9 `0.9rem`) |
| Media tiles | `--radius-tile` | `3px` + half gaps so corners don't open holes |
| Floating layer (menus, tooltips, toasts, dialogs, sheets' corners) | `--radius-float` | `0.5rem` (sharp reads broken on floating elements) |

Nested-corner math: inner = outer minus gap. The sharp-surface/round-action contrast is the
system's DELIBERATE exception to it. The legacy `rounded-sm..4xl` scale stays mapped off `--radius`
(all "sharp family") — `rounded-xl` is now tiny, so floating panels must use `rounded-float`, never
`rounded-xl`. Measurements ride Tailwind's 4px grid + the 0.4-height radius ratio (the system's
math).

## Elevation contract (one depth technique per mode)

- **Light:** exactly one shadow family, `--shadow-float` (soft, blur = 2x offset, single top light
  source), floating layer only. Surfaces are hairline-led, no shadows.
- **Dark:** NO shadows anywhere (`--shadow-float` resolves to a zero shadow in `.dark`). Depth =
  lighter-is-closer surface steps (bg 0.14 → card 0.21 → popover 0.23+) + borders + the glass card.
- Components use the `shadow-float` utility; never reintroduce `shadow-md/lg` on primitives (the
  tabs active pill sheds its `shadow-sm` in dark for the same reason).
- The dark translucent card ships WITHOUT blanket backdrop-blur (alpha composites fine; blur only
  where a surface sits over media).

## Motion

Three curves in `@theme`: `--ease-emphasis` `cubic-bezier(0.23,1,0.32,1)` (entrances/UI),
`--ease-in-out-strong` `cubic-bezier(0.77,0,0.175,1)` (moves/toggles), `--ease-drawer`
`cubic-bezier(0.32,0.72,0,1)` (sheets). Rules: UI under 300ms; **exits faster than enters**
(`data-closed:duration-*` composes with tw-animate via `--tw-duration` — verified); press feedback =
`active:scale-[0.97]` on buttons; explicit transition properties, never `transition-all` on
primitives. Current timings: dialog 200/150 · dropdown/popover 175/120 · tooltip 150/100 (+
`skipDelayDuration` 300) · sheet 300/200 on the drawer curve. Skeletons shimmer via a
background-position sweep (`--animate-shimmer`, linear on purpose: ambient loop, a strong curve
stutters at the loop point).

**Reduced motion:** a global guard in globals.css clamps animation/transition durations to
`0.01ms` (NEVER `0`: radix exit-unmount and the lightbox settle wait on
`transitionend`/`animationend`) and stops infinite loops. Component-level
`motion-reduce:`/`no-preference` gates stay as the first line.

## Icon + small-type rules

Icons paired with text render muted (`text-muted-foreground`/reduced opacity) unless they ARE the
action. Small labels get positive tracking; letter-spacing/line-height run inverse to size.

## Error taxonomy (the UX contract)

`src/lib/errors/`: `ErrorCode` is the superset union of every failure code; per-file result unions
stay narrow and MUST fit inside it (compiler-enforced by `codes.test.ts` — adding a route code
without taxonomy copy fails the build). Failure arms are `{ ok: false, code, message? }`; clients
surface via `showActionError`/`showErrorToast` (producer message > `FALLBACK_MESSAGES[code]` >
generic default). Copy rules: plain language, no em-dashes, no internals.

**Boundaries:** every route group has an `error.tsx` → the shared `RouteError` (generic copy +
`digest` as the support handle — it NEVER renders `error.message`; that's the security invariant)
tagged `render:app|guest|marketing|admin|auth` in Sentry; `global-error.tsx` is dependency-free
(own html/body, inline styles) for root-layout death. The gated `/design/boom` probe throws on
purpose to verify the chain against the real prod build (dev shows the overlay instead).
`notFound()` is never caught by these (verified).

## The craft guidance stack

**★ Proactively propose creative DELIGHT — make it feel like magic (Will, 2026-06-21).** In all design/UI
work, don't stop at "correct": surface a creative delight opportunity (a considered entrance, a satisfying
micro-interaction, a rare-moment beat) and RECOMMEND it by default, rather than waiting to be asked. Beauty
is leverage, the unseen details compound, and "feels like magic" is Partyreel's differentiator. The
discipline that keeps delight from becoming noise is **animate by FREQUENCY** (emil): HIGH-frequency actions
(a workspace opened many times a day, moderation/select switches) stay INSTANT/minimal — never add theater
there; OCCASIONAL surfaces (modals, takeovers, route nav) get standard entrances (≤300ms, custom easing,
`@starting-style`, reduced-motion fallback); RARE/first-time moments (empty states, a first action,
celebrations) can carry real delight. Everything CSS-first + `prefers-reduced-motion`-safe + exits ≤ enters.

**emil-design-eng (the installed skill) is PRIMARY; Hobday's Safe Rules
(anthonyhobday.com/sideprojects/saferules) are a SECONDARY advisory; neither is a bible.**
Synthesis (Phase 2): *adopted* — no pure white surfaces, the elevation contract (no dark shadows,
lighter-is-closer, one depth technique per mode), nested-corner math, muted paired icons,
small-label tracking, the 4px-grid + radius-ratio math. *Already true* — near-black/near-white
extremes, contrast hierarchy, brightness-distinct palette, ~2x horizontal button padding, two
typefaces (Geist Mono = a documented utility exception for code/counts), ~70ch prose. *Declined or
deferred with reasons* — saturate-neutrals DECLINED (zero-chroma identity); 12-column grid noted for
the Phase 6 marketing rebuild. **Guest reading-copy rule (NOW REAL, Phase 4):** guest-facing reading
copy is 15-16px (`text-[15px]`/`text-base` on event description, gate prompts, growth cards, entry
sheet rows); dense/structural UI (captions, counters, secondary labels) stays sm/xs. Host/admin keep
14px until their phases.

## Stagger (the gallery entrance)

The `[data-media-tile]` `@starting-style` entrance (Phase 2) gains a per-index delay (Phase 4):
`transition-delay: min(calc(var(--tile-i, 0) * 45ms), 540ms)`. The guest masonry sets `--tile-i` on the
SEED render ONLY (a render-once ids `Set`); doorbell/poll-arrived tiles carry `--tile-i: 0` and land
immediately. The cap (540ms) stops deep galleries from queuing forever; reduced-motion drops the move.

## Host-review motion (S4·A) + the live motion tuner (S4·0)

The focused-review takeover ([host-app.md](host-app.md)) is the densest motion cluster — all CSS-first,
reduced-motion-safe, and var-tunable:
- `[data-review-tile]` — the OPEN cascade (opacity+transform, `min(--tile-i * --tune-review-stagger-ms, 480ms)`
  delay, `--tune-review-tile-ms` duration). A SEPARATE hook from `[data-media-tile]` so the takeover tunes
  independently of the gallery.
- `[data-review-tile][data-exiting]` — the bulk-action REMOVAL EXIT (opacity→0 / `scale(0.9)`,
  `--tune-review-exit-ms`, `transition-delay:0` so the acted set leaves TOGETHER, never on the cascade index).
  `run()` reads the SAME var via `readMs()` so the JS commit waits exactly as long as the visual.
- `[data-unlock-success]` (reused from the gate morph) — the ALL-CAUGHT-UP beat; `run()` holds it
  `--tune-review-beat-ms` then closes (the beat RIDES OUT the radix close-exit — caughtUp resets only AFTER
  the slide, else the takeover flips to an empty "Review 0 photos" grid mid-close).
- `[data-check-pop]` — the selection-checkmark scale-in (review tiles + QR presets); `[data-preset-arrive]` —
  the QR-preset cascade (a KEYFRAME, NOT a transition, so the swatch's `transition-colors` hover survives).

**The motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx) + `motion-tuner-config.ts`,
S4·0): a dev-only, design-key-gated panel that writes `--tune-*` CSS vars to `<html>` so any var-backed timing
can be finetuned LIVE on the real (prod) host page — "build-direct + tune-live", no rebuild loop. The CSS
reads `var(--tune-x, <baked default>)`, so it's a NO-OP without the panel; the NON-throwing `isDesignGateOpen`
([`app/(dev)/design/gate.ts`](../../src/app/(dev)/design/gate.ts)) opens it via `?key=` (never 404s the host's
real page). Contract: each polish increment APPENDS its knobs to `EVENT_PAGE_TUNER_CONTROLS` in the SAME
commit it wires the `var()`, the config `default` MIRRORS the CSS default, and any JS-read var (`run()`'s
`readMs`) falls back to a constant that ALSO mirrors it — so tuned-vs-untuned stays consistent. Bake a tuned
value: Copy CSS → set it as the globals.css default → Reset. (CAVEAT, [testing-verification.md](testing-verification.md):
the Chrome-MCP `javascript_tool` runs in an ISOLATED world, so a `--tune-*` injected from it does NOT reach
the app's main-world `getComputedStyle`/`readMs` — only real slider drags or CSS-read vars reflect.)

## The arrival choreography (Phase 4.5, ratified "Calm + 700ms")

The guest arrival is the sanctioned RARE/FIRST-TIME moment (the craft standard's exception to the
under-300ms rule): the entry sheet ENTERS on vaul's native 500ms iOS drawer curve after a 700ms
arrival beat; everything repeated stays fast (exit 250ms, steps 220ms, height glide 300ms). The
choreography attributes (all `@starting-style`, reduced-motion = fades): `data-arrive`/`--arrive-i`
(the locked page settles), `[data-entry-step][data-dir]` (directional step handoffs) +
`[data-entry-exit]` (the inverted-@starting-style exit clone), `data-unlock-success` (the gate
button's green morph content), `data-reveal`/`--reveal-i` (the unlock reveal: 150ms + 50ms steps)
held back by `[data-reveal-curtain]` until the success beat releases. Constants live in
`use-arrival-beat.ts` (700/350/0) + `use-success-hold.ts` (900ms beat / 1.5s slow / 8s watchdog);
the ratification record is touchpoint 11's `decisionNote`.

**★ The vaul motion gotcha:** with no `snapPoints`, vaul's open/close runs on KEYFRAME ANIMATIONS
from its injected stylesheet (`slideToBottom`/`fadeOut`, 0.5s) — `transition-duration` overrides do
NOTHING there; the exits-faster rule must override `animation-duration` (`!important`, scoped to
`data-state="closed"`). The drawer's TRANSITION only drives drag-release snap-back (under
`data-state="open"`) — never touch it. Don't trust "vaul hardcodes inline transitions" notes from
older write-ups.

## Where it lives

`src/app/globals.css` (tokens + utilities + guards, the single source) ·
`src/app/layout.tsx` (font loading) · `src/components/ui/*` (the crafted primitives) ·
`src/lib/errors/` (taxonomy) · `src/components/shared/route-error.tsx` + the route-group
`error.tsx` files · `src/app/(dev)/design/` (the lab: reference `design.css`, `touchpoints.ts`
decision record, `/design/boom` probe). Perf baselines: [`../perf/v1-baseline.md`](../perf/v1-baseline.md).

## Gotchas / don't-revert

- The lab's `design.css` deliberately DUPLICATES production tokens (a frozen reference sheet);
  dedup is a Phase 8 task, don't "fix" it early.
- 47 behavior pins (`*.test.tsx`, the component vitest project) freeze MediaLightbox / GuestUpload /
  LikesProvider behavior ahead of the Phase 4-5 decomposition — they assert behavior only, never
  styles, so token/craft changes don't touch them.
- jsdom can't run the lightbox pause-on-navigate effect (portal/commit timing); that one pin was
  dropped on purpose — cover it in live device passes.
- `vitest.setup.ts` mocks sonner globally; `vi.unmock("sonner")` is the per-file escape hatch.
- shadcn `src/components/ui/*` files are semicolon-free (generator style); app code uses
  semicolons. Don't reformat either direction.
