/**
 * THE DISMISSAL'S WAY BACK (build 19's red-team, 2026-09-29: Dismiss was one press with no confirm and
 * no Undo, so a slip closed a harm report for good and only SQL reopened it). `reopenReportAction` is
 * the write behind the toast's Undo and the closed line's, against an in-memory PostgREST:
 *
 *  - a dismissal inside the product's 30 days reopens, its verdict cleared;
 *  - ★ the guards are in the WRITE: only a report still `dismissed`, and only while its verdict is
 *    inside the window (or its strike still counts), whatever the read before it said;
 *  - ★ Will's #60: a child-abuse dismissal that is a strike reopens for as long as the strike counts,
 *    by the lapse the rule itself answers; one that kept no address keeps the 30 days;
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
// The proof mail's two dependencies, which this file never sends: the canonical origin (it validates the
// public env on import) and the one send path.
vi.mock("@/lib/env", () => ({ env: {}, serverEnv: {} }));
vi.mock("@/lib/email/send", () => ({ sendOnce: vi.fn() }));
// The strike rule's lapse, as `report_strikes` answers it (`lapse_seconds`): 180 days, or none before its migration.
const rule = vi.hoisted(() => ({
  lapseMs: (180 * 86_400_000) as number | null,
  fails: false,
  asked: 0,
}));
vi.mock("@/lib/db/queries/reports", () => ({
  readProofMailEnabled: vi.fn(async () => false),
  readStrikeLapse: vi.fn(async () => {
    rule.asked += 1;
    if (rule.fails)
      throw new Error("canceling statement due to statement timeout");
    return rule.lapseMs;
  }),
}));
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
  rule.lapseMs = 180 * DAY;
  rule.fails = false;
  rule.asked = 0;
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
    // ★ RESHAPED ON PURPOSE (triage-r2-wiring, 2026-09-29; scar kept: the guards ride the write). A reopen is a
    // SET now (a verdict answers its whole entry, and the sweep's Undo reopens every report its one press
    // closed), so the named reports ride an `in` list; the status and the window's floor are unchanged.
    // And again (crumbs-41, Will's #60): the floor rides an `or()` now, beside the strike's own arm, because a
    // child-abuse dismissal that is a strike reopens for as long as the strike counts; the window's arm is unchanged.
    expect(patch.filters).toEqual(
      expect.arrayContaining([
        { column: "id", op: "in", value: [ID] },
        { column: "status", op: "eq", value: "dismissed" },
      ]),
    );
    const guard = patch.filters.find((f) => f.op === "or");
    expect(guard, "the window's floor is a filter of the write").toBeDefined();
    const floor = /^resolved_at\.gte\.([^,]+)/.exec(String(guard!.value));
    expect(floor, "the window's arm leads the guard").not.toBeNull();
    const floorMs = Date.parse(floor![1]);
    // The floor is thirty days before the press, to the moment the action read the clock.
    expect(floorMs).toBeGreaterThanOrEqual(before - 30 * DAY);
    expect(floorMs).toBeLessThanOrEqual(Date.now() - 30 * DAY);
    // Inside the 30 days the strike rule was never asked.
    expect(rule.asked).toBe(0);
  });

  it("keeps a dismissal past its window closed, in words, and writes nothing", async () => {
    fake = world({ resolved_at: daysAgo(31) });
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(result.ok ? "" : result.message).toMatch(/older than 30 days/);
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("dismissed");
  });

  it("★ reopens a child-abuse dismissal that is a strike, past the 30 days, for as long as the strike counts (#60)", async () => {
    fake = world({
      kind: "child",
      reporter_hash: "r-addr:abc",
      resolved_at: daysAgo(100),
    });
    await expect(reopenReportAction(ID)).resolves.toEqual({ ok: true });
    expect(row()).toMatchObject({ status: "open", resolved_at: null });
    // The lapse is the rule's own answer, asked once, and the write carries the strike's arm with it.
    expect(rule.asked).toBe(1);
    const guard = writes()[0].filters.find((f) => f.op === "or");
    expect(String(guard?.value)).toMatch(
      /,and\(kind\.eq\.child,reporter_hash\.not\.is\.null,resolved_at\.gt\.[^)]+\)$/,
    );
  });

  it("★ keeps a strike's dismissal closed once its strike has lapsed, in words, and writes nothing", async () => {
    fake = world({
      kind: "child",
      reporter_hash: "r-addr:abc",
      resolved_at: daysAgo(181),
    });
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(result.ok ? "" : result.message).toMatch(/strike has lapsed/);
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("dismissed");
  });

  it("★ gives a child-abuse dismissal that kept no address (never a strike) the 30 days every dismissal has", async () => {
    fake = world({
      kind: "child",
      reporter_hash: null,
      resolved_at: daysAgo(31),
    });
    const result = await reopenReportAction(ID);
    expect(result.ok ? "" : result.message).toMatch(/older than 30 days/);
    expect(writes()).toHaveLength(0);
    // Nothing to ask the strike rule about.
    expect(rule.asked).toBe(0);
  });

  it("★ measures the strike by the lapse the rule answers, never a 180 of its own", async () => {
    // A rule whose lapse is 99 days: the same 100-day-old strike that reopens under 180 has lapsed under it.
    fake = world({
      kind: "child",
      reporter_hash: "r-addr:abc",
      resolved_at: daysAgo(100),
    });
    rule.lapseMs = 99 * DAY;
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "validation" });
    expect(writes()).toHaveLength(0);
    expect(row().status).toBe("dismissed");
  });

  it("before the lapse migration (no lapse to read), keeps every dismissal to the 30 days, as before #60", async () => {
    fake = world({
      kind: "child",
      reporter_hash: "r-addr:abc",
      resolved_at: daysAgo(100),
    });
    rule.lapseMs = null;
    const result = await reopenReportAction(ID);
    expect(result.ok ? "" : result.message).toMatch(/older than 30 days/);
    expect(writes()).toHaveLength(0);
  });

  it("fails loudly when the strike rule cannot be read, and never guesses a window", async () => {
    fake = world({
      kind: "child",
      reporter_hash: "r-addr:abc",
      resolved_at: daysAgo(100),
    });
    rule.fails = true;
    const result = await reopenReportAction(ID);
    expect(result).toMatchObject({ ok: false, code: "unknown" });
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
