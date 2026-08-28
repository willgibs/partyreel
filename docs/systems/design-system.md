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
  `--like` rose, `--destructive` red, `--save` blue (the first non-state ACTION hue), and `--reel` violet
  (the host reel-curation hue, S5 R1), each with light/dark variants. State, not decoration. **The
  action-color system (P5 S3·3c) is UNIVERSAL** (guest + host; only the action SET differs — guests have no
  hide/approve/delete/reel): one color per action everywhere it appears (like=rose, save/download=blue,
  hide/show=amber, approve=green, delete=red, add-to-reel=violet), for recognizability + legible state.
  Emil rule: **monochrome at rest → full-brightness colored STROKE on direct icon-hover + a SUBTLE `/25`
  FILL on the active state** (so the outline stays legible: liked rose, in-reel violet, hidden amber); native
  `title` tooltips. Lives on the gallery tiles + the shared lightbox
  pill; brand stays mono (color is punctuation). (`--reel` violet + the `Clapperboard` icon are RATIFIED,
  Will 2026-06-21.) → [host-app.md](host-app.md) for the action model.
- **`--gallery*` stays always-dark in both themes** (media surfaces; never overridden in `.dark`).
  ★ **Painting a subtree with `bg-gallery` is only half the job.** `--ring`, `--border`, `--foreground`,
  `--muted-foreground` and `--brand` are NOT in that family, so under `.surface-paper` they keep their
  LIGHT values: `outline-ring/50` (applied to `*`) lands a **1.44:1** focus ring on the slab against a 3:1
  requirement, muted text reads **2.62:1** against 4.5:1, and a bare `border-t` paints a near-white
  hairline. All of it is INVISIBLE while working on a cinema page, where the subtree sits inside `.dark`.
  Redeclare the tokens locally on the wrapper (`[--ring:var(--gallery-foreground)]` etc.) — the
  `.surface-paper` mechanism applied to one subtree. **`--brand` must be redeclared DIRECTLY, not via
  `--primary`:** a `var()` inside a custom property is substituted at the element that DECLARES it, so
  `--brand: var(--primary)` already resolved to ink back at `:root` and inherits down resolved. The ink
  footer is the worked example ([marketing-footer.tsx](../../src/components/marketing/chrome/marketing-footer.tsx),
  pinned by `footer-contract.test.ts`).
  Three more the footer never hit, found building `CinemaChapter` (2026-08-28): **`--shadow-float` must be
  zeroed to the INVISIBLE value `0 0 0 0 oklch(0 0 0 / 0)`, never `none`** (Tailwind composes `--tw-shadow`
  into a comma-separated `box-shadow` beside the ring/inset slots, and a `none` in that list invalidates the
  whole declaration, taking any ring on the element with it — `.dark` says exactly this at its own
  declaration); **`--card-foreground` travels WITH `--card`** (shadcn `Card` is `bg-card
  text-card-foreground`, so half-redeclaring makes a Card ink-on-ink, i.e. invisible rather than merely
  wrong), same for `--muted`/`--muted-foreground`; and `--input` paints the same near-white hairline
  `--border` is redeclared to stop. Derive `--secondary`/`--accent` by `color-mix` over the gallery pair
  rather than copying `.dark`'s literals, or the two drift the first time the dark ramp is retuned.
- **`CinemaChapter`** ([cinema-chapter.tsx](../../src/components/marketing/system/cinema-chapter.tsx), pinned by
  `cinema-chapter-contract.test.ts`) is the reusable form of all of the above: a dark chapter inside a light
  page, the exact inverse of `PaperChapter`. Until it existed the system could only go light-inside-dark,
  which is a real reason the paper pages read flatter than the cinema ones. It is for TYPE AND MEDIA: it
  deliberately does not re-ramp the state colors (that would fork globals) and cannot fix native form
  controls (the page-level `color-scheme: light` still applies), so controls and status UI stay outside a
  chapter. A seam-straddling child carries `surface-paper` ITSELF, which re-aliases the whole light block
  including the `--shadow-float` the chapter zeroes: the attribute that makes it straddle is the one that
  gives back its elevation. ★ Two more traps the straddle itself sets, both silent: the chapter must NOT
  carry `isolate` (it creates a stacking context and TRAPS the straddling child's z-index, so the next
  section's background paints over the thing meant to overhang — the footer wants isolate, a chapter never
  does), and the straddling child's wrapper needs a block formatting context (`flow-root`) or the negative
  margin COLLAPSES THROUGH it and escapes as the chapter's own margin, leaving the ground running on past
  the child and the next section's text rendering over it. `/help` avoids the second only because its
  straddle sits inside a section that already has vertical padding.
- ★ **Tailwind can emit NOTHING for an arbitrary utility, silently.** `w-[var(--plate,58cqw)]` AND
  `[--plate:58cqw]` both produced no rule at all while every neighbouring class worked, so an element fell
  to shrink-to-fit and collapsed to the width of its own grid gaps with no error anywhere. When an
  arbitrary utility's value does not visibly apply, check for the RULE before debugging the value, and
  move load-bearing geometry into the stylesheet that owns the component's other CSS.
- `BRAND_HEX` (`src/lib/constants/site.ts`) is ink `#101010` for OG/satori; the real logo/OG design
  pass is Phase 6.
- The QR preset corner tints (e.g. the legacy coral) are INTENTIONAL exceptions: existing events
  keep their chosen rendering, scanners locate corners by shape, and the share studio (ROADMAP)
  redesigns presets wholesale. No longer tied to any UI token.

## Type: the heading face + the tiered scale

`font-heading` is a Tailwind `@utility` in globals.css (NOT a theme font token): the brand face
**Urbanist** (`--font-display`, loaded in the root layout via next/font as a variable font) at **weight
700** + **-0.03em** tracking. Urbanist is a real variable sans, so the old Instrument-era knobs
(font-size-adjust, the synthetic text-stroke weight, font-synthesis) are gone — a real bold weight does
the work. Swap the brand face forever by repointing `--font-display` + retuning the two lines in the utility.

**The tiered app heading scale** (one face, weight per tier — this SUPERSEDES the old "functional headings
stay Inter" rule; app page + card titles now use the heading face):
- **Page titles** → `PageHeading` ([`src/components/shared/page-heading.tsx`](../../src/components/shared/page-heading.tsx)):
  Urbanist **700**, `text-2xl` default (the event-name hero bumps to `text-3xl`). The ONE source for every app
  + admin page `<h1>` — new pages use it so headings can't drift back to Inter.
- **Card / section titles** → `CardTitle` (`ui/card.tsx`): Urbanist **600** (`font-semibold`) — clearly a
  heading above the labels below it.
- **Per-setting labels** (`FormLabel`) + small uppercase eyebrow labels → **Inter 500**, unchanged.

`PageHeading` deliberately adds no `font-semibold` (would drop 700→600) and no `tracking-tight` (our
`--tracking-tight` is `0em`, which would CANCEL the utility's -0.03em). `--tracking-tight` stays `0em` so the
90+ legacy `tracking-tight` usages are no-ops (re-tuning them is its own deferred pass).

**The marketing page-H1 ladder (RULED site-wide 2026-08-27: titles must OWN their headers):** standard
marketing page H1s ramp `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` (the 72px class on desktop).
Exemptions by the ruling's own latitude: the HOME hero keeps its unique display ramp (5xl→8xl), `/reel`
was already at 7xl, long-title ARTICLE surfaces (help/blog/careers articles) stop at `lg:text-6xl`, and
utility documents (`/contact` via SectionShell, the legal shell) stay at 4xl/5xl. Marketing section h2s
keep the paper ladder (`text-2xl sm:text-3xl`, composed bespoke — the 2026-08-25 careers ruling).
A **non-heading display exemption** exists once: `/about`'s closing wordmark, a `<p>` at
`clamp(3.75rem, 13vw, 10rem)`. The ladder governs H1s and this is not one, but a 160px string is a
recorded decision, not a stray arbitrary value. It needs `text-[length:...]` (v4 must be told whether a
`clamp()` in `text-*` is a size or a color) and it is the page's second and larger type peak, deliberately
above its own H1: do not "fix" it back down toward 72px.

**The mono ruling (R6, 2026-08-27, site-wide type doctrine):** mono (Geist Mono) is for **numerals /
tabular alignment only** in standard UI — numbered index rows, stat values (the StatBand register), counts
where alignment matters. Captions, labels, and CTA notes are Inter ("this is a consumer app, not a
devtool" — Will). Existing `MonoCaption` surfaces (press facts, legal status lines, GoDeeper rows) are
grandfathered pending Will's ruling on a sweep (→ ROADMAP).

## Rounding: sharp surfaces, round actions

| Layer | Token | Value |
| --- | --- | --- |
| Surfaces (cards, inputs, sections) | `--radius` | `0.125rem` (sharp) |
| Actions (buttons) | `--radius-action` / `-lg` / `-sm` | `1rem` @ h-10 · `1.2rem` @ h-12 · `0.8rem` @ h-8 (ratio ~0.4 x height; in-between sizes interpolate: h-6 `0.6rem`, h-7 `0.7rem`, h-9 `0.9rem`) |
| Media tiles | `--radius-tile` · `--gap-gallery` | radius `3px`; `--gap-gallery` (`3px`) is the ONE gap for EVERY media-tile grid — masonry galleries + the dense triage grids (Reviews / review takeover / admin moderation). Use `gap-[var(--gap-gallery)]`; one knob retunes them all |
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
`skipDelayDuration` 300) · sheet 300/200 on the drawer curve · **marketing nav 200/130 with a 100ms
hover intent** (its clocks are `--mkt-dropdown-*` / `--mkt-nav-*`, [marketing-content.md](marketing-content.md)).
**★ THE FLOATING-LAYER CONTRACT** (named 2026-08-28 when the nav turned out to be the one menu
outside it): every floating surface ships `rounded-float` + `shadow-float` + an origin-AWARE
`transform-origin` + `fade-in-0`/`fade-out-0` beside its zoom + one house clock on `--ease-emphasis`.
Miss any of the five and the surface reads wrong in a way that is hard to name: `rounded-lg` resolves
to the 2px SHARP general-UI radius, a raw `shadow` draws in dark mode against the elevation contract,
a centre origin detaches the panel from its trigger, and a scale with no fade pops. Three reusable
patterns came out of that round: the **`data-swap`-gated box morph** (a size transition must be armed
only when there is a previous size to morph FROM, or a measured-late 0×0 first frame animates as a
wipe), the **glass LAYER** (`backdrop-filter` on an inert `-z-10` sibling whose `opacity` animates —
never a class-toggled filter on the bar itself, which both snaps and drags every descendant's repaint
into a blurred region), and the **measured indicator** (JS writes `offsetLeft`/`offsetWidth`, CSS owns
the tween; the first placement MUST suspend the transition and force a reflow or it flies in from
x=0). Hover is the one place enters may be SLOWER than exits: a row that is skimmed rather than
studied needs its in inside ~90ms and can take ~180ms to fade back out. Skeletons shimmer via a
background-position sweep (`--animate-shimmer`, linear on purpose: ambient loop, a strong curve
stutters at the loop point). **`MediaTile` (every gallery tile) renders the shimmer skeleton under the photo
until it decodes, then fades the photo in over it (S5 P1)** — a cold presigned-R2 load (no thumbnail variant)
reads as shimmer→photo, never a black square that pops; reduced motion drops to a static muted block. The
host-review takeover pairs this with a preload of the just-approved photos during the all-caught-up beat so
the album reveal paints from cache (see [host-app.md](host-app.md)). The host tile action row uses the
**`[data-reveal-chip]`** hook (globals.css): hover-reveal chips collapse their width + margin at rest so the
persistent chips (liked / in-reel / hidden) pack to the right edge, then slide back on tile hover (the row is
margin-spaced, not gap, so no residual gap; reduced-motion = opacity-only). **GOTCHA:** the hook is
`!important` because it lives in `@layer base` but the chips carry their own Tailwind `transition`/`ml-1` in
the higher `utilities` layer (which silently overrode it = no slide, residual gaps); and it expands on
`:hover` / `:focus-visible` / `:has(:focus-visible)` — NOT `:focus-within`, so a mouse click doesn't leave a
chip stuck-expanded after the cursor leaves.

★ **A swept-mask layer needs a STATIC base, or it vanishes when paused.** The organic-shimmer family
works by animating `mask-position` across a mask wider than the layer, so its resting frame sits fully
off-layer and shows NOTHING. Anything under the loop-pause contract therefore defaults to invisible
(offscreen is the default state) and stays invisible under reduced motion, which breaks the arrival
rule. Split it: an always-on base layer plus the travelling band over it. The footer seam glow is the
worked example (`.mkt-fglow-base` / `.mkt-fglow-band`, marketing.css).

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

## Event-feed + review motion + the live motion tuner

The host event feed ([host-app.md](host-app.md)) is the densest motion cluster — all CSS-first,
reduced-motion-safe, and var-tunable. The motion-defining picks were ratified in the
[`/design/event-feed`](../../src/app/(dev)/design/event-feed) lab (Will 2026-06-22):
- **A=Condense** — the sticky pill bar gains `data-stuck` once the feed scrolls past its top sentinel:
  a hairline + backdrop, and the pills shrink (`h-8`→`h-7`, smaller text) on a `transition-[transform,height,padding,font-size]`.
- **B=Fade** (`[data-section-swap]`) — the feed container is re-keyed on a pill change (and the floating
  bar's content on the active section), so `@starting-style` fires a crossfade + rise (opacity+translateY,
  `--tune-section-swap-ms`; the lab's blur variant was REJECTED). Hardware-accelerated, reduced-motion = fade.
- **C=FLIP** (`useFlip`, [`use-flip.ts`](../../src/lib/shared/use-flip.ts)) — when the urgency order flips
  (the review queue clears), the sections slide to their new positions via a hand-rolled First-Last-Invert-Play
  (translateY, `--tune-reorder-ms`, `--ease-in-out-strong`); reduced motion = instant. Chosen over framer-motion's
  `layout` (cleaner, off the main thread, no dependency — `motion` was dropped).
- `[data-review-tile][data-exiting]` — the bulk-action REMOVAL EXIT (opacity→0 / `scale(0.9)`,
  `--tune-review-exit-ms`, `transition-delay:0` so the acted set leaves TOGETHER). The inline review opts OUT
  of the `[data-review-tile]` open cascade (no entrance theater on an always-present surface; the cascade hook
  is kept for the tuner's lab replay).
- `[data-unlock-success]` — the ALL-CAUGHT-UP beat; `useReviewTriage.run()` holds it `--tune-review-beat-ms`
  IN PLACE (no Dialog now), then `caughtUp` clears → the urgency order recomputes → the FLIP relocates the
  now-empty Review section to the bottom.
- `[data-check-pop]` — the selection-checkmark scale-in (review tiles + QR presets); `[data-preset-arrive]` —
  the QR-preset cascade (a KEYFRAME, NOT a transition, so the swatch's `transition-colors` hover survives).

★ **JS-timed motion reads vars with `readCssMs` ([`read-css-ms.ts`](../../src/lib/shared/read-css-ms.ts)), never
`parseInt`** — the build minifier (Lightning CSS, via Tailwind v4) canonicalizes `<time>` to its shortest form,
so `2500ms` ships as `2.5s`; `parseInt("2.5s")` is `2`, which once collapsed the all-caught-up beat to ~2ms.
`parseCssMs` handles `s`/`ms`/bare (unit-tested).

**The baked motion values** (globals.css `:root`, ratified): `--tune-route-fade-ms` 310 / `--tune-route-fade-ease`
ease-out, `--tune-section-swap-ms` 180, `--tune-reorder-ms` 500, `--tune-review-beat-ms` 2500 — plus the
REEL REVEAL grammar's `--tune-rvl-*` / `--tune-rxp-*` set (T2-ratified as-built, production since R3; the
tuner knobs are annotated "ratified, revisit-only" — per the tuner contract, a retune must move the config
default + the CSS fallback + any JS fallback together). The tuner overrides
these live with an inline style on `<html>` (which outranks `:root`), so the playground tunes against them.

**The contextual floating action bar** ([`event-feed-action-bar.tsx`](../../src/components/app/event-feed/event-feed-action-bar.tsx)):
one fixed-bottom surface that follows a scroll-spy (`useActiveSection`) and MORPHS its action to the section in
view (the floating Add generalized). The morph crossfades via the same `[data-section-swap]` language; each
section self-surfaces its control (primary Add pill / a neutral card holding the review cluster / a disabled
placeholder). Reuse this when a long scroll needs a section-aware action always in reach.

**Multi-select primitives** (Review triage + the Gallery album bulk-select share these). `useSelection(ids)`
([`event-feed/use-selection.ts`](../../src/components/app/event-feed/use-selection.ts)) is the pure state machine
(`selected` Set / `selectMode` / toggle / selectAll / enterSelect(seed) / exitSelect) — ★ it PRUNES the
selection to the surviving ids when the universe changes, never resets, so a background poll/revalidate can't
wipe an in-progress multi-select. `SelectableMediaGrid`
([`event-feed/selectable-media-grid.tsx`](../../src/components/app/event-feed/selectable-media-grid.tsx)) is the
shared selectable masonry (the `[data-check-pop]` checkmark + `[data-exiting]` removal beat; `enablePreview` for
Review's peek; `clampAspect` MUST match the surface's normal grid or toggling select reflows tile heights). The
selection STATE is lifted to a thin provider (`HostSelectionProvider`, mirrors `HostAddProvider`) so a grid and
a scroll-following bar share it; the grid REGISTERS its optimistic bulk handlers and the bar calls
`run(kind)` — the registration seam to use whenever a control surface and its target grid live in different
subtrees. Long-press entry rides `use-long-press.ts` (opt-in `onTileLongPress`, a capture-phase click-suppress).

**Grid layout + the sortable primitive.** The shared grids take a `layout: "masonry" | "uniform"` prop
(default masonry): **masonry** = natural-ratio CSS columns (the Gallery "wow"); **uniform** = a fixed
`UNIFORM_TILE_ASPECT` (`4/5`) `object-cover` CSS grid (`grid-cols-3 sm:grid-cols-4`) for the Reel + Review,
where uniformity makes a drag-order / selection hit-targets legible. Drag-reorder rides our own
dependency-free [`useSortableGrid`](../../src/lib/shared/use-sortable-grid.ts) (the project dropped
framer-motion + ships no drag lib): a hand-rolled pointer machine (modeled on the lightbox swipe) + a 2-axis
FLIP for the sibling slide (mirrors `use-flip` but X AND Y; `--tune-reorder-ms` / `--ease-in-out-strong`,
reduced-motion = instant). The dragged tile is finger-followed via an imperative transform (excluded from the
slide). ★ Why hand-rolled beats dnd-kit HERE: on a uniform grid the drop-index is two integer divisions
(`pointToIndex`, unit-tested), so a drag lib's collision/sensor machinery buys nothing. Touch grabs behind a
450ms press (a scroll never reorders); `touch-none` in the focused reorder mode + edge autoscroll reach
off-screen tiles; keyboard reorder (space / arrows / enter / escape) is free since the order math is index-based.

**The motion tuner** ([`motion-tuner.tsx`](../../src/components/dev/motion-tuner.tsx) + `motion-tuner-config.ts`,
S4·0): a panel that writes `--tune-*` CSS vars to `<html>` so any var-backed timing can be finetuned LIVE, no
rebuild. It lives in the **lab at [`/design/motion`](../../src/app/(dev)/design/motion/page.tsx)** (the
`MotionPlayground`): the tuner drives REPLAYABLE DUMMY animations on the exact same hooks, so you adjust a
slider, hit Replay, feel it, and Copy CSS - far better than tuning real prod animations (which meant a refresh
+ re-entering the takeover per tweak; it shipped on the prod event page first, S4·0, then moved here). Contract:
each polish increment APPENDS its knobs to `EVENT_PAGE_TUNER_CONTROLS`, the config `default` MIRRORS the CSS
default, and any JS-read var (`run()`'s `readCssMs`) falls back to a constant that ALSO mirrors it — so
tuned-vs-untuned stays consistent. Bake a tuned value: Copy CSS → set it as the globals.css default → Reset.

**State-colored toasts (global policy, S4):** sonner's `data-type` is mapped to the design state colors —
`success` = `--success` green, `warning` = `--warning` amber, `error`/destructive = `--destructive` red;
plain/info toasts keep the neutral `--normal-*` default. Use the right TYPE for the state: approve/positive =
`toast.success`, HIDE/soft-caution = `toast.warning`, failures = `toast.error`. The CSS (globals.css) targets
sonner's OWN `[data-sonner-toast][data-type="…"]` with **`!important`** — NOT the `classNames.toast` hook (it
didn't win): sonner injects a neutral `--normal-bg` rule at runtime (unlayered, non-important) that beat the
earlier class rule on layer/order, so a more-specific `!important` is required (verified live via the toast's
computed `backgroundColor` matching the token — confirm the RENDERED color, not just that the rule loaded).
**Red is for FAILURE, full stop** (ratified 2026-06-21): a successful destructive confirmation ("Permanently
deleted.", "Event deleted", "Removed from saved.") stays `toast.success` (GREEN) — the action succeeded, so it
reads as a positive completion; `toast.error` (red) is reserved strictly for things that went wrong. So delete
that worked = green, delete that failed = red. (No separate destructive-confirmation variant; the green-on-
success convention carries it.)

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

**Two adjacent craft rules (P4-era, still binding):** any full-width `inset-x-0` overlay floating
above a GESTURE track needs `pointer-events-none` on the box + `pointer-events-auto` on just its
controls (`items-center` centers children but the BOX stays edge-to-edge and eats pointerdown across
its flanks — this once killed swipe-nav on all six shared-viewer surfaces). And the repo's
react-hooks lint bans setState-in-effect sync resets — use the adjust-state-during-render pattern
(prev-state comparison) for transient view resets.

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
