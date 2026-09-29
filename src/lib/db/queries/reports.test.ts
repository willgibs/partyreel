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
      events: Array.from({ length: n }, (_, i) => ({
        id: uuid("e", i),
        name: `Event ${i}`,
      })),
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
    expect(reports.every((r) => r.event !== null && r.media !== null)).toBe(
      true,
    );
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

/**
 * WHAT EACH REPORT SAYS OF ITS ITEM NOW (admin-triage r1, 2026-09-28): the verdict's note, where the
 * item stands, whether it is held, and a closed line's way back, decided here from the item's own
 * row (`wayBackOf`) so its timestamps never reach the browser.
 */
describe("the verdict's record and the item's standing", () => {
  const T = "2026-09-28T20:00:00.123000+00:00";
  const T_JS = "2026-09-28T20:00:00.123Z";

  function verdictWorld(): FakePostgrest {
    const event = { id: uuid("e", 1), name: "Hannah and Theo" };
    const media = (i: number, over: FakeRow) => ({
      id: uuid("m", i),
      type: "photo",
      original_key: `key-${i}`,
      preview_key: i === 1 ? null : `preview-${i}`,
      status: "approved",
      removed_by_admin: false,
      removed_at: null,
      legal_hold_at: null,
      ...over,
    });
    const report = (i: number, over: FakeRow) => ({
      id: uuid("r", i),
      reason: null,
      created_at: at(i),
      status: "open",
      resolved_at: null,
      resolution_note: null,
      event_id: event.id,
      media_id: uuid("m", i),
      profile_id: null,
      ...over,
    });
    return createFakePostgrest({
      tables: {
        events: [event],
        media: [
          media(1, {}),
          // The verdict's own removal, stamped with the verdict's instant.
          media(2, {
            status: "removed",
            removed_by_admin: true,
            removed_at: T,
          }),
          // The host's removal that a verdict only made the operator's.
          media(3, {
            status: "removed",
            removed_by_admin: true,
            removed_at: "2026-09-20T08:00:00.000000+00:00",
          }),
          // Held after its takedown.
          media(4, {
            status: "removed",
            removed_by_admin: true,
            removed_at: T,
            legal_hold_at: T,
          }),
          // Up, and removed by the host herself.
          media(5, { status: "removed", removed_at: T }),
        ],
        reports: [
          report(1, { reason: "wrong event" }),
          report(2, {
            status: "actioned",
            resolved_at: T_JS,
            resolution_note: "Card number legible in the frame.",
          }),
          report(3, { status: "actioned", resolved_at: T_JS }),
          report(4, { status: "actioned", resolved_at: T_JS }),
          report(5, { status: "dismissed", resolved_at: T_JS }),
          // An album report: no item at all.
          report(6, { media_id: null }),
        ],
      },
    });
  }

  it("★ decides each closed line's way back from the item's own row", async () => {
    fake = verdictWorld();
    const { reports } = await listReports("all", 50);
    const byId = new Map(reports.map((r) => [r.id, r]));
    // The verdict's own removal, still waiting out its window: Undo.
    expect(byId.get(uuid("r", 2))?.wayBack).toBe("undo");
    // A removal the verdict only made the operator's: nothing to undo here.
    expect(byId.get(uuid("r", 3))?.wayBack).toBeNull();
    // Held: never Undo.
    expect(byId.get(uuid("r", 4))?.wayBack).toBe("held");
    // Dismissed, and open, and an album: nothing.
    expect(byId.get(uuid("r", 5))?.wayBack).toBeNull();
    expect(byId.get(uuid("r", 1))?.wayBack).toBeNull();
    expect(byId.get(uuid("r", 6))?.wayBack).toBeNull();
  });

  it("carries the note, the item's standing and its hold, and never a timestamp of the item", async () => {
    fake = verdictWorld();
    const { reports } = await listReports("all", 50);
    const byId = new Map(reports.map((r) => [r.id, r]));
    expect(byId.get(uuid("r", 2))?.resolution_note).toBe(
      "Card number legible in the frame.",
    );
    expect(byId.get(uuid("r", 1))?.resolution_note).toBeNull();
    expect(byId.get(uuid("r", 1))?.media).toMatchObject({
      standing: "live",
      held: false,
      previewUrl: null,
    });
    expect(byId.get(uuid("r", 2))?.media).toMatchObject({
      standing: "operator",
      previewUrl: "signed:preview-2",
    });
    expect(byId.get(uuid("r", 4))?.media).toMatchObject({ held: true });
    expect(byId.get(uuid("r", 5))?.media).toMatchObject({
      standing: "removed",
    });
    for (const r of reports) {
      expect(Object.keys(r.media ?? {})).not.toContain("removed_at");
      expect(Object.keys(r.media ?? {})).not.toContain("legal_hold_at");
    }
  });

  it("★ a filter reads only its own word, and All reads every one", async () => {
    fake = verdictWorld();
    const open = await listReports("open", 50);
    expect(open.reports.map((r) => r.status)).toEqual(["open", "open"]);
    const dismissed = await listReports("dismissed", 50);
    expect(dismissed.reports.map((r) => r.id)).toEqual([uuid("r", 5)]);
    const actioned = await listReports("actioned", 50);
    expect(new Set(actioned.reports.map((r) => r.status))).toEqual(
      new Set(["actioned"]),
    );
    expect(actioned.reports).toHaveLength(3);
    const all = await listReports("all", 50);
    expect(all.reports).toHaveLength(6);
  });

  it("the People arm carries its note and reads its filter the same way", async () => {
    fake = createFakePostgrest({
      tables: {
        reports: [
          {
            id: uuid("q", 1),
            reason: null,
            created_at: at(1),
            status: "actioned",
            resolved_at: T_JS,
            resolution_note: "Bio cleared out of band.",
            event_id: null,
            media_id: null,
            profile_id: uuid("p", 1),
          },
          {
            id: uuid("q", 2),
            reason: null,
            created_at: at(2),
            status: "open",
            resolved_at: null,
            resolution_note: null,
            event_id: null,
            media_id: null,
            profile_id: uuid("p", 1),
          },
        ],
        profiles: [
          { id: uuid("p", 1), display_name: "Jordan Pike", slug: "jordanpike" },
        ],
      },
    });
    const actioned = await listProfileReports("actioned", 50);
    expect(actioned.reports).toHaveLength(1);
    expect(actioned.reports[0].resolution_note).toBe(
      "Bio cleared out of band.",
    );
    const open = await listProfileReports("open", 50);
    expect(open.reports.map((r) => r.id)).toEqual([uuid("q", 2)]);
  });
});
