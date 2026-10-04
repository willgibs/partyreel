import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { eventDays } from "@/lib/events/dates";

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

/**
 * ★ THE SHADOW TOKENS, THE SAME TRAP A THIRD TIME. tailwind-merge's shadow group
 * knows only Tailwind's own size names, so an unknown `shadow-*` is filed under
 * shadow COLOUR, which sits beside a size instead of replacing it:
 * `cn("shadow-layer", "shadow-none")` kept both and the stylesheet's alphabet
 * picked the winner, and a stock `shadow-md` a generator writes onto a component
 * beat the elevation token the same way. Declared, the last class wins, and a
 * real shadow colour still sits beside either (`shadow-layer shadow-red-500`).
 * The names are exactly the self-mapped `--shadow-*` tokens theme.css declares
 * (the elevation contract's two utilities); the parity is pinned by
 * src/lib/type-ladder-policy.test.ts beside the other two.
 */
export const SHADOW_TOKENS = ["lift", "layer"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...TYPE_STEPS],
      radius: [...RADIUS_TOKENS],
      shadow: [...SHADOW_TOKENS],
    },
  },
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
 * ★ ONE PINNED DATE FORMAT (crumbs-33, from `hardening`): the product's calendar dates print in `en-US`, read in
 * UTC, whoever renders them. A bare `toLocaleDateString(undefined, …)` printed the RUNTIME's locale: the server's
 * during SSR and the browser's on hydration, so a browser that reads German drew "1. Juni 2026" over the server's
 * "June 1, 2026" (a hydration mismatch, React's #418), and a server page printed whatever its runtime happened to
 * be. `formatCount` closed the same drift for counts. The admin's timestamps are `format/admin-time.ts`'s and a day
 * in the viewer's own zone is `format/date-in-zone.ts`'s; `utils.test.ts` refuses a date printed in the runtime's
 * locale anywhere in the product.
 *
 * ★ `formatEventDate`'s en-US output is byte for byte what it printed before the pin ("June 1, 2026"): the desk's
 * boards draw it (`event-ready`, `locked-door`), as do the album, the hub, the claims card and the help.
 */
const DATE_LOCALE = "en-US";
const DATE_ZONE = "UTC";

const DAY = new Intl.DateTimeFormat(DATE_LOCALE, {
  timeZone: DATE_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

const MONTH = new Intl.DateTimeFormat(DATE_LOCALE, {
  timeZone: DATE_ZONE,
  year: "numeric",
  month: "long",
});

/** A month and its day, "October 30": a range's first day where its year is said once, at its end. */
const MONTH_DAY = new Intl.DateTimeFormat(DATE_LOCALE, {
  timeZone: DATE_ZONE,
  month: "long",
  day: "numeric",
});

/** A month's name alone, "October": the lead a same-month range says once, before its two day numbers. */
const MONTH_NAME = new Intl.DateTimeFormat(DATE_LOCALE, {
  timeZone: DATE_ZONE,
  month: "long",
});

/** The day of the month alone, "5": a same-month range's two days, said after its month once. */
const DAY_OF_MONTH = new Intl.DateTimeFormat(DATE_LOCALE, {
  timeZone: DATE_ZONE,
  day: "numeric",
});

/** A `YYYY-MM-DD` calendar day at UTC midnight, from its own parts. */
function calendarDay(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * ★ A RANGE'S DASH, BY THE TYPOGRAPHER'S RULE (crumbs-58, Will 2026-10-03: "let's go 'X-Y', it presents cleaner than 'X
 * to Y'. Less space, more compact."): the en dash (U+2013), closed up between two single terms ("3–5", "Tue–Thu") and
 * spaced where either side holds a space ("October 30 – November 2"). Every range the product says goes through here
 * (`formatEventDate`, the dashboard's `lib/dashboard/when.ts`), so each surface follows with no edit of its own; a range
 * that shares a lead (the month of "October 3–5") passes only the two terms the dash stands between.
 *
 * ★ NEVER `Intl.DateTimeFormat#formatRange`: it spaces the dash on THIN spaces (U+2009: "October 3 – 5, 2026", measured
 * on Node 22 / ICU 77), which a closed-up range never has, and its spacing is the runtime's ICU's, so a server and a
 * browser could print one range two ways (the drift the pinned formats above close). Plain U+0020 only.
 *
 * ★ A SCREEN READER MAY NOT SAY "TO" FOR IT (measured, crumbs-58): macOS's voice reads "October 3–5" as "3 to 5" but says
 * nothing for a spaced dash, and no "to" between weekday names; NVDA lists the en dash under "most" punctuation, so its
 * default level ("some") skips it. So a range is never drawn as bare text: `RangeText` (`lib/format/range-text.tsx`)
 * keeps the dash for the eye and hides it from a reader, who is told "to" instead, and a range placed in an attribute
 * or a sentence a reader reads (`aria-label`, `title`) goes through `spokenRange`. The dash is the ONE marker both
 * read, so a range any formatter builds from `dashRange` is covered with no second form to keep in step.
 */
export function dashRange(from: string, to: string): string {
  return /\s/.test(from) || /\s/.test(to)
    ? `${from} \u2013 ${to}`
    : `${from}\u2013${to}`;
}

/** A range dash with the single spaces `dashRange` closes or opens it with ("3\u20135", "October 30 \u2013 November 2"). */
const RANGE_DASH_SOURCE = "\\s?\\u2013\\s?";

/** `split` on this keeps each dash (with its spaces) between the terms it stands between: `RangeText`'s cut. */
export const RANGE_DASH = new RegExp(`(${RANGE_DASH_SOURCE})`);

/**
 * A range, spoken: its dash said as "to" ("October 3\u20135, 2026" reads "October 3 to 5, 2026"), for a place a reader
 * takes as a plain string, where `RangeText`'s hidden "to" has no markup to ride. Only a date formatter's own
 * output belongs here (an en dash in somebody's name is a dash): the rest of the text is untouched.
 */
export function spokenRange(text: string): string {
  return text.replace(new RegExp(RANGE_DASH_SOURCE, "g"), " to ");
}

/**
 * Formats an `events.event_date` ("YYYY-MM-DD", a date-only column) for display: "June 1, 2026", and with the event's
 * last day (`events.event_end_date`) a range of days in the fewest words that are still exact: "October 3–5, 2026",
 * "October 30 – November 2, 2026", "December 30, 2026 – January 2, 2027" (lane `event-dates`; the dash is
 * `dashRange`'s). An end that is missing, unreadable or no later than the date is the one day (`eventDays`, the
 * range's one shape).
 * WHY split-and-construct instead of `new Date(str)`: the column is a calendar day, not an instant, so it is built
 * at UTC midnight from its own parts and read back in UTC, which is that same day whatever zone the page renders
 * in (a midnight read in another zone would be the day before, or after).
 */
export function formatEventDate(date: string, endDate?: string | null): string {
  const days = eventDays(date, endDate);
  if (!days || days.last === days.first) return DAY.format(calendarDay(date));
  const first = calendarDay(days.first);
  const last = calendarDay(days.last);
  const year = days.first.slice(0, 4);
  if (days.last.slice(0, 4) !== year)
    return dashRange(DAY.format(first), DAY.format(last));
  if (days.last.slice(0, 7) !== days.first.slice(0, 7))
    return `${dashRange(MONTH_DAY.format(first), MONTH_DAY.format(last))}, ${year}`;
  const dates = dashRange(
    DAY_OF_MONTH.format(first),
    DAY_OF_MONTH.format(last),
  );
  return `${MONTH_NAME.format(first)} ${dates}, ${year}`;
}

/** An instant's month and year, "September 2026" (a profile's Joined), read in UTC like every pinned date. */
export function formatMonthYear(value: string | number | Date): string {
  return MONTH.format(value instanceof Date ? value : new Date(value));
}
