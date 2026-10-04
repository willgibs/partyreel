/**
 * THE PURGE CRON'S TEST WORLD: the clamping PostgREST fake (`src/lib/db/testing/fake-postgrest.ts`)
 * plus the SQL functions the sweeps call, written over the fake's own tables so a test's fixture is
 * the only source of truth. Test support only: nothing under `src/app` or `src/components` imports it.
 *
 *  - `purge_media_rows(p_media_ids)`: deletes the rows among its input nothing keeps (`kept_media_ids`
 *    below) and answers one row per host with the meter bytes freed, zero for a row already released (an
 *    operator's removal or an asked row: 20260929140000's shape); every call's input size is recorded, so a
 *    test pins "never more than MAX_ROWS ids a call".
 *  - `kept_media_ids(p_media_ids)`: the input ids held, or named by an open report (its item, or any item of
 *    an album an open album report names), as ONE uuid[] (20260929140000), recorded in `keptCalls`.
 *  - `defer_kept_due_media()`: marks asked every removal past its `purge_at` that something keeps (never an
 *    operator's removal), answering how many (a scalar).
 *  - `held_event_ids(p_event_ids)`: the input events the purge must keep whole, as ONE uuid[]: a held
 *    item, an operator's removal whose `purge_at` is still ahead of the world's clock (20260928140000),
 *    or any open report on the event, an item's or the album's (20260929140000). The fake reads every array answer as a set of rows, so this one is
 *    answered by `withArrayRpc` instead, a thin wrapper that returns the array as `data` (as
 *    PostgREST returns a `uuid[]`).
 *  - `host_storage_summary(p_host_id)`: one row, the active bytes, her Deleted exactly as her two Deleted lists show
 *    it (`host_deleted_media`, 20261003220000: her removals and a deleted event's media, each inside its 30 days by
 *    the world's clock, never a withdrawal, an operator's removal or an asked row) and the system's part of it.
 *  - `leave_deleted(p_host_id, p_bytes, p_system, p_limit)`: her Deleted, oldest first (a deleted event's items,
 *    which entered together, largest first), each asked until `p_bytes` have left (all of it when null) or `p_limit`
 *    items have, the system's removals only with `p_system`; an event it empties leaves its window; answers one row of
 *    its OUT parameters, `{items, freed_bytes, more}` (20261003220000).
 *
 * The world's clock (`now`, the real one by default) is the SQL's `now()`: a test that moves an
 * operator's removal past its window passes the instant it runs the sweeps at.
 *
 * A media fixture row carries `event_id` AND an `events` embed that IS the event's own row object, so
 * a soft-delete written to the events table shows through every media embed, as a join would.
 */

/** The window every Deleted list and every removal's `purge_at` share (RECENTLY_DELETED_WINDOW_DAYS). */
const WINDOW_MS = 30 * 86_400_000;
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

/** What the fake world records beside its requests: R2 deletes and purges, in the order they ran. */
export type CronLogEntry =
  | { kind: "r2"; keys: string[] }
  | { kind: "purge"; ids: string[] };

export type CronWorld = {
  fake: FakePostgrest;
  /** The fake, typed as the client, with the array-answer functions wired in. */
  client: ReturnType<typeof asSupabase>;
  /** R2 deletes (pushed by the test's R2 mock through `recordR2`) and purges, in order. */
  log: CronLogEntry[];
  /** Every `purge_media_rows` call's input size. */
  purgeCallSizes: number[];
  /** Every `held_event_ids` call's input. */
  heldCalls: string[][];
  /** Every `kept_media_ids` call's input. */
  keptCalls: string[][];
  recordR2(keys: readonly string[]): void;
};

type Tables = Record<string, FakeRow[]>;

function eventsById(tables: Tables): Map<string, FakeRow> {
  return new Map((tables.events ?? []).map((e) => [String(e.id), e]));
}

/** Build the fake world over these tables (they are the fake's live tables: seed, then inspect). */
export function createCronWorld(
  tables: Tables,
  opts: { now?: Date } = {},
): CronWorld {
  tables.media ??= [];
  tables.events ??= [];
  tables.reports ??= [];
  const nowMs = () => (opts.now ?? new Date()).getTime();
  const at = (value: unknown) =>
    value == null ? Number.NaN : Date.parse(String(value));
  const log: CronLogEntry[] = [];
  const purgeCallSizes: number[] = [];
  const heldCalls: string[][] = [];
  const keptCalls: string[][] = [];

  /** The rule kept_media_ids holds: a hold, or an open report naming the item or its whole album. */
  const isKept = (m: FakeRow) =>
    m.legal_hold_at != null ||
    tables.reports.some(
      (r) =>
        r.status === "open" &&
        (r.media_id === m.id ||
          (r.media_id == null && r.event_id === m.event_id)),
    );
  /**
   * Her Deleted, item by item, as `host_deleted_media` answers it (20261003220000): her removals inside their 30 days
   * in an event still standing or still inside its own, and a deleted event's live media inside the event's 30 days;
   * never a withdrawal, an operator's removal or an asked row. `binnedAt` is when each entered Deleted.
   */
  const deletedMedia = (hostId: string) => {
    const events = eventsById(tables);
    const windowStart = nowMs() - WINDOW_MS;
    const out: {
      row: FakeRow;
      bytes: number;
      binnedAt: number;
      bySystem: boolean;
    }[] = [];
    for (const m of tables.media) {
      const e = events.get(String(m.event_id));
      if (!e || e.host_id !== hostId) continue;
      // Inside is from the window's start on (`>=`), as both lists and the SQL read it.
      const eventInWindow =
        e.deleted_at == null || at(e.deleted_at) >= windowStart;
      const removedArm =
        m.status === "removed" &&
        !m.removed_by_uploader &&
        !m.removed_by_admin &&
        m.purge_asked_at == null &&
        at(m.removed_at) >= windowStart &&
        eventInWindow;
      const deletedEventArm =
        m.status !== "removed" &&
        e.deleted_at != null &&
        at(e.deleted_at) >= windowStart;
      if (!removedArm && !deletedEventArm) continue;
      const removed = at(m.removed_at);
      const deleted = at(e.deleted_at);
      out.push({
        row: m,
        bytes: Number(m.file_size_bytes),
        binnedAt: Math.min(
          Number.isNaN(removed) ? Infinity : removed,
          Number.isNaN(deleted) ? Infinity : deleted,
        ),
        // A removed row's own flag alone: a live row in a deleted event is hers, whatever a stale flag says.
        bySystem: m.status === "removed" && Boolean(m.removed_by_system),
      });
    }
    return out;
  };
  /** Released: its bytes already left the host's meter (media_release_meter). */
  const isReleased = (m: FakeRow) =>
    Boolean(m.removed_by_admin) || m.purge_asked_at != null;

  const fake = createFakePostgrest({
    tables,
    rpc: {
      purge_media_rows: (args) => {
        const ids = new Set((args.p_media_ids as string[]) ?? []);
        purgeCallSizes.push(ids.size);
        log.push({ kind: "purge", ids: [...ids] });
        const events = eventsById(tables);
        const freed = new Map<string, number>();
        const kept: FakeRow[] = [];
        for (const m of tables.media) {
          if (ids.has(String(m.id)) && !isKept(m)) {
            const host = String(events.get(String(m.event_id))?.host_id);
            const bytes = isReleased(m) ? 0 : Number(m.file_size_bytes);
            freed.set(host, (freed.get(host) ?? 0) + bytes);
          } else {
            kept.push(m);
          }
        }
        tables.media.splice(0, tables.media.length, ...kept);
        return [...freed].map(([host_id, freed_bytes]) => ({
          host_id,
          freed_bytes,
        }));
      },
      host_storage_summary: (args) => {
        const events = eventsById(tables);
        let active = 0;
        for (const m of tables.media) {
          const e = events.get(String(m.event_id));
          if (!e || e.host_id !== args.p_host_id) continue;
          if (m.status !== "removed" && e.deleted_at == null) {
            active += Number(m.file_size_bytes);
          }
        }
        const deleted = deletedMedia(String(args.p_host_id));
        return [
          {
            active_bytes: active,
            standby_bytes: deleted.reduce((sum, d) => sum + d.bytes, 0),
            system_bytes: deleted
              .filter((d) => d.bySystem)
              .reduce((sum, d) => sum + d.bytes, 0),
          },
        ];
      },
      leave_deleted: (args) => {
        const host = String(args.p_host_id);
        const want = args.p_bytes == null ? null : Number(args.p_bytes);
        const limit = args.p_limit == null ? null : Number(args.p_limit);
        const system = Boolean(args.p_system);
        if ((want !== null && want <= 0) || (limit !== null && limit <= 0)) {
          return { items: 0, freed_bytes: 0, more: false };
        }
        const stamp = new Date(nowMs()).toISOString();
        const queue = deletedMedia(host)
          .filter((d) => system || !d.bySystem)
          .sort(
            (a, b) =>
              a.binnedAt - b.binnedAt ||
              b.bytes - a.bytes ||
              (String(a.row.id) < String(b.row.id) ? -1 : 1),
          );
        let items = 0;
        let freed = 0;
        const touched = new Set<string>();
        for (const d of queue) {
          if (d.row.status !== "removed") {
            d.row.status = "removed";
            d.row.removed_at = stamp;
            touched.add(String(d.row.event_id));
          }
          d.row.purge_asked_at = stamp;
          items += 1;
          freed += d.bytes;
          if (want !== null && freed >= want) break;
          if (limit !== null && items >= limit) break;
        }
        // Stopped at the limit with Deleted still holding what this call could take.
        const more =
          limit !== null &&
          items >= limit &&
          deletedMedia(host).some((d) => system || !d.bySystem);
        // An event it emptied leaves its window with its last item: a minute past the window's start, as the SQL
        // moves it.
        const left = new Set(
          deletedMedia(host).map((d) => String(d.row.event_id)),
        );
        for (const id of touched) {
          const e = eventsById(tables).get(id);
          if (e && !left.has(id)) {
            e.deleted_at = new Date(nowMs() - WINDOW_MS - 60_000).toISOString();
          }
        }
        return { items, freed_bytes: freed, more };
      },
      defer_kept_due_media: () => {
        let marked = 0;
        for (const m of tables.media) {
          if (
            m.status === "removed" &&
            m.purge_asked_at == null &&
            !m.removed_by_admin &&
            m.purge_at != null &&
            at(m.purge_at) <= nowMs() &&
            isKept(m)
          ) {
            m.purge_asked_at = new Date(nowMs()).toISOString();
            marked += 1;
          }
        }
        return marked;
      },
    },
  });

  const client = asSupabase(
    withArrayRpc(fake, {
      held_event_ids: (args) => {
        const ids = [...new Set((args.p_event_ids as string[]) ?? [])];
        heldCalls.push(ids);
        const wanted = new Set(ids);
        const held = new Set<string>();
        for (const m of tables.media) {
          if (!wanted.has(String(m.event_id))) continue;
          const takedownInWindow =
            m.status === "removed" &&
            Boolean(m.removed_by_admin) &&
            at(m.purge_at) > nowMs();
          if (m.legal_hold_at != null || takedownInWindow) {
            held.add(String(m.event_id));
          }
        }
        for (const r of tables.reports) {
          if (r.status === "open" && wanted.has(String(r.event_id))) {
            held.add(String(r.event_id));
          }
        }
        return [...held].sort();
      },
      kept_media_ids: (args) => {
        const ids = [...new Set((args.p_media_ids as string[]) ?? [])];
        keptCalls.push(ids);
        const wanted = new Set(ids);
        return tables.media
          .filter((m) => wanted.has(String(m.id)) && isKept(m))
          .map((m) => String(m.id))
          .sort();
      },
    }),
  );

  return {
    fake,
    client,
    log,
    purgeCallSizes,
    heldCalls,
    keptCalls,
    recordR2: (keys) => log.push({ kind: "r2", keys: [...keys] }),
  };
}

/**
 * Answer the named functions with their array as `data`, the way PostgREST answers a function that
 * returns `uuid[]` (the fake would read an array as a set of rows). Each call is recorded in the
 * fake's `requests` like any other, its arguments in the POST body.
 */
export function withArrayRpc(
  fake: FakePostgrest,
  handlers: Record<string, (args: Record<string, unknown>) => unknown[]>,
): FakePostgrest {
  return new Proxy(fake, {
    get(target, prop, receiver) {
      if (prop !== "rpc") return Reflect.get(target, prop, receiver);
      return (
        fn: string,
        args: Record<string, unknown> = {},
        options?: { head?: boolean; get?: boolean; count?: string },
      ) => {
        const handler = handlers[fn];
        if (!handler) return target.rpc(fn, args, options);
        const url = `https://ddafaemglzmuekbtjwzn.supabase.co/rest/v1/rpc/${fn}`;
        const data = handler(args);
        target.requests.push({
          target: "rpc",
          name: fn,
          method: "POST",
          filters: [],
          limit: null,
          offset: null,
          url,
          urlLength: url.length,
          failed: false,
          returned: 0,
        });
        const response = {
          data,
          error: null,
          count: null,
          status: 200,
          statusText: "OK",
        };
        return {
          then: <A, B>(
            onfulfilled?: ((value: typeof response) => A) | null,
            onrejected?: ((reason: unknown) => B) | null,
          ) => Promise.resolve(response).then(onfulfilled, onrejected),
        };
      };
    },
  });
}

/* ─────────────────────────────── fixtures ─────────────────────────────── */

/**
 * A real uuid (hex only, so the R2 key parser accepts it and a URL measures as it would live), sorting
 * by `prefix` then `n`: the prefix (up to four ASCII characters) becomes its char codes in hex, which
 * keeps its order.
 */
export function uuidOf(prefix: string, n: number): string {
  const head = [...prefix.slice(0, 4)]
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
    .padEnd(8, "0");
  return `${head}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** A raw Postgres timestamp string, `seconds` after a fixed instant (one format for every fixture). */
export function stamp(seconds: number): string {
  const d = new Date(Date.UTC(2026, 7, 1, 0, 0, 0) + seconds * 1000);
  return d.toISOString().replace("Z", "000+00:00");
}

/** An event row. */
export function eventRow(
  id: string,
  hostId: string,
  over: Partial<FakeRow> = {},
): FakeRow {
  return {
    id,
    host_id: hostId,
    deleted_at: null,
    purge_at: null,
    ...over,
  };
}

/**
 * A media row of `event` (its embed IS the event row), live and unheld unless told otherwise. A photograph
 * carries all three stored copies (take-home r1: the original, the tile's preview and the phone-size copy),
 * so a sweep that forgets one leaves its key out of the R2 log and the tests that read the log fail.
 */
export function mediaRow(
  id: string,
  event: FakeRow,
  over: Partial<FakeRow> = {},
): FakeRow {
  return {
    id,
    event_id: event.id,
    events: event,
    status: "approved",
    file_size_bytes: 1000,
    original_key: `events/${String(event.id)}/photo/${id}/original.jpg`,
    preview_key: `events/${String(event.id)}/photo/${id}/preview.webp`,
    phone_key: `events/${String(event.id)}/photo/${id}/phone.jpg`,
    removed_at: null,
    purge_at: null,
    removed_by_system: false,
    removed_by_uploader: false,
    removed_by_admin: false,
    purge_asked_at: null,
    legal_hold_at: null,
    created_at: stamp(0),
    ...over,
  };
}

/** Every request stayed under the URL limit, and none failed. */
export function everyRequestFits(fake: FakePostgrest): boolean {
  return fake.requests.every((r) => !r.failed && r.urlLength <= 8000);
}
