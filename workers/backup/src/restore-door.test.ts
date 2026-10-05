/**
 * THE WORKER'S ONE DOOR (restore-door.ts): Restore now from /admin/jobs. It answers nothing to anyone without the
 * bearer, fails closed with no secret to check, refuses with the restore off, and otherwise asks the prune's Durable
 * Object for a pass on the operator's behalf, answering what it did.
 */
import { describe, expect, it, vi } from "vitest";

import { bearerMatches, handleRestoreDoor, type DoorAsk } from "./restore-door";

const SECRET = "s3cret";
const ENV = { PRUNE_API_SECRET: SECRET, RESTORE_MODE: "on" };

function door(
  init: { path?: string; method?: string; auth?: string | null } = {},
  env: { PRUNE_API_SECRET?: string; RESTORE_MODE?: string } = ENV,
  ask: DoorAsk = vi.fn(async () => ({ state: "started" as const })),
) {
  const headers = new Headers();
  const auth = init.auth === undefined ? `Bearer ${SECRET}` : init.auth;
  if (auth !== null) headers.set("authorization", auth);
  return handleRestoreDoor(
    new Request(
      `https://partyreel-backup.example.workers.dev${init.path ?? "/restore"}`,
      {
        method: init.method ?? "POST",
        headers,
      },
    ),
    env,
    ask,
  );
}

describe("the restore's door", () => {
  it("★ asks the Durable Object for a pass on the operator's behalf, and answers what it did", async () => {
    const ask = vi.fn(async () => ({ state: "running" as const }));
    const res = await door({}, ENV, ask);
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ started: true, state: "running" });
    expect(ask).toHaveBeenCalledWith("manual");
  });

  it("asks in a dry run too: the pass then says what it would copy", async () => {
    const res = await door({}, { PRUNE_API_SECRET: SECRET });
    expect(res.status).toBe(202);
  });

  it("is a 404 on every other path and a 405 for anything but a POST, before any bearer is read", async () => {
    const ask = vi.fn();
    expect((await door({ path: "/", auth: null }, ENV, ask)).status).toBe(404);
    expect((await door({ path: "/restore/now" }, ENV, ask)).status).toBe(404);
    expect((await door({ method: "GET" }, ENV, ask)).status).toBe(405);
    expect(ask).not.toHaveBeenCalled();
  });

  it("refuses a caller without the bearer, or with a near one", async () => {
    const ask = vi.fn();
    for (const auth of [
      null,
      "",
      "Bearer",
      `Bearer ${SECRET}x`,
      `Bearer ${SECRET.slice(1)}`,
      SECRET,
    ]) {
      const res = await door({ auth }, ENV, ask);
      expect(res.status, String(auth)).toBe(401);
    }
    expect(ask).not.toHaveBeenCalled();
  });

  it("fails closed with no secret to check", async () => {
    const ask = vi.fn();
    const res = await door({ auth: "Bearer " }, { RESTORE_MODE: "on" }, ask);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      started: false,
      reason: "unconfigured",
    });
    expect(ask).not.toHaveBeenCalled();
  });

  it("refuses with the restore off: there is nothing to run", async () => {
    const ask = vi.fn();
    const res = await door({}, { ...ENV, RESTORE_MODE: "off" }, ask);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ started: false, reason: "off" });
    expect(ask).not.toHaveBeenCalled();
  });

  it("says when the Worker has no binding to ask, or the object did not answer", async () => {
    const unbound = await door({}, ENV, null);
    expect(unbound.status).toBe(503);
    expect(await unbound.json()).toEqual({ started: false, reason: "unbound" });
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const down = await door({}, ENV, async () => {
        throw new Error("overloaded");
      });
      expect(down.status).toBe(503);
      expect(await down.json()).toEqual({
        started: false,
        reason: "unavailable",
      });
    } finally {
      logged.mockRestore();
    }
  });
});

describe("bearerMatches", () => {
  it("matches the exact bearer and nothing else", () => {
    expect(bearerMatches("Bearer abc", "abc")).toBe(true);
    expect(bearerMatches("Bearer abd", "abc")).toBe(false);
    expect(bearerMatches("Bearer ab", "abc")).toBe(false);
    expect(bearerMatches("Bearer abcd", "abc")).toBe(false);
    expect(bearerMatches(null, "abc")).toBe(false);
  });
});
