/**
 * THE PURGE CRON'S TEST WORLD: the clamping PostgREST fake (`src/lib/db/testing/fake-postgrest.ts`)
 * plus the SQL functions the sweeps call, written over the fake's own tables so a test's fixture is
 * the only source of truth. Test support only: nothing under `src/app` or `src/components` imports it.
 *
 *  - `purge_media_rows(p_media_ids)`: deletes the unheld rows among its input and answers one row per
 *    host with the bytes freed (20260729150000's shape); every call's input size is recorded, so a test
 *    pins "never more than MAX_ROWS ids a call".
 *  - `held_event_ids(p_event_ids)`: the input events holding ANY held media, as ONE uuid[]. The fake
 *    reads every array answer as a set of rows, so this one is answered by `withArrayRpc` instead, a
 *    thin wrapper that returns the array as `data` (as PostgREST returns a `uuid[]`).
 *  - `standby_hosts(p_after, p_limit)`: (host, bytes) over the standby predicate of
 *    20260924030000, keyset on host id, `least(p_limit, 1000)`; the fake clamps the answer at 1,000.
 *  - `host_storage_summary(p_host_id)`: one row, the active and restorable bytes (20260923160000).
 *
 * A media fixture row carries `event_id` AND an `events` embed that IS the event's own row object, so
 * a soft-delete written to the events table shows through every media embed, as a join would.
 */
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
  recordR2(keys: readonly string[]): void;
};

type Tables = Record<string, FakeRow[]>;

function eventsById(tables: Tables): Map<string, FakeRow> {
  return new Map((tables.events ?? []).map((e) => [String(e.id), e]));
}

/** Build the fake world over these tables (they are the fake's live tables: seed, then inspect). */
export function createCronWorld(tables: Tables): CronWorld {
  tables.media ??= [];
  tables.events ??= [];
  const log: CronLogEntry[] = [];
  const purgeCallSizes: number[] = [];
  const heldCalls: string[][] = [];

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
          if (ids.has(String(m.id)) && m.legal_hold_at == null) {
            const host = String(events.get(String(m.event_id))?.host_id);
            freed.set(host, (freed.get(host) ?? 0) + Number(m.file_size_bytes));
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
            !m.removed_by_uploader;
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
        let active = 0;
        let standby = 0;
        for (const m of tables.media) {
          const e = events.get(String(m.event_id));
          if (!e || e.host_id !== args.p_host_id) continue;
          const live = m.status !== "removed" && e.deleted_at == null;
          if (live) active += Number(m.file_size_bytes);
          else if (!(m.status === "removed" && m.removed_by_uploader)) {
            standby += Number(m.file_size_bytes);
          }
        }
        return [{ active_bytes: active, standby_bytes: standby }];
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
          if (wanted.has(String(m.event_id)) && m.legal_hold_at != null) {
            held.add(String(m.event_id));
          }
        }
        return [...held].sort();
      },
    }),
  );

  return {
    fake,
    client,
    log,
    purgeCallSizes,
    heldCalls,
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

/** A media row of `event` (its embed IS the event row), live and unheld unless told otherwise. */
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
    removed_at: null,
    purge_at: null,
    removed_by_system: false,
    removed_by_uploader: false,
    legal_hold_at: null,
    created_at: stamp(0),
    ...over,
  };
}

/** Every request stayed under the URL limit, and none failed. */
export function everyRequestFits(fake: FakePostgrest): boolean {
  return fake.requests.every((r) => !r.failed && r.urlLength <= 8000);
}
