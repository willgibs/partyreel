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
    default: 220,
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
];
