/**
 * THE CONTACT SHEET, AS DATA (the-wait r1, Will's `wait=sheet`, his disposable-mode r3 pick on the album itself: "a
 * square a photo in the order taken, everyone's dark and filling live, hers lit"). The album draws it wherever photos
 * wait (`gallery-empty-state.tsx`'s `AlbumWait`), and Maya's hub draws the very same sheet as her cover
 * (`event-gallery.tsx`), so this is the one layout both read.
 *
 * ★ EVERYONE'S IS NUMBERS ALONE. What a guest may know of anyone else's waiting photo is a count and the minute it
 * landed in (`album_changes_since`'s `waiting`, `GuestFullSync.waiting`), so a square of theirs carries a place, a
 * minute and how warm it still is, and nothing else: no id, no picture, no name. Only her own carry pictures (her
 * tracker's read, presigned for her alone, or this device's own file).
 *
 * ★ HERS ARE INSIDE THE COUNT. The sync counts every waiting row, hers included, so her own light up AT their minutes
 * rather than beside them; one of this visit's landings the count has not read yet stands after it, and what she is
 * still sending stands at the very end, outside the count, until it lands.
 *
 * ★ CAPPED, THE COUNT CLIMBING PAST IT (Will's cover note: "consider how annoyingly long that grid could become in huge
 * events, maybe consider a max visual size then just let the count increase"): a few rows of squares at most, the
 * newest kept and the oldest folded into one number.
 *
 * Pure and isomorphic.
 */
import type { WaitingFacts } from "@/lib/disposable/facts";

/** One of hers, waiting: where it came from, its picture, and when it was taken (null until her rows are read). */
export type HerShot = {
  /** Its media id once it has one, else this visit's queue id. */
  key: string;
  /** When it was taken, epoch ms (her own rows' read), or null for this visit's landing not read back yet. */
  at: number | null;
  /** Her picture: this device's own file, or the tile presigned for her alone; null where neither is in hand. */
  src: string | null;
  video: boolean;
  /** Still on its way (in the air): drawn at the end, outside the count. */
  sending: boolean;
};

export type SheetCell =
  | {
      kind: "theirs";
      key: string;
      /** The minute it landed in, epoch ms. */
      minute: number;
      /** 0 to 1: how warm it still is with being just added (a quarter of an hour's fade). */
      warm: number;
    }
  | {
      kind: "hers";
      key: string;
      minute: number;
      src: string | null;
      video: boolean;
    }
  | { kind: "sending"; key: string; minute: number; src: string | null };

export type Sheet = {
  /** The squares drawn, oldest first (the night's order), at most the cap. */
  cells: SheetCell[];
  /** How many older squares folded away past the cap. */
  folded: number;
  /** Everyone's waiting, hers included (the sync's count, and a landing of hers it has not read yet). */
  count: number;
  /** How many of hers wait (folded ones too): "Yours · 3". */
  hers: number;
  /** Her newest landing's key, the one that takes the pass of light, or null. */
  newestHers: string | null;
};

/** The sheet's rows at most, at a phone's columns and a desk's. */
const ROWS_AT = { narrow: 8, wide: 6 } as const;

/** The cap for a sheet of `columns` columns: a few rows of them, never a page of squares. */
export function sheetCapFor(columns: number): number {
  return columns * (columns > 16 ? ROWS_AT.wide : ROWS_AT.narrow);
}

/** A phone's cap (twelve columns), the default. */
export const SHEET_CAP = sheetCapFor(12);

/** The sheet's own gap between squares, px (`.wait-sheet`). */
export const SHEET_GAP_PX = 3;

/**
 * The sheet's columns at its width: squares of about thirty pixels, never fewer than a phone's twelve (a square stays
 * a photo's mark, not a speck) nor more than thirty (a desk's sheet stays a sheet, not a carpet).
 */
export function columnsFor(sheetWidth: number): number {
  return Math.max(
    12,
    Math.min(30, Math.floor((sheetWidth + SHEET_GAP_PX) / 34)),
  );
}

/** How long a square stays warm with being just added. */
const WARM_MS = 15 * 60_000;

const minuteOf = (ms: number) => ms - (((ms % 60_000) + 60_000) % 60_000);

export function layoutSheet(input: {
  waiting: Pick<WaitingFacts, "count" | "minutes"> | null;
  hers: readonly HerShot[];
  cap: number;
  /** The reader's clock, for how warm the newest still are; null before it is known (nothing is warm yet). */
  nowMs: number | null;
}): Sheet {
  const { waiting, hers, cap, nowMs } = input;

  // Everyone's, square by square, in the night's order: the count's own minutes, never anything else.
  type Slot = { minute: number; hers: HerShot | null };
  const slots: Slot[] = [];
  for (const [at, rows] of waiting?.minutes ?? []) {
    for (let k = 0; k < rows; k++) slots.push({ minute: at, hers: null });
  }
  // A count the minutes do not add up to (a reader older than its minutes) still draws its squares, at the newest.
  const told = waiting?.count ?? 0;
  const lastMinute = slots.length
    ? slots[slots.length - 1]!.minute
    : minuteOf(nowMs ?? 0);
  // Before the reader's clock is known, "now" is the newest minute the count was read in.
  const now = nowMs ?? lastMinute;
  while (slots.length < told) slots.push({ minute: lastMinute, hers: null });

  // Hers, inside the count: each at its own minute where her rows say when; this visit's newest places otherwise.
  const landed = hers.filter((h) => !h.sending);
  const extras: Slot[] = [];
  const known = landed
    .filter((h) => h.at !== null)
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  for (const h of known) {
    const minute = minuteOf(h.at!);
    const free = slots.findIndex((s) => s.minute === minute && s.hers === null);
    if (free >= 0) slots[free]!.hers = h;
    else extras.push({ minute, hers: h });
  }
  for (const h of landed.filter((s) => s.at === null)) {
    let free = -1;
    for (let i = slots.length - 1; i >= 0; i--) {
      if (slots[i]!.hers === null) {
        free = i;
        break;
      }
    }
    if (free >= 0) slots[free]!.hers = h;
    else extras.push({ minute: minuteOf(now), hers: h });
  }
  // A landing the count has not read yet stands in its own minute's place.
  for (const extra of extras) {
    let at = slots.length;
    while (at > 0 && slots[at - 1]!.minute > extra.minute) at--;
    slots.splice(at, 0, extra);
  }

  const cells: SheetCell[] = slots.map((s, i) =>
    s.hers
      ? {
          kind: "hers",
          key: `h:${s.hers.key}`,
          minute: s.minute,
          src: s.hers.src,
          video: s.hers.video,
        }
      : {
          kind: "theirs",
          key: `t:${i}`,
          minute: s.minute,
          warm: nowMs === null ? 0 : warmth(s.minute, nowMs),
        },
  );
  const count = cells.length;
  for (const h of hers.filter((s) => s.sending)) {
    cells.push({
      kind: "sending",
      key: `s:${h.key}`,
      minute: minuteOf(now),
      src: h.src,
    });
  }

  const folded = Math.max(0, cells.length - cap);
  const newest = [...landed].sort(
    (a, b) =>
      (b.at ?? Number.MAX_SAFE_INTEGER) - (a.at ?? Number.MAX_SAFE_INTEGER),
  )[0];
  return {
    cells: folded > 0 ? cells.slice(folded) : cells,
    folded,
    count,
    hers: landed.length,
    newestHers: newest ? newest.key : null,
  };
}

/** How warm a square still is: 1 in its first minute, cooling to 0 over a quarter of an hour. */
function warmth(minute: number, nowMs: number): number {
  const age = nowMs - minute - 60_000;
  if (age <= 0) return 1;
  if (age >= WARM_MS) return 0;
  return Math.round((1 - age / WARM_MS) * 100) / 100;
}

/**
 * WHETHER THE SHEET STANDS IN THE ALBUM: only where what is added waits (the page's live reading: the host's approval,
 * or a develop time ahead), and only once something does, or she is sending or has sent to it. An album that waits with
 * nothing in it yet keeps its own empty state ("The album starts with you"); an album that shows what is added at once
 * never draws a wait, whatever a count read a moment before its develop says.
 */
export function waitStands(input: {
  waits: boolean;
  count: number;
  /** Hers in the air. */
  sending: number;
  /** Hers landed this visit and waiting. */
  landed: number;
}): boolean {
  if (!input.waits) return false;
  return input.count > 0 || input.sending > 0 || input.landed > 0;
}
