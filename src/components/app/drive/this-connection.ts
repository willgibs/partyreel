/**
 * WHICH OF HER SENDS BELONG TO THE CONNECTION SHE HAS NOW (crumbs-82; the Drive re-walk's finding). Partyreel knows
 * what is in her Drive only through the connection that put it there: a Disconnect, or another Google account's
 * connect, forgets every Google id the connection's sends held (`cloud_connection_forget`), and a connection after it
 * knows nothing of those files (it finds the Partyreel folder by mark, sends albums whole). So Your events' list, which
 * the database answers per connection, showed an earlier connection's albums with no state, while Account's Sent and the
 * dashboard's lights, which read every send she ever made, still said "In your Drive" for them.
 *
 * One rule makes the three agree: a send is this connection's when it was made after the connection's row was (a send
 * needs a connection to press, and a new connection is a new row: a same-account reconnect keeps its row and its
 * `created_at`, so its own sends stay, and another account's connect replaces it whole). The rest are history: still in
 * her Drive, and said once, quietly, on Account, but never lighting an album or counting as what this connection holds.
 *
 * Pure and node-safe, so the poll's store, the Account card and their tests share one reading of "this connection's".
 */
import {
  type SentRow,
  sentTotalsOf,
  type SentTotals,
} from "@/lib/drive/sent-totals";
import type { DriveStatus } from "@/lib/drive/status";

/**
 * Was this send made while the connection that began at `connectedAt` stood? Only an older send, both dates read, is
 * history: a date that cannot be read hides nothing (a send she can see is never lost to a malformed timestamp).
 */
export function madeOnThisConnection(
  madeAt: string,
  connectedAt: string,
): boolean {
  const made = Date.parse(madeAt);
  const since = Date.parse(connectedAt);
  return !(Number.isFinite(made) && Number.isFinite(since) && made < since);
}

/**
 * The poll's answer for the connection she has now: the sends of an earlier connection are dropped, so the album's
 * strip, its tile's light, What's using space's send line and the app-wide flag never speak of a send the connection
 * in hand knows nothing of. With no connection at all every send is an earlier one (a Disconnect ended what ran and
 * forgot the rest), so none stands.
 */
export function onThisConnection(status: DriveStatus): DriveStatus {
  const { connection } = status;
  return {
    ...status,
    sends: connection
      ? status.sends.filter((s) =>
          madeOnThisConnection(s.createdAt, connection.connectedAt),
        )
      : [],
  };
}

/** A send that ended having landed something, and when it was made (what Account's Sent folds). */
export type MadeSentRow = SentRow & { createdAt: string };

export type SentHistory = {
  /** What the connection she has now has sent: each file once (`sentTotalsOf`). */
  now: SentTotals;
  /** What the connections before it sent, said apart: still where it went, and no longer this connection's to say. */
  before: SentTotals;
};

/** Her ended sends, split at the start of the connection she has now, each side folded as Account says it. */
export function sentHistoryOf(
  rows: readonly MadeSentRow[],
  connectedAt: string,
): SentHistory {
  const now: SentRow[] = [];
  const before: SentRow[] = [];
  for (const r of rows)
    (madeOnThisConnection(r.createdAt, connectedAt) ? now : before).push(r);
  return { now: sentTotalsOf(now), before: sentTotalsOf(before) };
}
