/**
 * THE REPORT QUEUE: THE NEWEST FEW, SAID; THE LOOKUPS CHUNKED; THE PRESIGNS AT ONCE (the 1,000-row
 * round, Will 2026-09-23: "Let's ensure we will not face any of those issues here").
 *
 * The queue read every report and ended silently at the thousandth, its event and media lookups put
 * every id in one URL, and it presigned the reported media one after another. Against
 * `fake-postgrest` (every read clamped at 1,000, a URL past 8,000 characters failed), with 2,500
 * reports: a queue reads exactly its depth and knows whether there is more, any depth is exact past
 * 1,000, every lookup chunk stays under the URL limit and every report keeps its event and media,
 * the presigns run concurrently, and "oldest waiting" is one row, oldest first, across both arms.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

let inFlight = 0;
let maxInFlight = 0;
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 0));
    inFlight -= 1;
    return `signed:${key}`;
  },
}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const {
  countOpenReports,
  listProfileReports,
  listReports,
  oldestOpenReportAt,
} = await import("@/lib/db/queries/reports");

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (secondsAgo: number) =>
  new Date(Date.parse("2026-09-23T12:00:00.000Z") - secondsAgo * 1000)
    .toISOString()
    .replace("Z", "000+00:00");

/** 2,500 album reports, each on its own event and item, two in three open, ties every four. */
function albumReports(n = 2500): FakeRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: uuid("r", i),
    reason: `reason ${i}`,
    created_at: at(100 + Math.floor(i / 4)),
    status: i % 3 === 2 ? "actioned" : "open",
    resolved_at: null,
    event_id: uuid("e", i),
    media_id: uuid("m", i),
    profile_id: null,
  }));
}

function world(reports: FakeRow[]): FakePostgrest {
  const n = reports.length;
  return createFakePostgrest({
    tables: {
      reports,
      events: Array.from({ length: n }, (_, i) => ({ id: uuid("e", i), name: `Event ${i}` })),
      media: Array.from({ length: n }, (_, i) => ({
        id: uuid("m", i),
        type: "photo",
        original_key: `key-${i}`,
      })),
      profiles: Array.from({ length: n }, (_, i) => ({
        id: uuid("p", i),
        display_name: `Person ${i}`,
        slug: `person-${i}`,
      })),
    },
  });
}

beforeEach(() => {
  inFlight = 0;
  maxInFlight = 0;
});

describe("listReports: the album arm", () => {
  it("★ reads exactly its depth, newest first, and knows there is more", async () => {
    fake = world(albumReports());
    const { reports, more } = await listReports("open", 50);

    expect(reports).toHaveLength(50);
    expect(more).toBe(true);
    expect(reports.every((r) => r.status === "open")).toBe(true);
    const stamps = reports.map((r) => r.created_at);
    expect([...stamps].sort().reverse()).toEqual(stamps);
    // The newest tie breaks on the id, downward: report 3 leads its group of four.
    expect(reports[0]).toMatchObject({
      id: uuid("r", 3),
      event: { id: uuid("e", 3), name: "Event 3" },
      media: { id: uuid("m", 3), type: "photo", url: "signed:key-3" },
    });
  });

  it("★ any depth is exact past 1,000, and every lookup chunk stays under the URL limit", async () => {
    fake = world(albumReports());
    const { reports, more } = await listReports("all", 2000);

    expect(reports).toHaveLength(2000);
    expect(more).toBe(true);
    expect(reports.every((r) => r.event !== null && r.media !== null)).toBe(true);
    for (const table of ["events", "media"]) {
      const lookups = fake.requests.filter((r) => r.name === table);
      expect(lookups.length).toBeGreaterThanOrEqual(14);
      for (const lookup of lookups) {
        expect(lookup.failed).toBe(false);
        expect(lookup.urlLength).toBeLessThan(8000);
      }
    }
    // The presigns overlapped rather than waiting on one another.
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it("offers no more when the queue holds exactly its depth", async () => {
    fake = world(albumReports(50));
    const { reports, more } = await listReports("all", 50);
    expect(reports).toHaveLength(50);
    expect(more).toBe(false);
  });

  it("an empty queue reads no lookups at all", async () => {
    fake = world([]);
    await expect(listReports("open", 50)).resolves.toEqual({
      reports: [],
      more: false,
    });
    expect(fake.requests).toHaveLength(1);
  });
});

describe("listProfileReports: the people arm", () => {
  it("★ reads 1,200 person reports and hydrates every profile, chunked", async () => {
    const people: FakeRow[] = Array.from({ length: 2500 }, (_, i) => ({
      id: uuid("q", i),
      reason: null,
      created_at: at(10 + i),
      status: "open",
      resolved_at: null,
      event_id: null,
      media_id: null,
      profile_id: uuid("p", i),
    }));
    fake = world(people);

    const { reports, more } = await listProfileReports("open", 1200);

    expect(reports).toHaveLength(1200);
    expect(more).toBe(true);
    expect(reports.every((r) => r.profile !== null)).toBe(true);
    expect(reports[0].profile).toEqual({
      id: uuid("p", 0),
      displayName: "Person 0",
      slug: "person-0",
    });
    for (const lookup of fake.requests.filter((r) => r.name === "profiles")) {
      expect(lookup.urlLength).toBeLessThan(8000);
    }
  });
});

describe("the queue's figures", () => {
  it("oldest open report is one row, oldest first, whichever arm it is in", async () => {
    const reports = albumReports(1500);
    reports.push({
      id: uuid("q", 1),
      reason: null,
      created_at: at(99_999),
      status: "open",
      resolved_at: null,
      event_id: null,
      media_id: null,
      profile_id: uuid("p", 1),
    });
    fake = world(reports);

    await expect(oldestOpenReportAt()).resolves.toBe(at(99_999));
    expect(fake.requests[0]).toMatchObject({ limit: 1, returned: 1 });
    await expect(countOpenReports()).resolves.toBe(1001);
  });

  it("no open report reads null", async () => {
    fake = world([]);
    await expect(oldestOpenReportAt()).resolves.toBeNull();
  });
});
