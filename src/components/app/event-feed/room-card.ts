/**
 * THE CARDS ROW'S ONE SHELL, shared by the room cards and the Highlight reel's card so the row
 * reads as one set of doors whatever each card holds. At rest a card is a small tile; stuck to
 * the bar it condenses in place to a pill (the row must never remount: `event-cards-row.tsx`).
 *
 * ★ ALL FOUR DOORS AT REST ON A PHONE. A row of four 144px tiles ran past a 375px screen, so the
 * third card sat half off it and Settings was never seen at rest (the ROADMAP's Host line, measured
 * on `event-safety`). Below `sm` the row is a 2x2 grid of two-line cards instead (icon and label on
 * the first line, the value under them), every door visible and every value whole; from `sm` it is
 * the row of tiles, 144px until `md` so four fit at 640, then 160.
 */
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

export const ROOM_CARD_BASE = cn(
  "group flex shrink-0 flex-col justify-between rounded-xl border outline-none transition-all duration-200 ease-emphasis",
  "focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:active:scale-100",
);

/** The card's box: a two-line card on a phone, a tile from `sm`, a pill stuck to the bar. */
export function roomCardSize(stuck: boolean): string {
  return stuck
    ? "h-9 min-w-0 flex-row items-center gap-1.5 px-3"
    : cn(
        "min-h-16 min-w-0 flex-row flex-wrap content-center items-center justify-start gap-x-1.5 gap-y-0.5 p-2.5",
        "sm:h-24 sm:w-36 sm:flex-col sm:flex-nowrap sm:content-normal sm:items-stretch sm:justify-between sm:gap-1 sm:p-3 md:w-40",
      );
}

/** The value line: a line of its own under the label on a phone's two-line card. */
export const ROOM_CARD_VALUE = "basis-full sm:basis-auto";

/** The row's own layout: a phone's 2x2 grid at rest, the row of tiles from `sm`, pills stuck. */
export function roomRowLayout(stuck: boolean): string {
  return stuck ? "flex gap-2 py-0.5" : "grid grid-cols-2 gap-2 py-0.5 sm:flex";
}

/** A plain card's border: the row's quiet default. */
export const ROOM_CARD_QUIET = "border-border hover:border-foreground/25";

/**
 * THE REVIEW CARD'S FACE, from whether review is on and what waits in it: the server's first paint
 * and the row's live count read it from this one place, so the two can never word it differently.
 */
export function reviewCardFace(
  moderationOn: boolean,
  pending: number,
): { value: string; amber: boolean; count: number | undefined } {
  const waiting = moderationOn && pending > 0;
  return {
    value: moderationOn
      ? pending > 0
        ? `${formatCount(pending)} waiting`
        : "All caught up"
      : "Off",
    amber: waiting,
    count: waiting ? pending : undefined,
  };
}
