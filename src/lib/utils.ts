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
 * `subhead` was, 2026-09-18), and the parity is pinned by
 * src/lib/type-ladder-policy.test.ts.
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
] as const;

const twMerge = extendTailwindMerge({
  extend: { theme: { text: [...TYPE_STEPS] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable byte size for storage/usage UI (e.g. "500 GB", "2 TB", "4.3 MB").
 * Uses binary units (1024) to match the byte accounting in `storage_cap_bytes` /
 * `storage_used_bytes` so displayed numbers reconcile with enforcement.
 */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** i;
  // Whole numbers read cleaner without a trailing ".0".
  const rounded = Number.isInteger(value)
    ? value
    : value.toFixed(fractionDigits);
  return `${rounded} ${units[i]}`;
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
