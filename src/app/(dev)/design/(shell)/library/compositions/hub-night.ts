/**
 * THE WEDDING'S NIGHT, AS THE HUB'S FACTS STRIP READS ONE (`HubFactsStrip`, `arrivals`): the Library's hub-head
 * specimens have no album store to read their photographs off, so they are handed the night itself.
 *
 * Each press of Add lands a run of photographs half a minute apart, and the evening is the stretch between presses.
 * The list is `[minutes since the press before, photographs it landed]`, oldest first, written out so the line has the
 * shape a party has (the ceremony's rush, a dinner lull, the toasts, the dancing) and the runs total the 214 the
 * specimens' number says.
 */
export const NIGHT_PRESSES: ReadonlyArray<readonly [number, number]> = [
  // the ceremony
  [0, 3],
  [6, 5],
  [4, 9],
  [11, 6],
  [3, 12],
  // the cocktail hour
  [19, 4],
  [8, 7],
  [13, 3],
  [9, 6],
  [16, 2],
  // dinner
  [24, 2],
  [31, 3],
  [18, 1],
  [27, 4],
  // the toasts
  [14, 8],
  [5, 13],
  [4, 15],
  [9, 6],
  [12, 4],
  // the cake and the first dance
  [17, 5],
  [6, 11],
  [5, 14],
  [10, 7],
  // the dancing
  [13, 7],
  [4, 10],
  [6, 12],
  [3, 6],
  [9, 8],
  [5, 4],
  // the last dance, and the goodbyes
  [11, 6],
  [7, 4],
  [15, 3],
  [9, 4],
];

/** The night's photographs: the number its specimens' counts say. */
export const NIGHT_PHOTOS = NIGHT_PRESSES.reduce(
  (total, [, photos]) => total + photos,
  0,
);

/** How far apart a run's photographs land, in minutes. */
const RUN_SPACING = 0.5;

/** How old the newest photograph is when a specimen opens, in minutes: inside the strip's quarter-hour, so it is lit. */
export const TONIGHT_AGE_MINUTES = 3;

/**
 * The night as `arrivalsOf`'s shape (minutes since the epoch, oldest first), its newest photograph landing at
 * `newest`. Each press is the newest of its run, so the run stands behind it. Pure: a specimen and its test read
 * one night.
 */
export function nightArrivals(newest: number): number[] {
  const presses: number[] = [];
  let at = 0;
  for (const [gap] of NIGHT_PRESSES) presses.push((at += gap));
  const shift = newest - at;
  const out: number[] = [];
  NIGHT_PRESSES.forEach(([, photos], i) => {
    for (let k = 0; k < photos; k++)
      out.push(shift + presses[i] - k * RUN_SPACING);
  });
  // A long run reaches back past the press before it: the album's order is the arrival's, never the press's.
  return out.sort((a, b) => a - b);
}
