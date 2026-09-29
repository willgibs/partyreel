/**
 * THE HELD DOOR'S CHECK-IN (the doors, event-settings r1, `waiting=held`): one word, `waiting`, `in` or
 * `moved`, from the page's own question (the account, this browser's cookie, the held ticket), so the
 * check-in and the refreshed page never disagree.
 *
 *   ★ `in` ONLY WHERE THE REFRESH OPENS THE ALBUM: let in (or the host). A door that lets her on to a
 *     password step without having let her in is `moved`, never "You're in".
 *   ★ ANYTHING ELSE IS `moved`: a door that shut, a turned-away newcomer, a link that is gone.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DoorStanding } from "@/lib/event/door/decide";

const getEventByQrToken = vi.fn();
const checkInAtDoor = vi.fn();
const doorCallerFor = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...args: unknown[]) => getEventByQrToken(...args),
}));
vi.mock("@/lib/db/queries/event-doors", () => ({
  checkInAtDoor: (...args: unknown[]) => checkInAtDoor(...args),
}));
vi.mock("@/lib/events/closed-door.server", () => ({
  doorCallerFor: (...args: unknown[]) => doorCallerFor(...args),
}));

const { POST } = await import("@/app/api/guests/door/route");

const TOKEN = "qr-token-1234";
const TICKET = "d".repeat(64);

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/guests/door", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function standing(over: Partial<DoorStanding>): DoorStanding {
  return {
    found: true,
    door: "approve",
    host: false,
    blocked: false,
    wasIn: false,
    in: false,
    waiting: false,
    listed: false,
    confirmed: true,
    ...over,
  };
}

async function answer(body: unknown = { qr_token: TOKEN }) {
  const res = await post(body);
  return {
    status: res.status,
    cache: res.headers.get("cache-control"),
    body: (await res.json()) as { ok: boolean; standing?: string },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: { id: "event-1", visibility: "private" },
  });
  doorCallerFor.mockResolvedValue({ userId: "user-sam", tickets: [TICKET] });
  checkInAtDoor.mockResolvedValue(standing({ waiting: true }));
});

describe("the check-in's one word", () => {
  it("still waiting on the host: `waiting`, never cached", async () => {
    expect(await answer()).toEqual({
      status: 200,
      cache: "private, no-store",
      body: { ok: true, standing: "waiting" },
    });
  });

  it("★ let in: `in`", async () => {
    checkInAtDoor.mockResolvedValue(standing({ in: true, wasIn: true }));
    expect((await answer()).body.standing).toBe("in");
  });

  it("★ a door that turned Public admitted her: `in`", async () => {
    checkInAtDoor.mockResolvedValue(
      standing({ door: "open", in: true, wasIn: true }),
    );
    expect((await answer()).body.standing).toBe("in");
  });

  it("★ a password now stands first and she was never let in: `moved`, never the beat", async () => {
    checkInAtDoor.mockResolvedValue(standing({ door: "password", waiting: true }));
    expect((await answer()).body.standing).toBe("moved");
  });

  it("turned away, the door shut, or the link gone: `moved`", async () => {
    checkInAtDoor.mockResolvedValue(standing({ blocked: true }));
    expect((await answer()).body.standing).toBe("moved");
    checkInAtDoor.mockResolvedValue(standing({ door: "private" }));
    expect((await answer()).body.standing).toBe("moved");
    checkInAtDoor.mockResolvedValue(standing({ door: "closed" }));
    expect((await answer()).body.standing).toBe("moved");
    getEventByQrToken.mockResolvedValue({ ok: false, code: "not_found" });
    expect((await answer()).body.standing).toBe("moved");
  });

  it("no doors' schema yet: `moved`, onto today's doors", async () => {
    checkInAtDoor.mockResolvedValue(null);
    expect((await answer()).body.standing).toBe("moved");
  });
});

describe("who checks in", () => {
  it("★ the page's own question: the held ticket beside the account and this browser's cookie", async () => {
    await answer({ qr_token: TOKEN, session_token: TICKET });
    expect(doorCallerFor).toHaveBeenCalledWith("event-1", {
      bodyTokens: [TICKET],
    });
    expect(checkInAtDoor).toHaveBeenCalledWith("event-1", {
      userId: "user-sam",
      tickets: [TICKET],
    });
  });

  it("a malformed body is a 400, and nothing is read or stamped", async () => {
    expect((await answer("{nope")).status).toBe(400);
    expect((await answer({ session_token: TICKET })).status).toBe(400);
    expect(getEventByQrToken).not.toHaveBeenCalled();
    expect(checkInAtDoor).not.toHaveBeenCalled();
  });
});
