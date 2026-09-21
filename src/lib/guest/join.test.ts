// @contract-for: src/lib/guest/join.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkDisplayName, joinEvent, renameGuest } from "./join";

/**
 * THE DOOR'S TWO CALLS (the identity reshape, 2026-09-21).
 *
 * What is pinned is the TRANSLATION, because every surface above this module
 * decides what to do from the refusal's KIND and nothing else: a name refused
 * in place, a session refused because the host flipped their switch, and a
 * network that simply is not there all have to arrive as different things.
 * Copy is not pinned: the server's own sentence is passed through on purpose,
 * so it can improve without this file arguing about it.
 */
function respond(status: number, body: unknown) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("checkDisplayName", () => {
  it("refuses an empty field as name_required, never as a complaint", () => {
    const result = checkDisplayName("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("name_required");
  });

  it("refuses a RESERVED name in place, before a round trip", () => {
    const result = checkDisplayName("Partyreel");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("name_invalid");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("trims what it accepts, so the row stores what the album shows", () => {
    const result = checkDisplayName("  Sam  ");
    expect(result).toEqual({ ok: true, name: "Sam" });
  });
});

describe("joinEvent", () => {
  it("omits display_name entirely when none is given (the silent join)", async () => {
    respond(200, { ok: true, session_token: "tok", verified: true });
    await joinEvent({ qrToken: "qr1" });
    const body = JSON.parse(
      (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({ qr_token: "qr1" });
  });

  it("carries the name, and hands back the row's OWN name and proof", async () => {
    respond(200, {
      ok: true,
      session_token: "tok",
      display_name: "Sam",
      verified: false,
    });
    const result = await joinEvent({ qrToken: "qr1", displayName: "Sam" });
    expect(result).toEqual({
      ok: true,
      guest: { sessionToken: "tok", displayName: "Sam", verified: false },
    });
  });

  it("maps the route's 422 kinds, and keeps the server's own sentence", async () => {
    for (const kind of [
      "name_required",
      "name_invalid",
      "verification_required",
    ] as const) {
      respond(422, { ok: false, code: kind, message: `said: ${kind}` });
      const result = await joinEvent({ qrToken: "qr1", displayName: "Sam" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.refusal.kind).toBe(kind);
        expect(result.refusal.message).toBe(`said: ${kind}`);
      }
    }
  });

  it("reads an unknown code as `other`, so a new refusal can never be mistaken for a name problem", async () => {
    respond(429, { ok: false, code: "rate_limited", message: "Too many." });
    const result = await joinEvent({ qrToken: "qr1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.refusal.kind).toBe("other");
      expect(result.refusal.message).toBe("Too many.");
    }
  });

  it("survives a dead network and an HTML error page alike", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));
    const offline = await joinEvent({ qrToken: "qr1" });
    expect(offline.ok).toBe(false);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response);
    const proxied = await joinEvent({ qrToken: "qr1" });
    expect(proxied.ok).toBe(false);
    if (!proxied.ok) expect(proxied.refusal.kind).toBe("other");
  });
});

describe("renameGuest", () => {
  it("sends the token in the BODY, never a URL", async () => {
    respond(200, { ok: true, display_name: "Sam" });
    await renameGuest({
      qrToken: "qr1",
      sessionToken: "secret-token",
      displayName: "Sam",
    });
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/name");
    expect(String(url)).not.toContain("secret-token");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: "qr1",
      session_token: "secret-token",
      display_name: "Sam",
    });
  });

  it("maps a refusal the same way the join does", async () => {
    respond(422, { ok: false, code: "name_invalid", message: "Nope." });
    const result = await renameGuest({
      qrToken: "qr1",
      sessionToken: "tok",
      displayName: "admin",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("name_invalid");
  });
});
