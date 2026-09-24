/**
 * THE HUB'S LIVE POLL, PAST 1,000 ITEMS (C6, the 1,000-row round, 2026-09-23).
 *
 * The poll hashed every visible item's id and status out of ONE list read, which PostgREST ends at
 * 1,000 rows: past that, the album's oldest photographs could be hidden, restored or removed and
 * the validator never moved, so the host's page never refreshed. It now hashes two head counts and
 * the newest `updated_at` (host-fingerprint.ts says why those three). These pins run the route on
 * the clamping fake (`src/lib/db/testing/fake-postgrest.ts`), where a list read would be cut exactly
 * as it is live, and drive each change the validator must see, with the `media_set_updated_at`
 * trigger's effect applied by hand (every write to a row stamps its `updated_at`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));
vi.mock("@/lib/db/queries/events", () => ({
  // RLS-scoped in the app: a foreign, missing or deleted event resolves to null.
  getEvent: async (id: string) => (id === "ev-1" ? { id: "ev-1" } : null),
}));

const { GET } = await import("./route");

const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
/** Seconds after noon as Postgres writes a timestamp. */
const at = (second: number) =>
  `2026-09-23T${String(12 + Math.floor(second / 3600)).padStart(2, "0")}:${String(Math.floor(second / 60) % 60).padStart(2, "0")}:${String(second % 60).padStart(2, "0")}.000000+00:00`;

/** 2,000 approved, 200 hidden, 250 pending and 50 in the bin, each last written when it arrived. */
function album(): FakeRow[] {
  const statusOf = (i: number) =>
    i < 2000
      ? "approved"
      : i < 2200
        ? "hidden"
        : i < 2450
          ? "pending"
          : "removed";
  return Array.from({ length: 2500 }, (_, i) => ({
    id: uuid(i),
    event_id: "ev-1",
    status: statusOf(i),
    created_at: at(i),
    updated_at: at(i),
  }));
}

/** The media_set_updated_at trigger's effect: a write stamps the row's updated_at. */
function write(row: FakeRow, fields: FakeRow, second: number) {
  Object.assign(row, fields, { updated_at: at(second) });
}

async function poll(etag?: string) {
  const res = await GET(
    new Request("https://partyreel.test/api/events/ev-1/live", {
      headers: etag ? { "if-none-match": etag } : {},
    }),
    { params: Promise.resolve({ eventId: "ev-1" }) },
  );
  return {
    status: res.status,
    etag: res.headers.get("etag") ?? "",
    body: res.status === 200 ? await res.json() : null,
  };
}

beforeEach(() => {
  fake = createFakePostgrest({
    user: { id: "host-1" },
    tables: { media: album() },
  });
});

describe("the live poll", () => {
  it("answers exact counts for a 2,450-item album, reading no list", async () => {
    const first = await poll();
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ ok: true, pending: 250, count: 2200 });
    expect(first.etag.startsWith('"h2-')).toBe(true);
    // Two head counts and one row: nothing here can be cut at 1,000.
    expect(fake.requests.map((r) => r.method).sort()).toEqual([
      "GET",
      "HEAD",
      "HEAD",
    ]);
    expect(
      Math.max(...fake.requests.map((r) => r.returned)),
    ).toBeLessThanOrEqual(1);
  });

  it("answers 304 when nothing moved", async () => {
    const { etag } = await poll();
    expect((await poll(etag)).status).toBe(304);
  });

  it("moves when one of the oldest photographs is hidden from a second tab", async () => {
    const { etag } = await poll();
    // The album's OLDEST photograph, far outside the newest 1,000 a list read would have seen.
    write(fake.tables.media[0], { status: "hidden" }, 9000);
    const next = await poll(etag);
    expect(next.status).toBe(200);
    expect(next.body).toMatchObject({ pending: 250, count: 2200 });
    expect(next.etag).not.toBe(etag);
  });

  it("moves when a held upload lands in Review", async () => {
    const { etag } = await poll();
    fake.tables.media.push({
      id: uuid(9999),
      event_id: "ev-1",
      status: "pending",
      created_at: at(9001),
      updated_at: at(9001),
    });
    const next = await poll(etag);
    expect(next.body).toMatchObject({ pending: 251 });
    expect(next.etag).not.toBe(etag);
  });

  it("moves when an arrival and a removal cancel in the counts", async () => {
    const { etag } = await poll();
    write(fake.tables.media[5], { status: "removed" }, 9002);
    fake.tables.media.push({
      id: uuid(9998),
      event_id: "ev-1",
      status: "approved",
      created_at: at(9003),
      updated_at: at(9003),
    });
    const next = await poll(etag);
    expect(next.body).toMatchObject({ count: 2200 });
    expect(next.etag).not.toBe(etag);
  });

  it("stays put when only the bin is written to", async () => {
    // The bin loads on demand, never with the page, so a write there has nothing to refresh.
    const { etag } = await poll();
    write(fake.tables.media[2499], { purge_at: at(9999) }, 9004);
    expect((await poll(etag)).status).toBe(304);
  });

  it("refuses a caller with no session and answers a foreign event as missing", async () => {
    fake.user = null;
    expect((await poll()).status).toBe(401);
    fake.user = { id: "host-1" };
    const res = await GET(new Request("https://partyreel.test/x"), {
      params: Promise.resolve({ eventId: "ev-2" }),
    });
    expect(res.status).toBe(404);
  });
});
