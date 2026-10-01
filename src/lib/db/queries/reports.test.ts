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
// The address's keyed hash, as a readable stand-in (the real one needs the rate-limit secret).
vi.mock("@/lib/reports/reporter.server", () => ({
  reporterAddressHash: (email: string) => `hash:${email.trim().toLowerCase()}`,
}));

const {
  countOpenReports,
  countUrgentReports,
  listOpenEntries,
  listProfileReports,
  listReports,
  oldestOpenReportAt,
  readCoveredItems,
  readProofAsk,
} = await import("@/lib/db/queries/reports");

/** The page's one clock read (`serverNow()`), the instant every closed line's window is measured from. */
const NOW = Date.parse("2026-09-29T12:00:00.000Z");

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
    const { reports, more } = await listReports("open", 50, NOW);

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
    const { reports, more } = await listReports("all", 2000, NOW);

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
    const { reports, more } = await listReports("all", 50, NOW);
    expect(reports).toHaveLength(50);
    expect(more).toBe(false);
  });

  it("an empty queue reads no lookups at all", async () => {
    fake = world([]);
    await expect(listReports("open", 50, NOW)).resolves.toEqual({
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

    const { reports, more } = await listProfileReports("open", 1200, NOW);

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
 * THE TWO READS THE TRIAGE MIGRATION ADDED (20260929140000), now over the generated types: the portal's urgent
 * count (open child-abuse reports, a head count) and what an answer link opens. A failed read throws, where a
 * missing column used to read as "no urgent reports" or "a spent link" (crumbs-15: the seam went with the apply).
 */
describe("the urgent count and the answer link's ask", () => {
  const report = (id: string, over: FakeRow = {}): FakeRow => ({
    id,
    status: "open",
    kind: "other",
    event_id: uuid("e", 1),
    proof_token_hash: null,
    proof_question: null,
    proof_answered_at: null,
    ...over,
  });

  it("counts only the open child-abuse reports", async () => {
    fake = createFakePostgrest({
      tables: {
        reports: [
          report("r1", { kind: "child" }),
          report("r2", { kind: "child" }),
          report("r3", { kind: "child", status: "dismissed" }),
          report("r4", { kind: "sexual" }),
        ],
      },
    });
    await expect(countUrgentReports()).resolves.toBe(2);
  });

  it("opens the operator's question on an open, unanswered report, with the album's name", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [{ id: uuid("e", 1), name: "Priya & Sam's baby shower" }],
        reports: [
          report("r1", {
            proof_token_hash: "hash-1",
            proof_question: "Which photo of the toast?",
          }),
        ],
      },
    });
    await expect(readProofAsk("hash-1")).resolves.toEqual({
      question: "Which photo of the toast?",
      eventName: "Priya & Sam's baby shower",
    });
  });

  it("reads a used, a closed, a question-less and an unknown link all the same: nothing", async () => {
    fake = createFakePostgrest({
      tables: {
        reports: [
          report("r1", {
            proof_token_hash: "answered",
            proof_question: "Which?",
            proof_answered_at: "2026-09-29T10:00:00.000Z",
          }),
          report("r2", {
            proof_token_hash: "closed",
            proof_question: "Which?",
            status: "dismissed",
          }),
          report("r3", { proof_token_hash: "no-question" }),
        ],
      },
    });
    for (const hash of ["answered", "closed", "no-question", "unknown"]) {
      await expect(readProofAsk(hash)).resolves.toBeNull();
    }
  });

  it("★ a failed read throws, and never reads as a spent link or as no urgent report", async () => {
    fake = createFakePostgrest({ tables: {} });
    const from = fake.from.bind(fake);
    fake.from = (table: string) => from(table === "reports" ? "gone" : table);
    await expect(readProofAsk("hash-1")).rejects.toThrow(
      "report answer: the ask",
    );
    await expect(countUrgentReports()).rejects.toThrow(
      "admin reports: urgent count",
    );
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
          // Dismissed forty days before the page read: past its window.
          report(7, {
            status: "dismissed",
            resolved_at: "2026-08-20T09:00:00.000000+00:00",
            media_id: uuid("m", 1),
          }),
        ],
      },
    });
  }

  it("★ decides each closed line's way back from the item's own row", async () => {
    fake = verdictWorld();
    const { reports } = await listReports("all", 50, NOW);
    const byId = new Map(reports.map((r) => [r.id, r]));
    // The verdict's own removal, still waiting out its window: Undo.
    expect(byId.get(uuid("r", 2))?.wayBack).toBe("undo");
    // A removal the verdict only made the operator's: nothing to undo here.
    expect(byId.get(uuid("r", 3))?.wayBack).toBeNull();
    // Held: never Undo.
    expect(byId.get(uuid("r", 4))?.wayBack).toBe("held");
    // Dismissed the day before the read: it reopens (build 19's red-team).
    expect(byId.get(uuid("r", 5))?.wayBack).toBe("reopen");
    // ...and not forty days on; open, and an open album report, have nothing.
    expect(byId.get(uuid("r", 7))?.wayBack).toBeNull();
    expect(byId.get(uuid("r", 1))?.wayBack).toBeNull();
    expect(byId.get(uuid("r", 6))?.wayBack).toBeNull();
  });

  it("carries the note, the item's standing and its hold, and never a timestamp of the item", async () => {
    fake = verdictWorld();
    const { reports } = await listReports("all", 50, NOW);
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
    const open = await listReports("open", 50, NOW);
    expect(open.reports.map((r) => r.status)).toEqual(["open", "open"]);
    const dismissed = await listReports("dismissed", 50, NOW);
    expect(dismissed.reports.map((r) => r.id)).toEqual([
      uuid("r", 5),
      uuid("r", 7),
    ]);
    const actioned = await listReports("actioned", 50, NOW);
    expect(new Set(actioned.reports.map((r) => r.status))).toEqual(
      new Set(["actioned"]),
    );
    expect(actioned.reports).toHaveLength(3);
    const all = await listReports("all", 50, NOW);
    expect(all.reports).toHaveLength(7);
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
          {
            id: uuid("q", 3),
            reason: null,
            created_at: at(3),
            status: "dismissed",
            resolved_at: T,
            resolution_note: null,
            event_id: null,
            media_id: null,
            profile_id: uuid("p", 1),
          },
          {
            id: uuid("q", 4),
            reason: null,
            created_at: at(4),
            status: "dismissed",
            resolved_at: "2026-08-20T09:00:00.000000+00:00",
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
    const actioned = await listProfileReports("actioned", 50, NOW);
    expect(actioned.reports).toHaveLength(1);
    expect(actioned.reports[0].resolution_note).toBe(
      "Bio cleared out of band.",
    );
    // Mark actioned removed nothing and is no dismissal: it has no way back here.
    expect(actioned.reports[0].wayBack).toBeNull();
    const open = await listProfileReports("open", 50, NOW);
    expect(open.reports.map((r) => r.id)).toEqual([uuid("q", 2)]);
    // A dismissal reopens inside its 30 days, and not past them.
    const dismissed = await listProfileReports("dismissed", 50, NOW);
    expect(dismissed.reports.map((r) => [r.id, r.wayBack])).toEqual([
      [uuid("q", 3), "reopen"],
      [uuid("q", 4), null],
    ]);
  });
});

describe("the closed log keeps the worst kinds covered (build 23's NIT-7)", () => {
  const T_JS = "2026-09-28T20:00:00.123Z";
  const report = (i: number, media: number, over: FakeRow) => ({
    id: uuid("r", i),
    reason: null,
    created_at: at(i),
    status: "dismissed",
    resolved_at: T_JS,
    resolution_note: null,
    event_id: uuid("e", 1),
    media_id: uuid("m", media),
    profile_id: null,
    ...over,
  });
  const media = (i: number) => ({
    id: uuid("m", i),
    type: "photo",
    original_key: `key-${i}`,
    preview_key: `preview-${i}`,
    status: "approved",
    removed_by_admin: false,
    removed_at: null,
    legal_hold_at: null,
  });

  it("★ signs no picture for an item any report names as a covered kind, open or closed", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [{ id: uuid("e", 1), name: "RT23 doors A" }],
        media: [media(1), media(2), media(3)],
        reports: [
          // A child-abuse report, dismissed (the red-team's line).
          report(1, 1, { kind: "child" }),
          // Dismissed as violence, while another report calls the same photo sexual content.
          report(2, 2, { kind: "violence" }),
          report(3, 2, { kind: "sexual", status: "open", resolved_at: null }),
          // Violence alone: its frame is the operator's to see.
          report(4, 3, { kind: "violence" }),
        ],
      },
    });
    const { reports } = await listReports("dismissed", 50, NOW);
    const itemOf = (i: number) =>
      reports.find((r) => r.id === uuid("r", i))?.media;
    for (const i of [1, 2]) {
      expect(itemOf(i)).toMatchObject({
        covered: true,
        url: null,
        previewUrl: null,
      });
    }
    expect(itemOf(4)).toMatchObject({
      covered: false,
      url: "signed:key-3",
      previewUrl: "signed:preview-3",
    });
    // Nothing of a covered item was signed at all.
    const urls = reports.flatMap((r) => [r.media?.url, r.media?.previewUrl]);
    expect(urls.filter((u) => /key-[12]|preview-[12]/.test(String(u)))).toEqual(
      [],
    );
  });
});

describe("the open queue says who sent each report (build 23's LOW-2 and NIT-8)", () => {
  const HOST = uuid("p", 1);
  const report = (i: number, over: FakeRow) => ({
    id: uuid("r", i),
    reason: null,
    created_at: at(i),
    status: "open",
    event_id: uuid("e", 1),
    media_id: uuid("m", i),
    kind: "violence",
    reporter_signed_in: true,
    reporter_email: null,
    reporter_hash: null,
    hid_at: null,
    ...over,
  });
  const media = (i: number) => ({
    id: uuid("m", i),
    type: "photo",
    original_key: `key-${i}`,
    preview_key: null,
    status: "approved",
    removed_by_admin: false,
    removed_at: null,
    legal_hold_at: null,
    event_id: uuid("e", 1),
    guest_id: null,
    guests: null,
  });

  it("★ tells the album's own host from a guest, and a reopened report's confirmed address from none", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [{ id: uuid("e", 1), name: "RT23 doors A", host_id: HOST }],
        profiles: [
          { id: HOST, display_name: "Will Gibson", email: "Host@Example.com" },
        ],
        media: [1, 2, 3, 4].map(media),
        reports: [
          // The host's own report, its address still kept.
          report(1, { reporter_email: "host@example.com" }),
          // A guest's.
          report(2, { reporter_email: "guest@example.com" }),
          // The host's worst-kind report, dismissed and reopened: the address forgotten, its hash kept.
          report(3, { kind: "child", reporter_hash: "hash:host@example.com" }),
          // A guest's worst-kind report, reopened the same way.
          report(4, { kind: "child", reporter_hash: "hash:guest@example.com" }),
        ],
      },
      rpc: { report_queue_facts: () => ({}) },
    });
    const { entries } = await listOpenEntries(50);
    const said = Object.fromEntries(
      entries.map((e) => [
        e.reportId,
        {
          byHost: e.reports[0].byHost,
          confirmed: e.reports[0].confirmed,
          canAsk: e.reports[0].canAsk,
        },
      ]),
    );
    expect(said).toEqual({
      [uuid("r", 1)]: { byHost: true, confirmed: true, canAsk: true },
      [uuid("r", 2)]: { byHost: false, confirmed: true, canAsk: true },
      [uuid("r", 3)]: { byHost: true, confirmed: true, canAsk: false },
      [uuid("r", 4)]: { byHost: false, confirmed: true, canAsk: false },
    });
  });
});

describe("what a report named outlives its item's row (crumbs-21, migration 20260929231000)", () => {
  // A purged item's report used to lose its media_id to ON DELETE SET NULL and read as its album's.
  // The report keeps the id and the kind now, so it reads as that item's, gone, and never as an album's.
  const T_JS = "2026-09-28T20:00:00.123Z";
  const closed = (i: number, over: FakeRow) => ({
    id: uuid("r", i),
    reason: null,
    created_at: at(i),
    status: "dismissed",
    resolved_at: T_JS,
    resolution_note: null,
    event_id: uuid("e", 1),
    media_id: null,
    media_type: null,
    profile_id: null,
    kind: "violence",
    ...over,
  });
  const standing = {
    id: uuid("m", 2),
    type: "photo",
    original_key: "key-2",
    preview_key: null,
    status: "approved",
    removed_by_admin: false,
    removed_at: null,
    legal_hold_at: null,
  };

  function world() {
    return createFakePostgrest({
      tables: {
        events: [{ id: uuid("e", 1), name: "RT23 doors A" }],
        media: [standing],
        reports: [
          // A video, reported, dismissed, then purged: its report still names it.
          closed(1, { media_id: uuid("m", 1), media_type: "video" }),
          // A photo still standing.
          closed(2, { media_id: uuid("m", 2), media_type: "photo" }),
          // The album itself.
          closed(3, {}),
        ],
      },
    });
  }

  it("★ reads a report whose item is gone as that item's, with its kind, never its album's", async () => {
    fake = world();
    const { reports } = await listReports("all", 50, NOW);
    const byId = new Map(reports.map((r) => [r.id, r]));
    expect(byId.get(uuid("r", 1))).toMatchObject({
      media: null,
      deleted: { id: uuid("m", 1), type: "video" },
    });
    expect(byId.get(uuid("r", 2))?.media).toMatchObject({ id: uuid("m", 2) });
    expect(byId.get(uuid("r", 2))?.deleted).toBeNull();
    // The album's own report names no item, gone or standing.
    expect(byId.get(uuid("r", 3))).toMatchObject({
      media: null,
      deleted: null,
    });
  });

  it("reads the kind as unknown until the column stands, never a failed inbox", async () => {
    // Before the migration is applied PostgREST answers the undefined column (42703): the gone item is
    // still named, its kind unknown, and every other report reads as before.
    const real = world();
    fake = {
      ...real,
      from: (table: string) => {
        const target = real.from(table);
        if (table !== "reports") return target;
        return new Proxy(target, {
          get(t, prop, receiver) {
            if (prop !== "select") return Reflect.get(t, prop, receiver);
            return (columns: string, ...rest: unknown[]) =>
              columns.includes("media_type")
                ? {
                    in: async () => ({
                      data: null,
                      error: {
                        code: "42703",
                        message: "column reports.media_type does not exist",
                        details: "",
                        hint: "",
                      },
                      count: null,
                      status: 400,
                      statusText: "Bad Request",
                    }),
                  }
                : (t.select as (...a: unknown[]) => unknown)(columns, ...rest);
          },
        });
      },
    } as FakePostgrest;
    const { reports } = await listReports("all", 50, NOW);
    expect(reports.find((r) => r.id === uuid("r", 1))?.deleted).toEqual({
      id: uuid("m", 1),
      type: null,
    });
    expect(reports).toHaveLength(3);
  });

  it("★ a dismissal reopened after its item was purged comes back as that item's entry, not its album's", async () => {
    fake = createFakePostgrest({
      tables: {
        events: [
          { id: uuid("e", 1), name: "RT23 doors A", host_id: uuid("p", 1) },
        ],
        profiles: [{ id: uuid("p", 1), display_name: "Will", email: null }],
        media: [],
        reports: [
          {
            id: uuid("r", 1),
            reason: null,
            created_at: at(1),
            status: "open",
            event_id: uuid("e", 1),
            media_id: uuid("m", 1),
            media_type: "photo",
            kind: "sexual",
            reporter_signed_in: false,
            reporter_email: null,
            reporter_hash: null,
            hid_at: null,
          },
        ],
      },
      rpc: { report_queue_facts: () => ({}) },
    });
    const { entries } = await listOpenEntries(50);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      key: `item:${uuid("m", 1)}`,
      subject: "item",
      media: null,
      deleted: { id: uuid("m", 1), type: "photo" },
    });
  });
});

describe("the covered rule's one home, as the albums grid asks it (crumbs-21)", () => {
  const report = (i: number, over: FakeRow) => ({
    id: uuid("r", i),
    event_id: uuid("e", 1),
    media_id: uuid("m", i),
    kind: "violence",
    status: "dismissed",
    ...over,
  });

  it("★ answers every item of one album any report names as a covered kind, open or closed, and no other album's", async () => {
    fake = createFakePostgrest({
      tables: {
        reports: [
          report(1, { kind: "child" }),
          report(2, { kind: "sexual", status: "open" }),
          report(3, { kind: "violence" }),
          // Named twice: once covered is covered.
          report(4, { kind: "other" }),
          report(5, { kind: "sexual", media_id: uuid("m", 4) }),
          // The album's own report names no item.
          report(6, { kind: "child", media_id: null }),
          // Another album's worst kind.
          report(7, { kind: "child", event_id: uuid("e", 2) }),
        ],
      },
    });
    const covered = await readCoveredItems({ eventId: uuid("e", 1) });
    expect([...covered].sort()).toEqual(
      [uuid("m", 1), uuid("m", 2), uuid("m", 4)].sort(),
    );
    // Asked by the items a list holds, it answers the same rule.
    const byItems = await readCoveredItems({
      mediaIds: [uuid("m", 1), uuid("m", 3), uuid("m", 7)],
    });
    expect([...byItems].sort()).toEqual([uuid("m", 1), uuid("m", 7)].sort());
  });
});

/**
 * ★ THE QUEUE'S STRIKES COME FROM THE RULE'S ONE HOME (crumbs-33, migration 20261001100000): the open queue asks
 * `report_strikes` for the hashes its open child-abuse reports kept, and each such report carries its address's
 * strikes and what a Dismiss of its entry would make of them. Until the function stands, the queue reads as before
 * with no strike reading, never as "no strikes".
 */
describe("the open queue's strikes (crumbs-33)", () => {
  const HOST = uuid("p", 1);
  const report = (i: number, over: FakeRow) => ({
    id: uuid("r", i),
    reason: null,
    created_at: at(i),
    status: "open",
    event_id: uuid("e", 1),
    media_id: uuid("m", i),
    kind: "child",
    reporter_signed_in: true,
    reporter_email: null,
    reporter_hash: null,
    hid_at: null,
    ...over,
  });
  const media = (i: number) => ({
    id: uuid("m", i),
    type: "photo",
    original_key: `key-${i}`,
    preview_key: null,
    status: "approved",
    removed_by_admin: false,
    removed_at: null,
    legal_hold_at: null,
    event_id: uuid("e", 1),
    guest_id: null,
    guests: null,
  });
  const tables = () => ({
    events: [{ id: uuid("e", 1), name: "RT23 doors A", host_id: HOST }],
    profiles: [{ id: HOST, display_name: "Will", email: "host@example.com" }],
    media: [1, 2, 3].map(media),
    reports: [
      // Two reports of one item from one address: a Dismiss of the entry makes both strikes.
      report(1, {
        media_id: uuid("m", 1),
        reporter_hash: "hash:a@example.com",
      }),
      report(2, {
        media_id: uuid("m", 1),
        reporter_hash: "hash:a@example.com",
      }),
      // An address the read has never seen.
      report(3, {
        media_id: uuid("m", 2),
        reporter_hash: "hash:new@example.com",
      }),
      // Another kind keeps no hash and carries no strikes.
      report(4, { media_id: uuid("m", 3), kind: "violence" }),
    ],
  });

  it("★ asks the one home for the hashes the open child-abuse reports kept, and says what a Dismiss would make of each", async () => {
    const asked: unknown[] = [];
    fake = createFakePostgrest({
      tables: tables(),
      rpc: {
        report_queue_facts: () => ({}),
        report_strikes: (args) => {
          asked.push(args.p_reporter_hashes);
          return {
            strikes: 3,
            fresh_lapses_at: "2027-03-30T09:00:00.123456+00:00",
            addresses: {
              "hash:a@example.com": {
                live: 1,
                barred: false,
                lapses: ["2027-01-15T12:00:00.5+00:00"],
              },
            },
          };
        },
      },
    });
    const { entries } = await listOpenEntries(50);
    expect(asked).toHaveLength(1);
    expect([...(asked[0] as string[])].sort()).toEqual([
      "hash:a@example.com",
      "hash:new@example.com",
    ]);
    const strikesOf = (i: number) =>
      entries.flatMap((e) => e.reports).find((r) => r.id === uuid("r", i))
        ?.strikes;
    // One live strike and two of this entry's reports from the address: a Dismiss makes three, and the bar holds
    // until the oldest of the three lapses (the one already live), read in ISO.
    expect(strikesOf(1)).toEqual({
      live: 1,
      bar: 3,
      barredUntil: null,
      dismiss: { live: 3, barredUntil: "2027-01-15T12:00:00.500Z" },
    });
    expect(strikesOf(2)).toEqual(strikesOf(1));
    // An address the read did not name holds none.
    expect(strikesOf(3)).toEqual({
      live: 0,
      bar: 3,
      barredUntil: null,
      dismiss: { live: 1, barredUntil: null },
    });
    expect(strikesOf(4)).toBeNull();
  });

  it("★ reads as no reading, never as no strikes, until the function stands", async () => {
    // No `report_strikes` handler: the fake answers PGRST202, as PostgREST does before the migration.
    fake = createFakePostgrest({
      tables: tables(),
      rpc: { report_queue_facts: () => ({}) },
    });
    const { entries } = await listOpenEntries(50);
    expect(entries.flatMap((e) => e.reports)).toHaveLength(4);
    expect(
      entries.flatMap((e) => e.reports).every((r) => r.strikes === null),
    ).toBe(true);
  });

  it("fails loudly on any other failure, as the queue's facts do", async () => {
    fake = createFakePostgrest({
      tables: tables(),
      rpc: {
        report_queue_facts: () => ({}),
        report_strikes: () => {
          throw new Error("canceling statement due to statement timeout");
        },
      },
    });
    await expect(listOpenEntries(50)).rejects.toThrow(/strikes/);
  });

  it("asks nothing when no open report is a child-abuse report from a kept address", async () => {
    const asked: unknown[] = [];
    fake = createFakePostgrest({
      tables: {
        ...tables(),
        reports: [report(4, { media_id: uuid("m", 3), kind: "violence" })],
      },
      rpc: {
        report_queue_facts: () => ({}),
        report_strikes: (args) => {
          asked.push(args);
          return {};
        },
      },
    });
    await listOpenEntries(50);
    expect(asked).toEqual([]);
  });
});
