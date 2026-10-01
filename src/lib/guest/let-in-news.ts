/**
 * WHAT SHE IS TOLD ON HER RETURN, AS DATA (crumbs-38: the approval toast's server half, and "The host added your
 * uploads" carried across a reload or a return, answered as one).
 *
 * A decision that lets one of her uploads into the album stamps `media.let_in_at` (migration 20261001203810: a held
 * upload approved, a hidden one shown again, a removed one restored); each of her guest rows keeps
 * `let_in_told_at`, the newest of those she has been told of. So her NEWS is every upload of hers in the album whose
 * `let_in_at` is newer than its own row's mark, and telling her moves each row's mark up to the newest it told: a
 * reload, a return or her account's other device is told once, and an approval she watched arrive was told by the
 * read that visit made (her tracker reads her rows at mount, at each opening and at each arrival).
 *
 * ★ THE MARK ONLY EVER MOVES FORWARD, AND ONLY TO WHAT WAS TOLD: a row's new mark is the newest `let_in_at` this read
 * saw, never "now", so an approval that commits while a read is in flight (stamped with its own transaction's time)
 * is news to the next read rather than swallowed by this one's clock.
 *
 * Pure: the read and the write are `readOwnUploads`' (`db/mutations/guest-media.ts`); times are compared exactly
 * (`timestampToMicros`: a `Date` keeps milliseconds, and two decisions can share one).
 */
import { timestampToMicros } from "@/lib/events/album-wire";

/** One of her uploads as the news reads it. */
export type LetInRow = {
  id: string;
  /** Her guest row the upload rides on: each row keeps its own mark. */
  guestId: string;
  status: string;
  /** When a decision last let it in; null for one that went straight in (never news). */
  letInAt: string | null;
};

/** Each of her rows' marks: the newest `let_in_at` its guest has been told of, null for none yet. */
export type ToldMarks = ReadonlyMap<string, string | null>;

export type LetInNews = {
  /** Her uploads in the album that a decision let in since she was last told, newest let in first. */
  ids: string[];
  /** The mark each row with news takes: the newest `let_in_at` among its news, exactly as the server wrote it. */
  marks: Map<string, string>;
};

/** A timestamp as microseconds, or null where it is none (or not one: a malformed time is never news). */
function micros(value: string | null | undefined): number | null {
  if (!value) return null;
  try {
    return timestampToMicros(value);
  } catch {
    return null;
  }
}

export function letInNews(
  rows: readonly LetInRow[],
  told: ToldMarks,
): LetInNews {
  const news: { id: string; at: number }[] = [];
  const marks = new Map<string, { raw: string; at: number }>();
  for (const row of rows) {
    if (row.status !== "approved") continue;
    const at = micros(row.letInAt);
    if (at === null) continue;
    const mark = micros(told.get(row.guestId));
    if (mark !== null && at <= mark) continue;
    news.push({ id: row.id, at });
    const held = marks.get(row.guestId);
    if (!held || at > held.at) {
      marks.set(row.guestId, { raw: row.letInAt as string, at });
    }
  }
  news.sort((a, b) => b.at - a.at || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  return {
    ids: news.map((n) => n.id),
    marks: new Map([...marks].map(([guestId, m]) => [guestId, m.raw])),
  };
}
