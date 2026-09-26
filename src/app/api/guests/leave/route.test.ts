/**
 * PUTTING THE TICKET DOWN, one event's or every one.
 *
 * The guest page's sign-out runs in the browser, which cannot read an HttpOnly cookie to name the
 * tickets it holds, so it asks for all of them; the route expires exactly the `pr_guest_*` names the
 * request carried and nothing of any other family (the signed unlock, the tile size).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEventByQrToken = vi.fn();
let jar: { name: string; value: string }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => jar.find((c) => c.name === name),
    getAll: () => jar,
  }),
}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));

const { POST } = await import("@/app/api/guests/leave/route");

const EVENT_A = "33333333-3333-4333-8333-333333333333";
const EVENT_B = "55555555-5555-4555-8555-555555555555";
const TICKET = "a".repeat(64);

function leave(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** Every Set-Cookie on the response, as `name -> the whole header line`. */
function expired(res: Response): Map<string, string> {
  const lines = res.headers.getSetCookie();
  return new Map(lines.map((line) => [line.slice(0, line.indexOf("=")), line]));
}

beforeEach(() => {
  vi.clearAllMocks();
  jar = [
    { name: `pr_guest_${EVENT_A}`, value: TICKET },
    { name: `pr_guest_${EVENT_B}`, value: TICKET },
    { name: `pr_unlock_${EVENT_A}`, value: "signed" },
    { name: "pr_tile_size", value: "medium" },
    { name: "sb-project-auth-token", value: "jwt" },
  ];
  getEventByQrToken.mockResolvedValue({ ok: true, data: { id: EVENT_A } });
});

describe("{ all: true }: the sign-out's", () => {
  it("★ expires EVERY guest ticket cookie the browser sent, and only those", async () => {
    const res = await leave({ all: true });
    expect(res.status).toBe(200);
    const writes = expired(res);
    expect([...writes.keys()].sort()).toEqual(
      [`pr_guest_${EVENT_A}`, `pr_guest_${EVENT_B}`].sort(),
    );
    for (const line of writes.values()) {
      expect(line).toContain("Max-Age=0");
      expect(line).toContain("Path=/");
      expect(line.toLowerCase()).toContain("httponly");
    }
  });

  it("needs no event lookup and answers ok with nothing to expire", async () => {
    jar = [];
    const res = await leave({ all: true });
    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie()).toEqual([]);
    expect(getEventByQrToken).not.toHaveBeenCalled();
  });

  it("is never cacheable", async () => {
    const res = await leave({ all: true });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("{ qr_token }: that one event's ticket", () => {
  it("expires that event's ticket alone", async () => {
    const res = await leave({ qr_token: "qr-token-1" });
    expect([...expired(res).keys()]).toEqual([`pr_guest_${EVENT_A}`]);
  });

  it("a dead link answers ok and expires nothing (no existence oracle)", async () => {
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    const res = await leave({ qr_token: "qr-dead" });
    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie()).toEqual([]);
  });
});

describe("the body", () => {
  it("400s anything else: no token and no `all`, or `all` that is not true", async () => {
    for (const body of [{}, { all: false }, { all: "yes" }, { qr_token: "" }]) {
      expect((await leave(body)).status).toBe(400);
    }
  });
});
