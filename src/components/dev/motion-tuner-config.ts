/**
 * Motion-tuner control config (S4·0). Plain, serializable data so a SERVER page
 * can import it and pass it across the RSC boundary into the (client) MotionTuner
 * without pulling client code server-side. Each control binds to a CSS custom
 * property the polish CSS reads as `var(--tune-x, <baked default>)`; the tuner
 * writes the live value to document.documentElement.style.
 *
 * GROWS PER INCREMENT: S4·0 ships only the proof-of-life route-fade knobs (the
 * one motion already wired to vars). Each polish increment (A2..A5) APPENDS its
 * own controls here in the SAME commit it wires the matching `var()` into
 * globals.css — so every knob in the panel always drives something real (no dead
 * sliders). When a value feels right: Copy CSS -> bake it as the globals.css
 * default -> Reset (drop the inline override). The `default`s below MUST mirror
 * the baked defaults in globals.css so the panel opens at the live state.
 */

export type TunerControl =
  | {
      kind: "range";
      cssVar: string;
      label: string;
      min: number;
      max: number;
      step: number;
      unit: string;
      default: number;
    }
  | {
      kind: "select";
      cssVar: string;
      label: string;
      options: { label: string; value: string }[];
      default: string;
    };

/** The project's strong custom curves (globals.css @theme) + a couple of built-ins. */
export const EASING_OPTIONS: { label: string; value: string }[] = [
  { label: "emphasis", value: "cubic-bezier(0.23, 1, 0.32, 1)" },
  { label: "in-out-strong", value: "cubic-bezier(0.77, 0, 0.175, 1)" },
  { label: "drawer", value: "cubic-bezier(0.32, 0.72, 0, 1)" },
  { label: "ease-out", value: "ease-out" },
  { label: "linear", value: "linear" },
];

/**
 * The controls mounted on the host event page (behind the design gate). S4·0:
 * the route crossfade (dashboard <-> /settings) is the proof-of-life — its
 * duration + easing are now `var(--tune-route-fade-*)` in globals.css, so these
 * two knobs visibly retune real motion. A2..A5 add the takeover, removal-exit,
 * stagger, and Add-panel knobs here.
 */
export const EVENT_PAGE_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--tune-route-fade-ms",
    label: "Route crossfade",
    min: 80,
    max: 500,
    step: 10,
    unit: "ms",
    default: 310,
  },
  {
    kind: "select",
    cssVar: "--tune-route-fade-ease",
    label: "Route crossfade easing",
    options: EASING_OPTIONS,
    default: "cubic-bezier(0.23, 1, 0.32, 1)",
  },
  // A2 — the focused-review takeover open cascade ([data-review-tile] in globals.css).
  {
    kind: "range",
    cssVar: "--tune-review-tile-ms",
    label: "Review tile enter",
    min: 120,
    max: 400,
    step: 10,
    unit: "ms",
    default: 240,
  },
  {
    kind: "range",
    cssVar: "--tune-review-stagger-ms",
    label: "Review tile stagger",
    min: 10,
    max: 90,
    step: 5,
    unit: "ms",
    default: 40,
  },
  // A3 — the removal exit ([data-exiting], read by both the CSS and run()) + the
  // all-caught-up beat hold (run() reads --tune-review-beat-ms).
  {
    kind: "range",
    cssVar: "--tune-review-exit-ms",
    label: "Removal exit",
    min: 80,
    max: 400,
    step: 10,
    unit: "ms",
    default: 150,
  },
  {
    kind: "range",
    cssVar: "--tune-review-beat-ms",
    label: "All-caught-up beat",
    min: 600,
    max: 2600,
    step: 50,
    unit: "ms",
    default: 2500,
  },
  // Event-feed prototype (the /design/event-feed lab): the filter-swap entrance + the
  // urgency-reorder duration. Baked as lab defaults; promoted to globals.css on ratification.
  {
    kind: "range",
    cssVar: "--tune-section-swap-ms",
    label: "Section swap",
    min: 80,
    max: 400,
    step: 10,
    unit: "ms",
    default: 180,
  },
  {
    kind: "range",
    cssVar: "--tune-reorder-ms",
    label: "Section reorder",
    min: 160,
    max: 700,
    step: 20,
    unit: "ms",
    default: 500,
  },
  // ── R3, the REEL REVEAL + reel experience. RATIFIED, REVISIT-ONLY: the reveal
  // grammar was ruled by Will at T1 and ratified as-built at T2, so these knobs
  // exist to REVISIT a closed decision on a device, not to be re-tuned during a
  // build. Every `default` mirrors the bake in globals.css `:root` AND the JS
  // fallback in src/components/reel/reveal-constants.ts (the three-place
  // contract above) — change one, change all three.
  {
    kind: "range",
    cssVar: "--tune-rvl-fly-ms",
    label: "Assembly flight",
    min: 300,
    max: 1100,
    step: 20,
    unit: "ms",
    default: 640,
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-stagger-ms",
    label: "Flight stagger",
    min: 0,
    max: 120,
    step: 6,
    unit: "ms",
    default: 42,
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-hold-ms",
    label: "Stack hold",
    min: 0,
    max: 1600,
    step: 50,
    unit: "ms",
    default: 700,
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-flash-ms",
    label: "Camera flash",
    min: 160,
    max: 700,
    step: 20,
    unit: "ms",
    default: 360,
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-expand-ms",
    label: "Full-bleed expansion",
    min: 300,
    max: 1400,
    step: 20,
    unit: "ms",
    default: 720,
  },
  {
    kind: "select",
    cssVar: "--tune-rvl-expand-ease",
    label: "Expansion easing",
    options: EASING_OPTIONS,
    default: "cubic-bezier(0.77, 0, 0.175, 1)", // in-out-strong (on-screen movement)
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-title-ms",
    label: "Title hold",
    min: 600,
    max: 3000,
    step: 50,
    unit: "ms",
    default: 1700,
  },
  {
    kind: "range",
    cssVar: "--tune-rxp-pub-ms",
    label: "Publish flourish",
    min: 300,
    max: 1400,
    step: 50,
    unit: "ms",
    default: 700,
  },
  {
    kind: "range",
    cssVar: "--tune-rxp-sheet-ms",
    label: "Sheets + swaps",
    min: 160,
    max: 300,
    step: 10,
    unit: "ms",
    default: 260,
  },
];

/**
 * The MARKETING knobs (Track B), mounted by MarketingMotionTuner on the
 * (cinema) group layout. Three-way contract as above: each `default` MIRRORS
 * the value baked into marketing.css. Marketing build tracks APPEND their beats
 * here in the same commit that wires the matching var() into marketing.css.
 *
 * ★ These knobs write to the [data-mkt] wrapper, not <html> — the --mkt-*
 * tokens are DECLARED there, so an inline value on <html> is shadowed and does
 * nothing (motion-tuner.tsx's tunerScope; the bug that made the two reveal
 * knobs inert was found and fixed in the 2026-08-28 nav round).
 *
 * The NAV group exists because the nav's numbers are TASTE, not correctness —
 * how instant a hover feels and how far a panel sweeps are Will's calls, and a
 * round-trip per 20ms is a bad loop. Hover intent is included even though it is
 * consumed by JS: marketing-nav.tsx reads it with readCssMs off the [data-mkt]
 * scope, so a live tuner change lands on the next mount (a reload, not a drag).
 */
export const MARKETING_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--mkt-reveal-ms",
    label: "Section reveal",
    min: 200,
    max: 1400,
    step: 20,
    unit: "ms",
    default: 700,
  },
  {
    kind: "range",
    cssVar: "--mkt-stagger-ms",
    label: "Reveal stagger",
    min: 0,
    max: 240,
    step: 10,
    unit: "ms",
    default: 90,
  },
  // ── Nav (the header dropdowns + the hover indicator) ──
  {
    kind: "range",
    cssVar: "--mkt-nav-intent-ms",
    label: "Nav hover intent (reload)",
    min: 0,
    max: 300,
    step: 10,
    unit: "ms",
    default: 100,
  },
  {
    kind: "range",
    cssVar: "--mkt-dropdown-open-ms",
    label: "Panel open + morph",
    min: 80,
    max: 400,
    step: 10,
    unit: "ms",
    default: 200,
  },
  {
    kind: "range",
    cssVar: "--mkt-dropdown-close-ms",
    label: "Panel close",
    min: 60,
    max: 300,
    step: 10,
    unit: "ms",
    default: 130,
  },
  {
    kind: "range",
    cssVar: "--mkt-dropdown-swap-distance",
    label: "Side-by-side sweep",
    min: 0,
    max: 208,
    step: 4,
    unit: "px",
    default: 32,
  },
  {
    kind: "range",
    cssVar: "--mkt-dropdown-swap-blur",
    label: "Sweep blur",
    min: 0,
    max: 8,
    step: 1,
    unit: "px",
    default: 3,
  },
  {
    kind: "range",
    cssVar: "--mkt-nav-indicator-ms",
    label: "Indicator travel",
    min: 60,
    max: 400,
    step: 10,
    unit: "ms",
    default: 180,
  },
  {
    kind: "range",
    cssVar: "--mkt-dropdown-hover-ms",
    label: "Panel row hover in",
    min: 0,
    max: 300,
    step: 10,
    unit: "ms",
    default: 90,
  },
];
