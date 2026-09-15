/**
 * Motion-tuner control config (S4·0; the rounding and tweaking GUI round,
 * 2026-09-14). Plain, serializable data so a SERVER page can import it and pass
 * it across the RSC boundary into the (client) MotionTuner without pulling
 * client code server-side. Each control binds to a CSS custom property the
 * polish CSS reads as `var(--tune-x, <baked default>)` or a real token
 * (`--radius`, `--spill-cadence`); the tuner writes the live value as an inline
 * style on the element that declares it (motion-tuner.tsx's tunerScope) and
 * keeps it in a store that survives a Replay, a navigation out of the cinema
 * group and a reload (tuner-store.ts).
 *
 * THE RULE OF THE PANEL (Will, 2026-09-12: "some of the labels aren't very
 * clear"; ruled at the rounding round): every knob carries a `description` (what
 * moves, in a sentence) and `ships` (where it lands in the product), and every
 * knob has a SPECIMEN somewhere the tuner mounts: the motion playground
 * (/design/lab/tools/motion) for the app's beats, the real cinema pages for the marketing
 * knobs, the rounding board (/design/lab/rounding) for the radius tokens. A knob
 * without a specimen is retired from the panel rather than left as a dead
 * slider: the reel reveal's seven and the reel experience's two (ratified at T1,
 * revisit-only) and the event feed's swap and reorder (ratified 2026-06-22) left
 * the panel here; their vars and baked values are untouched (the three-place
 * contract in src/components/reel/reveal-constants.ts still holds), and a
 * revisit re-adds a knob WITH its specimen in the same commit.
 *
 * GROWS PER INCREMENT: an increment APPENDS its controls here in the SAME commit
 * it wires the matching `var()` into the CSS, with a description, a ships line
 * and a specimen. The `default`s below MUST mirror the baked defaults in
 * globals.css / marketing.css so the panel opens at the live state.
 */

export type TunerGroup =
  | "rounding"
  | "lamps"
  | "reveal"
  | "nav"
  | "route"
  | "review";

export const TUNER_GROUP_LABEL: Record<TunerGroup, string> = {
  rounding: "Rounding",
  lamps: "Lamps",
  reveal: "Section reveal",
  nav: "Nav",
  route: "Route change",
  review: "Review takeover",
};

type ControlBase = {
  cssVar: string;
  label: string;
  group: TunerGroup;
  /** What moves when this knob moves, one sentence. */
  description: string;
  /** Where it lands in the product, so the panel says what a drag restyles. */
  ships: string;
};

export type TunerControl =
  | (ControlBase & {
      kind: "range";
      min: number;
      max: number;
      step: number;
      unit: string;
      default: number;
    })
  | (ControlBase & {
      kind: "select";
      options: { label: string; value: string }[];
      default: string;
    });

/** The project's strong custom curves (globals.css @theme) + a couple of built-ins. */
export const EASING_OPTIONS: { label: string; value: string }[] = [
  { label: "emphasis", value: "cubic-bezier(0.23, 1, 0.32, 1)" },
  { label: "in-out-strong", value: "cubic-bezier(0.77, 0, 0.175, 1)" },
  { label: "drawer", value: "cubic-bezier(0.32, 0.72, 0, 1)" },
  { label: "ease-out", value: "ease-out" },
  { label: "linear", value: "linear" },
];

/**
 * The app's beats, with a specimen each on the motion playground
 * (/design/lab/tools/motion): the route crossfade, the review takeover's tile cascade,
 * the removal exit and the all-caught-up beat.
 */
export const EVENT_PAGE_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--tune-route-fade-ms",
    label: "Route crossfade",
    group: "route",
    description:
      "How long the whole page takes to cross-fade when the route changes.",
    ships: "the host app's page transitions (dashboard to settings and back)",
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
    group: "route",
    description: "The curve the cross-fade follows.",
    ships: "the same page transitions",
    options: EASING_OPTIONS,
    default: "cubic-bezier(0.23, 1, 0.32, 1)",
  },
  // A2 — the focused-review takeover open cascade ([data-review-tile] in globals.css).
  {
    kind: "range",
    cssVar: "--tune-review-tile-ms",
    label: "Review tile enter",
    group: "review",
    description:
      "How long each pending tile takes to settle in when the review takeover opens.",
    ships: "the host's review takeover grid",
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
    group: "review",
    description: "The delay between one tile's entrance and the next.",
    ships: "the same grid",
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
    group: "review",
    description:
      "How long an acted tile fades and scales out before the list reflows.",
    ships: "the review takeover, and the guest gallery's own removals",
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
    group: "review",
    description:
      "How long the success beat holds when the last pending item clears.",
    ships: "the review takeover's end",
    min: 600,
    max: 2600,
    step: 50,
    unit: "ms",
    default: 2500,
  },
];

/**
 * THE ROUNDING KNOBS (staged 2026-09-01; the round opened 2026-09-14). --radius
 * is the base every rounded-* utility derives from (theme.css: sm 0.6x, md
 * 0.8x, lg 1x, xl 1.4x, 2xl 1.8x, 3xl 2.2x, 4xl 2.6x), so one knob restyles
 * every sharp-family surface at once; --radius-float and --radius-tile are
 * separate tokens by design (menus/toasts; media grids) and get their own knobs
 * so the round can decide whether they move with the surfaces or stay put;
 * the three action radii are the other half of the sharp-surface / round-action
 * contrast (globals.css: 16px at the 40px button, scaled ~0.4x height), and
 * without them on the panel the sitting could only drag one side of the
 * contrast. Baked: 0.125rem / 0.5rem / 3px / 1rem / 1.2rem / 0.8rem; the tuner
 * writes px, the same computed values. Not --mkt-*, so tunerScope puts these on
 * <html>, where an inline value outranks the :root token, and a soft navigation
 * carries them across pages. The specimens are the rounding board
 * (/design/lab/rounding) and every real page the tuner mounts on.
 */
export const ROUNDING_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--radius",
    label: "Surface radius",
    group: "rounding",
    description:
      "The base every rounded-* utility derives from; cards, inputs, plates and panels move together.",
    ships:
      "every surface on the site and in the app (about 320 uses in 154 files, the rounding board's count)",
    min: 0,
    max: 24,
    step: 1,
    unit: "px",
    default: 2,
  },
  {
    kind: "range",
    cssVar: "--radius-float",
    label: "Floating-layer radius",
    group: "rounding",
    description: "The corner of anything that floats over the page.",
    ships: "menus, popovers, tooltips, dialogs, toasts",
    min: 0,
    max: 24,
    step: 1,
    unit: "px",
    default: 8,
  },
  {
    kind: "range",
    cssVar: "--radius-tile",
    label: "Media-tile radius",
    group: "rounding",
    description:
      "The corner of a photograph in a tight-gap grid; --gap-gallery is pinned to it so corners never open holes.",
    ships:
      "every media grid: the guest gallery, the host feed, the triage grids",
    min: 0,
    max: 12,
    step: 1,
    unit: "px",
    default: 3,
  },
  {
    kind: "range",
    cssVar: "--radius-action",
    label: "Action radius",
    group: "rounding",
    description:
      "The base of the action ladder: the 40px h-10 button wears it, and the h-6, h-7 and h-9 sizes derive from it (0.6, 0.7 and 0.9x); at half the height and above the corner reads as a pill.",
    ships:
      "the h-10 buttons and the segmented controls; the in-between Button sizes by derivation",
    min: 0,
    max: 48,
    step: 1,
    unit: "px",
    default: 16,
  },
  {
    kind: "range",
    cssVar: "--radius-action-lg",
    label: "Action radius, large",
    group: "rounding",
    description:
      "The corner of the 48px button (rounded-action-lg); 24 and above is a pill.",
    ships:
      "the one rounded-action-lg call site today (the reel builder); the hero and pricing CTAs are h-11 on the base",
    min: 0,
    max: 48,
    step: 0.4,
    unit: "px",
    default: 19.2,
  },
  {
    kind: "range",
    cssVar: "--radius-action-sm",
    label: "Action radius, small",
    group: "rounding",
    description:
      "The corner of the 32px button, which is the DEFAULT Button size (h-8); 16 and above is a pill.",
    ships: "every default Button, toolbar buttons, chips, the icon buttons",
    min: 0,
    max: 32,
    step: 0.4,
    unit: "px",
    default: 12.8,
  },
];

/**
 * The MARKETING knobs (Track B), mounted by MarketingMotionTuner on the
 * (cinema) group layout; the specimen is the real page. Three-way contract as
 * above: each `default` MIRRORS the value baked into marketing.css.
 *
 * ★ The --mkt-* knobs write to the [data-mkt] wrapper, not <html>: the tokens
 * are DECLARED there, so an inline value on <html> is shadowed and does nothing
 * (motion-tuner.tsx's tunerScope; the bug that made the two reveal knobs inert
 * was found and fixed in the 2026-08-28 nav round).
 *
 * The NAV group exists because the nav's numbers are TASTE, not correctness:
 * how instant a hover feels and how far a panel sweeps are Will's calls, and a
 * round-trip per 20ms is a bad loop. Hover intent is consumed by JS
 * (marketing-nav.tsx reads it with readCssMs off the [data-mkt] scope), so a
 * live change lands on the next mount (a reload, not a drag).
 */
export const MARKETING_TUNER_CONTROLS: TunerControl[] = [
  ...ROUNDING_TUNER_CONTROLS,
  // ── The lamps' cadence (staged for the cadence sitting, 2026-09-11) ──
  // Every lamp reads --spill-cadence (globals.css, 11s as shipped; the engine's
  // ruled register is 8s). The honest A/B is the whole home page at each: drag,
  // walk the page, rule. On <html> like the radius knobs.
  {
    kind: "range",
    cssVar: "--spill-cadence",
    label: "Lamp cadence",
    group: "lamps",
    description:
      "One full cycle of every lamp's drift; the engine's ruled register is 8s, every lamp shipped at 11s.",
    ships:
      "the footer seam, the film strip, the reel pool, the feature heroes' screen lamps",
    min: 6,
    max: 14,
    step: 1,
    unit: "s",
    default: 11,
  },
  {
    kind: "range",
    cssVar: "--mkt-reveal-ms",
    label: "Section reveal",
    group: "reveal",
    description:
      "How long a section takes to rise in as it enters the viewport.",
    ships: "every marketing section below the hero",
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
    group: "reveal",
    description: "The delay between one revealed child and the next.",
    ships: "card rows and lists inside those sections",
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
    group: "nav",
    description:
      "How long the pointer rests on a nav item before its panel opens; read by JS at mount, so reload to feel it.",
    ships: "the marketing header's primary nav",
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
    group: "nav",
    description:
      "How long a nav panel takes to open, and to morph between two panels.",
    ships: "the header dropdowns",
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
    group: "nav",
    description: "How long a nav panel takes to close.",
    ships: "the header dropdowns",
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
    group: "nav",
    description:
      "How far the content slides when the pointer moves from one panel to its neighbour.",
    ships: "the header dropdowns",
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
    group: "nav",
    description: "The blur on the content during that sweep.",
    ships: "the header dropdowns",
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
    group: "nav",
    description:
      "How long the hover indicator takes to slide to the next item.",
    ships: "the header's primary nav",
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
    group: "nav",
    description: "How fast a row inside a panel lights on hover.",
    ships: "the header dropdowns' rows",
    min: 0,
    max: 300,
    step: 10,
    unit: "ms",
    default: 90,
  },
];
