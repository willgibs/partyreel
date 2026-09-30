import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * ★ THE TYPE LADDER HAS TO BE DECLARED HERE OR `cn()` EATS IT (measured at the
 * type wiring, 2026-09-17). tailwind-merge does not read our stylesheet, so any
 * `text-*` class it cannot recognise as a font size falls into its `text-color`
 * group, which accepts anything. Unextended, `cn("font-heading text-chapter
 * text-white")` returned `font-heading text-white`: the step was dropped on
 * every heading that also names a colour, silently, with nothing to see in the
 * source. The names below are exactly the `--text-*` steps declared in
 * src/app/theme.css; a step added there is added here in the same change (as
 * `subhead` was, 2026-09-18, and as the six body steps were, 2026-09-20), and
 * the parity is pinned by src/lib/type-ladder-policy.test.ts.
 *
 * ★ THE LIST IS IN LADDER ORDER, TOP TO BOTTOM, AND THE TWO HALVES MEET AT 16.
 * Ten heading steps, then six body steps: `copy` (16 -> 18, marketing's ledes
 * and paragraphs), `reading` (16, every guest-facing sentence), `working` (14,
 * the app and the admin), `caption` (12), `label` (12 on 0.08em, worn with
 * `uppercase`) and `micro` (10, the floor). `label` is a STEP rather than an
 * `@utility` because tailwind-merge cannot see an `@utility` at all — which is
 * this file's whole subject — and because Tailwind emits one AHEAD of the size
 * utilities, where a stray `text-sm` on the same element would beat it.
 */
export const TYPE_STEPS = [
  "display",
  "hero",
  "title",
  "chapter",
  "section",
  "prose",
  "subhead",
  "page",
  "subsection",
  "card-title",
  "copy",
  "reading",
  "working",
  "caption",
  "label",
  "micro",
] as const;

/**
 * ★ THE RADIUS TOKENS, THE SAME TRAP, QUIETER (measured at the corner wiring,
 * 2026-09-18). tailwind-merge's radius group knows only Tailwind's own step
 * names, so `cn("rounded-md", "rounded-tile")` kept BOTH classes and the corner
 * fell to stylesheet order, which is alphabetical for utilities on one
 * property: `rounded-tile` beat `rounded-md` by luck, while every stock step
 * beat `rounded-float` and `rounded-action-sm` whichever was written last (the
 * dashboard's button skeletons asked for the action corner and drew
 * `rounded-md`). Declared, the last class wins, which is what `cn()` promises.
 * The names are exactly the custom `--radius-*` tokens theme.css maps into the
 * theme (its `sm`..`2xl` steps are Tailwind's own names already); the parity is
 * pinned by src/lib/type-ladder-policy.test.ts beside the ladder's.
 */
export const RADIUS_TOKENS = ["action", "action-sm", "tile", "float"] as const;

const twMerge = extendTailwindMerge({
  extend: { theme: { text: [...TYPE_STEPS], radius: [...RADIUS_TOKENS] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/**
 * Human-readable byte size for storage/usage UI (e.g. "500 GB", "2 TB", "4.3 MB").
 * Uses binary units (1024) to match the byte accounting in `storage_cap_bytes` /
 * `storage_used_bytes` so displayed numbers reconcile with enforcement.
 *
 * ★ EVERYTHING IT PRINTS IS READ OFF THE ROUNDED NUMBER (crumbs-28). The ".0" was
 * once decided on the value before rounding, so a size just under 41 GB printed
 * "41.0 GB" (the size list's chips and rows showed it) and one just under a unit's
 * edge "1024.0 MB". A value that rounds to a whole number prints whole, and one that
 * rounds up to 1,024 of a unit is one of the next ("1 GB").
 *
 * `round: "up"` is the storage guard's (`formatBytesUp`, whose WHY is there): the
 * same ladder, rounded up at the digits it prints, so the two can never disagree
 * about anything but the direction.
 */
export function formatBytes(
  bytes: number,
  fractionDigits = 1,
  round: "nearest" | "up" = "nearest",
): string {
  if (!(bytes > 0)) return "0 B";
  const last = BYTE_UNITS.length - 1;
  let i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), last);
  let value = roundBytes(bytes / 1024 ** i, fractionDigits, round);
  if (value >= 1024 && i < last) {
    i += 1;
    value = roundBytes(bytes / 1024 ** i, fractionDigits, round);
  }
  // Whole numbers read cleaner without a trailing ".0".
  const shown = Number.isInteger(value) ? value : value.toFixed(fractionDigits);
  return `${shown} ${BYTE_UNITS[i]}`;
}

/** A size in its unit, rounded at the digits it prints: to nearest, or up. */
function roundBytes(
  value: number,
  digits: number,
  round: "nearest" | "up",
): number {
  if (round === "nearest") return Number(value.toFixed(digits));
  const scale = 10 ** digits;
  // The epsilon stops float noise on an exact value (140 GB) from ticking it up a step.
  return Math.ceil(value * scale - 1e-9) / scale;
}

/**
 * Formats an `events.event_date` ("YYYY-MM-DD", a date-only column) for display.
 * WHY split-and-construct instead of `new Date(str)`: `new Date("2026-06-01")`
 * parses as UTC midnight, which renders as the *previous* day for anyone west of
 * UTC. Building the Date from local Y/M/D parts pins it to the host's own day.
 */
export function formatEventDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
