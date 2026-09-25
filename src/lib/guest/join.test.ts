import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  attachGuestEmail,
  checkDisplayName,
  checkGuestEmail,
  joinEvent,
  renameGuest,
} from "./join";

/**
 * THE DOOR'S THREE CALLS.
 *
 * What is pinned is the TRANSLATION, because every surface above this module
 * decides what to do from the refusal's KIND and nothing else: a name refused
 * in place, an ADDRESS refused in place under its own field, a session refused
 * because the host flipped their switch, and a network that simply is not there
 * all have to arrive as different things. Copy is not pinned: the server's own
 * sentence is passed through on purpose, so it can improve without this file
 * arguing about it.
 *
 * ★ ONE PIN IS A PRIVACY RULE RATHER THAN A TRANSLATION: both routes answer
 * with a BOOLEAN, and nothing here ever hands an address back. A `JoinedGuest`
 * that carried one would be an address some surface could render.
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

describe("checkGuestEmail", () => {
  // The whole point of the field: skipping it is an ANSWER, not a mistake.
  it("reads a blank field as no address, never as a refusal", () => {
    expect(checkGuestEmail("   ")).toEqual({ ok: true, email: null });
  });

  it("trims and lowercases, so the row and this device agree on one string", () => {
    expect(checkGuestEmail("  Sam@Example.COM ")).toEqual({
      ok: true,
      email: "sam@example.com",
    });
  });

  it("refuses junk as email_invalid, in its own kind and before a round trip", () => {
    const result = checkGuestEmail("sam@@example");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("email_invalid");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refuses an address past the column's own 254", () => {
    const long = `${"a".repeat(250)}@example.com`;
    const result = checkGuestEmail(long);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("email_invalid");
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
      guest: {
        sessionToken: "tok",
        displayName: "Sam",
        verified: false,
        emailAttached: false,
      },
    });
  });

  // The optional address. Absent, not null: a guest who declined the field
  // mentions no address at all, so the body carries no `email` key.
  it("omits `email` entirely when none was typed", async () => {
    respond(200, { ok: true, session_token: "tok", display_name: "Sam" });
    await joinEvent({ qrToken: "qr1", displayName: "Sam" });
    const body = JSON.parse(
      (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toEqual({ qr_token: "qr1", display_name: "Sam" });
    expect("email" in body).toBe(false);
  });

  it("carries `email` when one was typed, in ONE post beside the name", async () => {
    respond(200, {
      ok: true,
      session_token: "tok",
      display_name: "Sam",
      email_attached: true,
    });
    const result = await joinEvent({
      qrToken: "qr1",
      displayName: "Sam",
      email: "sam@example.com",
    });
    expect(vi.mocked(global.fetch).mock.calls).toHaveLength(1);
    expect(
      JSON.parse(
        (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
      ),
    ).toEqual({
      qr_token: "qr1",
      display_name: "Sam",
      email: "sam@example.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.guest.emailAttached).toBe(true);
  });

  // ★ THE ROW'S ANSWER WINS OVER WHAT WAS TYPED. A verified-required event and
  // a confirmed session both null the field before the insert, so the door has
  // to believe `email_attached` rather than its own memory of the form.
  it("reads emailAttached from the ROW, never from the request", async () => {
    respond(200, { ok: true, session_token: "tok", display_name: "Sam" });
    const result = await joinEvent({
      qrToken: "qr1",
      displayName: "Sam",
      email: "sam@example.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.guest.emailAttached).toBe(false);
  });

  it("never hands an address back, whatever the route says", async () => {
    respond(200, {
      ok: true,
      session_token: "tok",
      display_name: "Sam",
      email_attached: true,
      // A route that regressed and echoed the address must not reach a surface.
      email: "sam@example.com",
    });
    const result = await joinEvent({
      qrToken: "qr1",
      displayName: "Sam",
      email: "sam@example.com",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.stringify(result.guest)).not.toContain("sam@example.com");
    }
  });

  it("maps the route's 422 kinds, and keeps the server's own sentence", async () => {
    for (const kind of [
      "name_required",
      "name_invalid",
      "email_invalid",
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

  // A held session names its row: a dead token and a verified row keep their
  // own kinds, because collapsed into `other` they would be indistinguishable
  // from a rate limit or a dropped link, and a nameless session's own rename
  // attempt would look identical to any other failure instead of the one case
  // `guest-name-step.tsx` needs to fall back to a fresh join on.
  it("keeps invalid_session and unauthorized as their own kinds, never collapsed to other", async () => {
    for (const [status, kind] of [
      [401, "invalid_session"],
      [403, "unauthorized"],
    ] as const) {
      respond(status, { ok: false, code: kind, message: `said: ${kind}` });
      const result = await renameGuest({
        qrToken: "qr1",
        sessionToken: "tok",
        displayName: "Sam",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.refusal.kind).toBe(kind);
        expect(result.refusal.message).toBe(`said: ${kind}`);
      }
    }
  });
});

describe("attachGuestEmail", () => {
  it("sends the token in the BODY, never a URL, with the address beside it", async () => {
    respond(200, { ok: true, email_attached: true });
    const result = await attachGuestEmail({
      qrToken: "qr1",
      sessionToken: "secret-token",
      email: "sam@example.com",
    });
    const [url, init] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("/api/guests/email");
    expect(String(url)).not.toContain("secret-token");
    expect(String(url)).not.toContain("sam@example.com");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      qr_token: "qr1",
      session_token: "secret-token",
      email: "sam@example.com",
    });
    expect(result).toEqual({ ok: true, emailAttached: true });
  });

  // The detach arm, which the dashboard's "Not mine" and a later "Remove your
  // email" both ride. An EXPLICIT null, unlike the join's absent key: here the
  // caller is asking for the address to go, which is a different act from not
  // mentioning it.
  it("sends an explicit null to take one off, and reads back false", async () => {
    respond(200, { ok: true, email_attached: false });
    const result = await attachGuestEmail({
      qrToken: "qr1",
      sessionToken: "tok",
      email: null,
    });
    expect(
      JSON.parse(
        (vi.mocked(global.fetch).mock.calls[0][1] as RequestInit).body as string,
      ).email,
    ).toBeNull();
    expect(result).toEqual({ ok: true, emailAttached: false });
  });

  it("maps a refusal the same way the join does, kind by kind", async () => {
    for (const [status, kind] of [
      [422, "email_invalid"],
      [401, "invalid_session"],
      [403, "unauthorized"],
    ] as const) {
      respond(status, { ok: false, code: kind, message: `said: ${kind}` });
      const result = await attachGuestEmail({
        qrToken: "qr1",
        sessionToken: "tok",
        email: "sam@example.com",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.refusal.kind).toBe(kind);
        expect(result.refusal.message).toBe(`said: ${kind}`);
      }
    }
  });

  it("survives a dead network with the door's own sentence", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("offline"));
    const result = await attachGuestEmail({
      qrToken: "qr1",
      sessionToken: "tok",
      email: "sam@example.com",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.refusal.kind).toBe("other");
  });
});
