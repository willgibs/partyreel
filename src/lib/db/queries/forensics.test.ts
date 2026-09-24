/**
 * EVERY HOLD, AND EVERY FAILURE LOUD (the 1,000-row round, Will 2026-09-23: "Let's ensure we will not
 * face any of those issues here").
 *
 * The holds list read every held media row in one request (cut at 1,000), then looked up their
 * preservation state and event names with two `.in()` lists carrying every held id, and dropped both
 * lookups' errors, so a hold could show no event and "not preserved" because a read failed. The
 * health counts read a failed count as zero. Against `fake-postgrest` (every read clamped at 1,000, a
 * URL past 8,000 characters failed), with 2,500 holds: every hold comes back once, newest hold first,
 * each with its preservation state and event name, every lookup chunk under the URL limit; a failed
 * lookup or count throws.
 */
import { describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { getForensicsHealth, listHeldMedia } = await import(
  "@/lib/db/queries/forensics"
);

const uuid = (prefix: string, i: number) =>
  `${prefix}0000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (secondsAgo: number) =>
  new Date(Date.parse("2026-09-23T12:00:00.000Z") - secondsAgo * 1000)
    .toISOString()
    .replace("Z", "000+00:00");

function world(holds = 2500): FakePostgrest {
  const media: FakeRow[] = Array.from({ length: holds }, (_, i) => ({
    id: uuid("m", i),
    event_id: uuid("e", i % 1200),
    status: "approved",
    // Every five holds share a stamp, so ties straddle the page boundaries.
    legal_hold_at: at(100 + Math.floor(i / 5)),
    legal_hold_reason: `case ${i}`,
    created_at: at(10_000),
  }));
  media.push({
    id: uuid("m", 99_999),
    event_id: uuid("e", 0),
    status: "approved",
    legal_hold_at: null,
    legal_hold_reason: null,
    created_at: at(10),
  });
  return createFakePostgrest({
    tables: {
      media,
      upload_forensics: Array.from({ length: holds }, (_, i) => ({
        id: uuid("f", i),
        media_id: uuid("m", i),
        preserved_at: i % 2 === 0 ? at(50) : null,
        user_agent: "Mozilla/5.0",
        created_at: at(10_000),
      })),
      events: Array.from({ length: 1200 }, (_, i) => ({
        id: uuid("e", i),
        name: `Event ${i}`,
      })),
      forensic_audit_log: [],
    },
  });
}

describe("listHeldMedia", () => {
  it("★ reads 2,500 holds whole, newest hold first, each with its state and its event", async () => {
    fake = world();
    const holds = await listHeldMedia();

    expect(holds).toHaveLength(2500);
    expect(new Set(holds.map((h) => h.id)).size).toBe(2500);
    const stamps = holds.map((h) => h.heldAt);
    expect([...stamps].sort().reverse()).toEqual(stamps);
    expect(holds.every((h) => h.eventName !== null)).toBe(true);
    expect(holds.filter((h) => h.preservedAt !== null)).toHaveLength(1250);
    for (const request of fake.requests) {
      expect(request.failed).toBe(false);
      expect(request.urlLength).toBeLessThan(8000);
    }
    // Every id list rode chunks of at most 150.
    for (const request of fake.requests.filter((r) => r.name !== "media")) {
      const list = request.filters.find((f) => f.op === "in");
      expect((list?.value as unknown[]).length).toBeLessThanOrEqual(150);
    }
  });

  it("★ a failed lookup throws, never a hold with no event or no state", async () => {
    fake = world(10);
    delete fake.tables.upload_forensics;
    await expect(listHeldMedia()).rejects.toThrow(
      /admin forensics: preservation state/,
    );
    fake = world(10);
    delete fake.tables.events;
    await expect(listHeldMedia()).rejects.toThrow(/admin forensics: held events/);
  });

  it("no hold reads nothing more", async () => {
    fake = world(0);
    await expect(listHeldMedia()).resolves.toEqual([]);
    expect(fake.requests).toHaveLength(1);
  });
});

describe("getForensicsHealth", () => {
  it("counts every hold past 1,000, as HEAD counts", async () => {
    fake = world();
    const health = await getForensicsHealth();
    expect(health.activeHolds).toBe(2500);
    expect(fake.requests.every((r) => r.method === "HEAD")).toBe(true);
  });

  it("★ a failed count throws rather than reporting a healthy zero", async () => {
    fake = world(10);
    delete fake.tables.forensic_audit_log;
    await expect(getForensicsHealth()).rejects.toThrow(
      /admin forensics: failed actions/,
    );
  });
});
