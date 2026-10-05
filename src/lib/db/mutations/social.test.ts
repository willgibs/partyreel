/**
 * A PERSON REPORT SAYS ITS REPORTER WAS SIGNED IN (crumbs-78). `createProfileReport` is a service-role INSERT over a
 * deny-all table, and only a signed-in person (re-checked with `getUser()`) can reach it, but the row used to take
 * `reporter_signed_in`'s default, false, so the operator's queue (`reporterWho`) called the reporter a signed-out
 * guest. The route's own tests mock this function whole, so the row it writes is held here.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "reporter-1" };
const createClient = vi.fn(async () => ({
  auth: { getUser: async () => ({ data: { user } }) },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

const insert = vi.fn();
const from = vi.fn((table: string) => ({
  insert: (row: unknown) => insert(table, row),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from }),
}));

const { createProfileReport } = await import("@/lib/db/mutations/social");

beforeEach(() => {
  user = { id: "reporter-1" };
  insert.mockReset();
  insert.mockResolvedValue({ error: null });
  from.mockClear();
});

describe("createProfileReport", () => {
  it("★ writes the report with its reporter recorded as signed in", async () => {
    await expect(
      createProfileReport({
        profileId: "person-9",
        reason: "pretending to be me",
      }),
    ).resolves.toEqual({ ok: true, data: { id: "person-9" } });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith("reports", {
      profile_id: "person-9",
      reason: "pretending to be me",
      reporter_signed_in: true,
    });
  });

  it("keeps a report with no reason as one with no reason, still signed in", async () => {
    await createProfileReport({ profileId: "person-9", reason: null });
    expect(insert).toHaveBeenCalledWith("reports", {
      profile_id: "person-9",
      reason: null,
      reporter_signed_in: true,
    });
  });

  it("writes nothing for a signed-out caller", async () => {
    user = null;
    await expect(
      createProfileReport({ profileId: "person-9", reason: null }),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(from).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("refuses a report of oneself, and writes nothing", async () => {
    await expect(
      createProfileReport({ profileId: "reporter-1", reason: null }),
    ).resolves.toMatchObject({
      ok: false,
      message: "You can't report yourself.",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("answers a failed write in the reporter's words, never the database's", async () => {
    insert.mockResolvedValue({
      error: { code: "23503", message: "violates foreign key constraint" },
    });
    await expect(
      createProfileReport({ profileId: "person-9", reason: null }),
    ).resolves.toEqual({
      ok: false,
      code: "unknown",
      message: "Couldn't send your report. Please try again.",
    });
  });
});
