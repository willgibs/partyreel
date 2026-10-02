/**
 * WHAT THE WALK HEARS (`status/route.ts`, `export-ends`): the Worker's word on one export, by its nonce:
 * nothing yet, streaming, or how it ended with the ids its zip lacks. An unknown nonce answers as nothing
 * heard; a read that failed is never "nothing heard".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { POST } = await import("./route");

const JTI = "0123456789abcdef0123456789abcdef";

async function ask(body: unknown) {
  const res = await POST(
    new Request("https://partyreel.test/api/export/status", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
  return {
    status: res.status,
    cache: res.headers.get("cache-control"),
    body: await res.json(),
  };
}

const at = "2026-10-01T12:00:00.000000+00:00";

beforeEach(() => {
  fake = createFakePostgrest({ tables: { export_log: [] } });
});

describe("the walk's status poll", () => {
  it("answers none for a nonce with nothing heard, and the same for one nobody minted", async () => {
    fake.tables.export_log.push({
      jti: JTI,
      outcome: "minted",
      stream_started_at: null,
      stream_ended_at: null,
      stream_outcome: null,
      stream_missing: null,
    });
    expect(await ask({ jti: JTI })).toEqual({
      status: 200,
      cache: "no-store",
      body: { ok: true, state: "none" },
    });
    expect((await ask({ jti: "f".repeat(32) })).body).toEqual({
      ok: true,
      state: "none",
    });
  });

  it("answers streaming once the stream began, and its end with the ids it lacks", async () => {
    const r = {
      jti: JTI,
      outcome: "minted",
      stream_started_at: at,
      stream_ended_at: null,
      stream_outcome: null,
      stream_missing: null,
    };
    fake.tables.export_log.push(r);
    expect((await ask({ jti: JTI })).body).toEqual({
      ok: true,
      state: "streaming",
    });
    Object.assign(r, {
      stream_ended_at: at,
      stream_outcome: "short",
      stream_missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
    });
    expect((await ask({ jti: JTI })).body).toEqual({
      ok: true,
      state: "short",
      missing: ["66666666-7777-4888-9999-aaaaaaaaaaaa"],
    });
  });

  it("answers an empty stream (the 204, no start) as empty", async () => {
    fake.tables.export_log.push({
      jti: JTI,
      outcome: "minted",
      stream_started_at: null,
      stream_ended_at: at,
      stream_outcome: "empty",
      stream_missing: ["m1"],
    });
    expect((await ask({ jti: JTI })).body).toEqual({
      ok: true,
      state: "empty",
      missing: ["m1"],
    });
  });

  it.each([
    ["no body", "not json"],
    ["no nonce", {}],
    ["a nonce of the wrong shape", { jti: "../../etc" }],
  ])("refuses %s before reading anything", async (_, body) => {
    const { status } = await ask(body);
    expect(status).toBe(400);
    expect(fake.requests).toEqual([]);
  });

  it("a read that failed is a 503, never nothing heard", async () => {
    delete (fake.tables as Record<string, unknown>).export_log;
    const { status, body } = await ask({ jti: JTI });
    expect(status).toBe(503);
    expect(body).toEqual({ ok: false, code: "unavailable" });
  });
});
