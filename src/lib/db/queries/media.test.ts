/**
 * A GUEST'S OWN DELETE IS GONE EVERYWHERE FOR THE HOST (delete-final, Will 2026-09-23: "if a guest
 * deletes their own uploads, it should not be recoverable by the host ... I want it gone
 * everywhere, not still visible to the host as well").
 *
 * A withdrawal is a removed row marked `removed_by_uploader` (remove_my_upload's guest arm,
 * remove_my_upload_by_session, disown_guest_rows_by_email). These pins run each host read that
 * lists media against ONE fixture holding two withdrawals beside a live album and a host's own
 * removal, through a small in-memory stand-in for the PostgREST builder that applies the filters a
 * read actually sends. So what is pinned is the answer (the withdrawal never comes back), whatever
 * shape of filter gets it there. Withdrawn rows are built to be the easiest to leak: one is the
 * NEWEST upload in the event (a read that forgot the rule would put it first), the other is the
 * bin's SOONEST purge (a nudge that forgot it would fire on it).
 *
 * Pinned elsewhere, not repeated here: restore_media's refusal (forensics/migration-guards.test.ts),
 * the reel's membership (reel.test.ts), the guest count and the Guests room (the approved-only read
 * in social.guest-identity.test.ts), the zip's manifest (export/build-manifest.test.ts), the
 * storage meter's Deleted figure (billing/storage-summary.test.ts), and the dashboard's pulse and
 * event cards (queries/pulse.test.ts and queries/events.test.ts, where the counts and covers are SQL).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Answer = {
  data: unknown;
  error: { code: string; message: string } | null;
  count?: number | null;
};

/**
 * The PostgREST builder, in memory: each filter a read sends is APPLIED to the fixture rows, so a
 * read is judged on what it returns. Only the operators the pinned reads use exist; anything else
 * throws, so a read that grows a new operator fails loudly here instead of passing by accident.
 */
class FakeQuery implements PromiseLike<Answer> {
  private rows: Row[];
  private mode: "many" | "single" | "maybe" = "many";
  private headOnly = false;
  private counted = false;

  constructor(rows: readonly Row[]) {
    this.rows = [...rows];
  }

  select(_columns?: string, options?: { count?: string; head?: boolean }) {
    this.headOnly = options?.head === true;
    this.counted = options?.count != null;
    return this;
  }
  eq(column: string, value: unknown) {
    this.rows = this.rows.filter((r) => r[column] === value);
    return this;
  }
  // SQL's `<>`: a null never matches, whatever it is compared with.
  neq(column: string, value: unknown) {
    this.rows = this.rows.filter((r) => r[column] != null && r[column] !== value);
    return this;
  }
  is(column: string, value: null | boolean) {
    this.rows = this.rows.filter((r) =>
      value === null ? r[column] == null : r[column] === value,
    );
    return this;
  }
  not(column: string, operator: string, value: unknown) {
    if (operator !== "is" || value !== null) {
      throw new Error(`FakeQuery: not(${column}, ${operator}) is not modelled`);
    }
    this.rows = this.rows.filter((r) => r[column] != null);
    return this;
  }
  in(column: string, values: readonly unknown[]) {
    this.rows = this.rows.filter((r) => values.includes(r[column]));
    return this;
  }
  gte(column: string, value: string) {
    this.rows = this.rows.filter(
      (r) => r[column] != null && String(r[column]) >= value,
    );
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? -1 : 1;
    this.rows = [...this.rows].sort((a, b) => {
      const x = a[column] as string | number | null | undefined;
      const y = b[column] as string | number | null | undefined;
      if (x === y) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x < y ? -1 : 1) * direction;
    });
    return this;
  }
  limit(n: number) {
    this.rows = this.rows.slice(0, n);
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }

  private answer(): Answer {
    if (this.mode === "many") {
      return {
        data: this.headOnly ? null : this.rows,
        error: null,
        count: this.counted ? this.rows.length : null,
      };
    }
    if (this.rows.length > 1 || (this.mode === "single" && this.rows.length === 0)) {
      return {
        data: null,
        error: { code: "PGRST116", message: `${this.rows.length} rows` },
      };
    }
    return { data: this.rows[0] ?? null, error: null };
  }

  then<A = Answer, B = never>(
    onFulfilled?: ((value: Answer) => A | PromiseLike<A>) | null,
    onRejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve(this.answer()).then(onFulfilled, onRejected);
  }
}

let tables: Record<string, Row[]> = {};
const fakeClient = {
  from: (table: string) => new FakeQuery(tables[table] ?? []),
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: fakeClient, user: { id: "host-1" } }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => fakeClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeClient }));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
  headObject: async () => null,
  presignUpload: async () => ({}),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({ allowed: true }),
  recordAbuseEvent: async () => {},
}));

const { listEventMedia, listRecentlyDeletedMedia } = await import(
  "@/lib/db/queries/media"
);
const { getNotificationData } = await import("@/lib/db/queries/notifications");
const { resolveReelRenderContext } = await import("@/lib/reel/render-service");

const NOW = Date.parse("2026-09-23T12:00:00.000Z");
const MINUTE = 60_000;
const DAY = 86_400_000;
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function media(id: string, fields: Row): Row {
  return {
    id,
    event_id: "ev-1",
    guest_id: "g-1",
    type: "photo",
    original_key: `events/ev-1/photo/${id}/original.jpg`,
    preview_key: null,
    file_size_bytes: 1000,
    status: "approved",
    removed_at: null,
    purge_at: null,
    removed_by_uploader: false,
    ...fields,
  };
}

const LIVE = media("m-live", { created_at: at(-120 * MINUTE) });
const PENDING = media("m-pending", { status: "pending", created_at: at(-90 * MINUTE) });
const HIDDEN = media("m-hidden", { status: "hidden", created_at: at(-180 * MINUTE) });
const HOST_REMOVED = media("m-host-removed", {
  status: "removed",
  created_at: at(-5 * DAY),
  removed_at: at(-2 * DAY),
  purge_at: at(28 * DAY),
});
/** A pending upload its guest deleted ten minutes ago: the NEWEST upload in the event. */
const WITHDRAWN_NEW = media("m-withdrawn-new", {
  status: "removed",
  created_at: at(-20 * MINUTE),
  removed_at: at(-10 * MINUTE),
  purge_at: at(30 * DAY - 10 * MINUTE),
  removed_by_uploader: true,
});
/** A withdrawal from weeks ago: the SOONEST purge anywhere in the host's bin. */
const WITHDRAWN_OLD = media("m-withdrawn-old", {
  status: "removed",
  created_at: at(-26 * DAY),
  removed_at: at(-25 * DAY),
  purge_at: at(5 * DAY),
  removed_by_uploader: true,
});

const ids = (rows: readonly { id: string }[]) => rows.map((r) => r.id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  tables = {
    media: [LIVE, PENDING, HIDDEN, HOST_REMOVED, WITHDRAWN_NEW, WITHDRAWN_OLD],
    events: [{ id: "ev-1", host_id: "host-1", name: "Garden party", deleted_at: null, purge_at: null }],
    profiles: [
      {
        id: "host-1",
        tier: "pro",
        tier_expires_at: null,
        storage_grace_until: null,
        announcements_seen_at: null,
      },
    ],
    announcements: [],
    highlight_reels: [],
    reel_items: [
      { event_id: "ev-1", media_id: "m-withdrawn-new", position: 0, added_at: at(-15 * MINUTE) },
      { event_id: "ev-1", media_id: "m-live", position: 1, added_at: at(-100 * MINUTE) },
    ],
  };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("a guest's own withdrawal never reaches a host read", () => {
  it("★ the live album (the grid, the viewer, Review's queue, Download all) never returns it", async () => {
    const album = await listEventMedia("ev-1");
    expect(ids(album)).toEqual(["m-pending", "m-live", "m-hidden"]);
    // Review is this read's pending subset: a pending upload its guest deleted has left the queue.
    expect(ids(album.filter((m) => m.status === "pending"))).toEqual(["m-pending"]);
  });

  it("★ Deleted lists the host's own removal and never a withdrawal", async () => {
    const bin = await listRecentlyDeletedMedia("ev-1");
    expect(ids(bin)).toEqual(["m-host-removed"]);
    expect(bin[0].countdownDays).toBe(28);
  });

  it("the reel's timeline, which the guest payload's items are, drops a withdrawn moment", async () => {
    // The admin arm (a password event's guest payload, the host's own render) reads it in TS...
    const ctx = await resolveReelRenderContext(fakeClient as never, "ev-1");
    expect(ctx?.orderedApprovedIds).toEqual(["m-live"]);
    // ...and the open event's anon RPC in SQL: its items join media on approved alone.
    const dir = join(process.cwd(), "supabase", "migrations");
    const newest = readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .filter((sql) => /function public\.get_event_reel_by_qr_token\s*\(/i.test(sql))
      .at(-1);
    expect(newest, "no migration defines get_event_reel_by_qr_token").toBeDefined();
    const body = (newest as string).replace(/\s+/g, " ");
    expect(body).toContain(
      "join public.media m on m.id = r.media_id and m.status = 'approved'",
    );
  });

  /*
   * The bell's "Items in Deleted are about to be cleared" nudge reads the SOONEST purge among the host's
   * removed media and skips a guest's withdrawal (`.eq("removed_by_uploader", false)` in
   * src/lib/db/queries/notifications.ts), so a withdrawal never points the host at a Deleted that does
   * not show it.
   */
  it("the bell's about-to-be-cleared nudge never counts it", async () => {
    const signals = await getNotificationData();
    expect(signals.recoverySoonestPurgeAt).toBe(HOST_REMOVED.purge_at);
  });
});
