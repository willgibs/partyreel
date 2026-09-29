/**
 * THE DISMISSAL'S WAY BACK (build 19's red-team, 2026-09-29: Dismiss was one press with no confirm and
 * no Undo, so a slip closed a harm report for good and only SQL reopened it). `reopenReportAction` is
 * the write behind the toast's Undo and the closed line's, against an in-memory PostgREST:
 *
 *  - a dismissal inside the product's 30 days reopens, its verdict cleared;
 *  - ★ the guards are in the WRITE: only a report still `dismissed`, and only while its verdict is
 *    inside the window, whatever the read before it said;
 *  - an actioned report is refused (its own Undo restores what it removed), a dismissal past its
 *    window stays closed in words, a report already open answers done, and an operator below AAL2
 *    writes nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;
const auth = vi.hoisted(() => ({
  ok: true,
}));
const revalidated: string[] = [];

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidated.push(path),
}));
vi.mock("@/app/(app)/dashboard/actions", () => ({}));
vi.mock("@/lib/auth/admin-context", () => ({
  requireAdminAction: async () =>
    auth.ok
      ? { ok: true, ctx: { userId: "operator-1", aal: "aal2" } }
      : {
          ok: false,
          result: {
            ok: false,
            code: "forbidden",
            message: "Verify with your authenticator first.",
          },
        },
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: () => {},
  captureWarning: () => {},
}));
vi.mock("@/lib/forensics/preserve", () => ({ preserveMedia: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { reopenReportAction } = await import("./actions");

const ID = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const DAY = 86_400_000;

/** A timestamp as PostgREST returns it, `days` before the real clock. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY)
    .toISOString()
    .replace("Z", "000+00:00");
}

function world(over: FakeRow): FakePostgrest {
  return createFakePostgrest({
    tables: {
      reports: [
        {
          id: ID,
          event_id: "e1",
          media_id: "m1",
          profile_id: null,
          status: "dismissed",
          resolved_by: "operator-1",
          resolved_at: daysAgo(2),
          resolution_note: "Not harm: a guest who dislikes the photo.",
          ...over,
        },
      ],
    },
  });
}

const row = () => fake.tables.reports[0];
const writes = () => fake.requests.filter((r) => r.method === "PATCH");

beforeEach(() => {
  auth.ok = true;
  revalidated.length = 0;
});

describe("reopening a dismissed report", () => {
  it("★ reopens a dismissal inside its 30 days, the verdict and its note cleared", async () => {
    fake = world({});
    await expect(reopenReportAction(ID)).resolves.toEqual({ ok: true });
    expect(row()).toMatchObject({
      status: "open",
      resolved_by: null,
      resolved_at: null,
      resolution_note: null,
    });
    // The item was never touched by a dismissal, and a reopen touches nothing but the report.
    expect(fake.requests.every((r) => r.name === "reports")).toBe(true);
    expect(revalidated).toContain("/admin/reports");
  });

  it("★ writes only a report still dismissed, only inside the window: the guards ride the write", async () => {
    fake = world({});
    const before = Date.now();
    await reopenReportAction(ID);
    const [patch] = writes();
    expect(patch.filters).toEqual(
      expect.arrayContaining([
        { column: "id", op: "eq", value: ID },
        { column: "status", op: "eq", value: "dismissed" },
      ]),
    );
    const floor = patch.filters.find(
      (f) => f.column === "resolved_at" && f.op === "gte",
    );
    expect(floor, "the window's floor is a filter of the write").toBeDefined();
    const floorMs = Date.parse(String(floor!.value));
    // The floor is thirty days before the press, to the moment the action read the clock.
    expect(floorMs).toBeGreaterThanOrEqual(before - 30 * DAY);
    expect(floorMs).toBeLessThanOrEqual(Date.now() - 30 * DAY);
  });

  it("keeps a dismissal past its window closed, in words, and writes nothing", async () => {
    fake = world({ resolved_at: daysAgo(31) });
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(result.ok ? "" : result.message).toMatch(/older than 30 days/);
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("dismissed");
  });

  it("never reopens an actioned report: its own Undo restores what it removed", async () => {
    fake = world({ status: "actioned" });
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("actioned");
  });

  it("answers done for a report already open, and writes nothing", async () => {
    fake = world({ status: "open", resolved_at: null, resolved_by: null });
    await expect(reopenReportAction(ID)).resolves.toEqual({ ok: true });
    expect(writes()).toHaveLength(0);
  });

  it("refuses an operator below AAL2, a malformed id and a report that is gone, before any write", async () => {
    fake = world({});
    auth.ok = false;
    await expect(reopenReportAction(ID)).resolves.toMatchObject({
      ok: false,
      code: "forbidden",
    });
    auth.ok = true;
    await expect(reopenReportAction("not-a-uuid")).resolves.toMatchObject({
      ok: false,
      code: "validation",
    });
    await expect(
      reopenReportAction("11111111-2222-4333-8444-555555555555"),
    ).resolves.toMatchObject({ ok: false });
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("dismissed");
  });
});
