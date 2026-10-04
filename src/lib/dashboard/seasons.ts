import { AFTER_DAYS, type Dated, dayOf, daysToEvent } from "./when";

/**
 * YOUR EVENTS, GROUPED BY WHEN (host-dashboard r1, `events=seasons`, the working events section; his r2
 * explores the customizable collection his note describes): what is coming (soonest first, then the
 * undated ones she is setting up), what just happened (the after-party month, newest first), the rest
 * of this year, then each earlier year folded into one line. The tiles shrink as the photographs age,
 * so forty events never draw as one wall of equal covers.
 *
 * ★ THE LARGEST TILES GO TO THE FRESHEST PHOTOGRAPHS: a party just past is where the album is full and
 * new, so it draws largest; a party still to come has only its date, which reads as well a size
 * smaller; a party months gone is a thumbnail, and a year gone is a line.
 *
 * An event sits by its days (`daysToEvent`): the host's date, else the day its photographs last landed.
 * ★ A range of days is coming up while any day of it is still ahead or today, just past for the month
 * after its LAST day, and folds into the year it began (`dayOf`). Pure: ids in, groups of ids out, so
 * the server groups once and the client lays the groups out through whatever lens and search the host
 * has on.
 */

export type SeasonSize = "large" | "medium" | "small" | "folded";

export type Season = {
  id: string;
  label: string;
  size: SeasonSize;
  /** The events in it, in its own order. */
  ids: string[];
};

type Placed = Dated & { id: string; createdAt: string };

export function seasonsOf(events: readonly Placed[], today: string): Season[] {
  const at = (e: Placed) => daysToEvent(e, today)!;
  const newest = (a: Placed, b: Placed) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const year = today.slice(0, 4);

  const dated = events.filter((e) => dayOf(e) !== null);
  const coming = [
    ...dated.filter((e) => at(e) >= 0).sort((a, b) => at(a) - at(b)),
    // No day at all: an empty album nobody dated, still being set up, newest made first.
    ...events.filter((e) => dayOf(e) === null).sort(newest),
  ];
  const recent = dated
    .filter((e) => at(e) < 0 && -at(e) <= AFTER_DAYS)
    .sort((a, b) => at(b) - at(a));
  const older = dated
    .filter((e) => -at(e) > AFTER_DAYS)
    .sort((a, b) => at(b) - at(a));
  const thisYear = older.filter((e) => dayOf(e)!.startsWith(year));
  const years = [...new Set(older.map((e) => dayOf(e)!.slice(0, 4)))]
    .filter((y) => y !== year)
    .sort((a, b) => b.localeCompare(a));

  const ids = (list: readonly Placed[]) => list.map((e) => e.id);
  const out: Season[] = [];
  if (coming.length)
    out.push({
      id: "coming",
      label: "Coming up",
      size: "medium",
      ids: ids(coming),
    });
  if (recent.length)
    out.push({
      id: "recent",
      label: "Just past",
      size: "large",
      ids: ids(recent),
    });
  if (thisYear.length)
    out.push({
      id: `year-${year}`,
      label: `Earlier in ${year}`,
      size: "small",
      ids: ids(thisYear),
    });
  for (const y of years)
    out.push({
      id: `year-${y}`,
      label: y,
      size: "folded",
      ids: ids(older.filter((e) => dayOf(e)!.startsWith(y))),
    });
  return out;
}
