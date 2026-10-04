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
 *  - `standby_hosts(p_after, p_limit)`: (host, bytes) over the standby predicate of
 *    20260929140000 (never a withdrawal, a system removal, an operator's removal or an asked row), keyset on host
 *    id, `least(p_limit, 1000)`; the fake clamps the answer at 1,000.
 *  - `host_storage_summary(p_host_id)`: one row, the active bytes and exactly what the host's two
 *    Deleted lists show, inside the 30-day window by the world's clock, never an asked row (20260929140000).
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
      standby_hosts: (args) => {
        const events = eventsById(tables);
        const sums = new Map<string, number>();
        for (const m of tables.media) {
          const e = events.get(String(m.event_id));
          if (!e || m.legal_hold_at != null) continue;
          const removedArm =
            m.status === "removed" &&
            !m.removed_by_system &&
            !m.removed_by_uploader &&
            !m.removed_by_admin &&
            m.purge_asked_at == null;
          const deletedEventArm =
            m.status !== "removed" && e.deleted_at != null;
          if (!removedArm && !deletedEventArm) continue;
          const host = String(e.host_id);
          sums.set(host, (sums.get(host) ?? 0) + Number(m.file_size_bytes));
        }
        let rows = [...sums]
          .filter(([, bytes]) => bytes > 0)
          .map(([host_id, standby_bytes]) => ({ host_id, standby_bytes }))
          .sort((a, b) =>
            a.host_id < b.host_id ? -1 : a.host_id > b.host_id ? 1 : 0,
          );
        const after = args.p_after as string | undefined;
        if (after) rows = rows.filter((r) => r.host_id > after);
        const limit = args.p_limit as number | undefined;
        if (limit !== undefined && limit !== null) {
          rows = rows.slice(0, Math.min(limit, 1000));
        }
        return rows;
      },
      host_storage_summary: (args) => {
        const events = eventsById(tables);
        const windowStart = nowMs() - WINDOW_MS;
        let active = 0;
        let standby = 0;
        for (const m of tables.media) {
          const e = events.get(String(m.event_id));
          if (!e || e.host_id !== args.p_host_id) continue;
          const bytes = Number(m.file_size_bytes);
          if (m.status !== "removed" && e.deleted_at == null) active += bytes;
          else if (
            m.status === "removed"
              ? !m.removed_by_uploader &&
                !m.removed_by_admin &&
                m.purge_asked_at == null &&
                at(m.removed_at) >= windowStart
              : at(e.deleted_at) >= windowStart
          ) {
            standby += bytes;
          }
        }
        return [{ active_bytes: active, standby_bytes: standby }];
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
