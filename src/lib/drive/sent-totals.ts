/**
 * WHAT HER ACCOUNT CARD SAYS IT HAS SENT (`DriveAccountCard`'s "Sent"): the albums Partyreel put in her Drive, their
 * bytes, and the last one's day. ★ EACH FILE ONCE: a send takes the whole album, and its bytes count the files an
 * earlier send left that it found and kept, so sends added up count a kept file again (the walk's card read 5.9 MB
 * with 4.3 MB in her Drive). An album's largest send is what reached her Drive of it. Every send that ended counts, a
 * canceled one too, since what it landed stays.
 *
 * Pure: `readMySentTotals` reads her rows (RLS, the progress columns) and folds them here.
 */
export type SentRow = {
  eventId: string | null;
  albumName: string;
  bytesSent: number;
  itemsSent: number;
  closedAt: string | null;
};

export type SentTotals = {
  albums: number;
  bytes: number;
  lastAt: string | null;
};

export function sentTotalsOf(rows: readonly SentRow[]): SentTotals {
  // An album sent twice is one album; one purged since keeps its line by its name.
  const largest = new Map<string, number>();
  let lastAt: string | null = null;
  for (const r of rows) {
    if (r.itemsSent <= 0) continue;
    const album = r.eventId ?? `name:${r.albumName}`;
    largest.set(album, Math.max(largest.get(album) ?? 0, r.bytesSent));
    if (r.closedAt && (!lastAt || r.closedAt > lastAt)) lastAt = r.closedAt;
  }
  let bytes = 0;
  for (const b of largest.values()) bytes += b;
  return { albums: largest.size, bytes, lastAt };
}
