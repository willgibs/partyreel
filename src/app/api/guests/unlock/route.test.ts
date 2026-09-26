/**
 * THE UNLOCK ROUTE SIGNS FOR THE PASSWORD STATE IT READ BEFORE THE CHECK (unlock-cookie.ts's ★).
 *
 * A host can change the password while a guest's unlock is in flight. Read after the bcrypt match,
 * the new state would be signed for a guess against the old one; read before it, the race can only
 * fail closed. Pinned here with the change landing INSIDE the check, both ways: the guest typed the
 * old word (the check refuses) or the new one (the cookie carries the old version and is refused on
 * its first read). Plus the plain paths: a cookie that opens the album, a wrong password counted by
 * the limiter, and an unreadable state answered as an outage rather than a wrong password.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const SECRET = "test-unlock-secret-please-rotate";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  serverEnv: { UNLOCK_COOKIE_SECRET: "test-unlock-secret-please-rotate" },
  assertUnlockEnv: () => ({
    UNLOCK_COOKIE_SECRET: "test-unlock-secret-please-rotate",
  }),
}));

// The NEXT request's cookie jar, for asking isUnlocked what the issued cookie opens.
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
  }),
}));

const limiter = vi.hoisted(() => ({
  recordUnlockFailure: vi.fn(async () => {}),
  clearUnlockFailures: vi.fn(async () => {}),
}));
vi.mock("@/lib/security/unlock-rate-limit-store", () => ({
  unlockHashes: () => ({ tokenHash: "token-hash", ipHash: "ip-hash" }),
  checkUnlockRate: async () => ({ allowed: true, retryAfterSec: 0 }),
  recordUnlockFailure: limiter.recordUnlockFailure,
  clearUnlockFailures: limiter.clearUnlockFailures,
}));

const captureError = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureError: (...args: unknown[]) => captureError(...args),
  captureWarning: vi.fn(),
}));

const db = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(db.fake as FakePostgrest),
}));

const { POST } = await import("@/app/api/guests/unlock/route");
const { isUnlocked } = await import("@/lib/events/unlock-cookie");

const EVENT = "11111111-1111-1111-1111-111111111111";
const TOKEN = "tok_event";

/** A stand-in bcrypt: the stored hash names its password and a salt, as crypt() output would. */
const hashOf = (password: string, salt: string) => `$2a$06$${salt}:${password}`;

/** What to do inside the check, before it answers: where a host's change lands mid-unlock. */
let duringCheck: (() => void) | null = null;

function seed(event: FakeRow) {
  db.fake = createFakePostgrest({
    tables: { events: [event] },
    rpc: {
      // verify_event_password, as the SQL has it: the event id on a match against the CURRENT
      // hash of a live password event on this link, else null.
      verify_event_password: (args) => {
        duringCheck?.();
        const row = db.fake?.tables.events.find(
          (e) => e.qr_token === args.p_qr_token && e.deleted_at === null,
        );
        if (!row || row.visibility !== "password" || !row.event_password_hash)
          return null;
        const stored = String(row.event_password_hash);
        return stored.slice(stored.indexOf(":") + 1) === args.p_password
          ? row.id
          : null;
      },
    },
  });
}

function event(): FakeRow {
  const row = db.fake?.tables.events[0];
  if (!row) throw new Error("no event");
  return row;
}

function unlockRequest(password: string) {
  return POST(
    new Request("http://localhost/api/guests/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qr_token: TOKEN, password }),
    }),
  );
}

/** Carry the response's cookie to the next request, the way the browser does. */
function keepCookie(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  const match = /pr_unlock_([^=]+)=([^;]+)/.exec(header);
  if (match) jar.set(`pr_unlock_${match[1]}`, match[2]);
  return header;
}

beforeEach(() => {
  duringCheck = null;
  jar.clear();
  captureError.mockClear();
  limiter.recordUnlockFailure.mockClear();
  limiter.clearUnlockFailures.mockClear();
  seed({
    id: EVENT,
    qr_token: TOKEN,
    visibility: "password",
    event_password_hash: hashOf("first-word", "salt1"),
    deleted_at: null,
  });
});

describe("POST /api/guests/unlock", () => {
  it("sets a cookie that opens the album, until the password changes", async () => {
    const response = await unlockRequest("first-word");
    expect(response.status).toBe(200);
    const header = keepCookie(response);
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/Path=\//);
    expect(await isUnlocked(EVENT)).toBe(true);
    expect(limiter.clearUnlockFailures).toHaveBeenCalledWith("ip-hash");

    // The host sets a new password (a fresh salt, even for the same word): everyone is out.
    event().event_password_hash = hashOf("first-word", "salt2");
    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("answers a wrong password with the generic 401 and counts it", async () => {
    const response = await unlockRequest("wrong");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      code: "wrong_password",
    });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(limiter.recordUnlockFailure).toHaveBeenCalledWith(
      "token-hash",
      "ip-hash",
    );
  });

  it("★ a change landing mid-unlock, the guest typing the OLD word: the check refuses", async () => {
    duringCheck = () => {
      event().event_password_hash = hashOf("second-word", "salt2");
    };
    const response = await unlockRequest("first-word");
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("★ a change landing mid-unlock, the guest typing the NEW word: the cookie is for the state read before, and is refused", async () => {
    duringCheck = () => {
      event().event_password_hash = hashOf("second-word", "salt2");
    };
    const response = await unlockRequest("second-word");
    // The check matched the new hash, so the route answers ok; what it signed is the old version.
    expect(response.status).toBe(200);
    keepCookie(response);
    expect(await isUnlocked(EVENT)).toBe(false);

    // Typed again, with nothing in flight, the new word unlocks.
    duringCheck = null;
    keepCookie(await unlockRequest("second-word"));
    expect(await isUnlocked(EVENT)).toBe(true);
  });

  it("answers an unreadable password state as an outage: no cookie, no counted failure", async () => {
    db.fake = createFakePostgrest({
      tables: { events: [] },
      urlLengthLimit: 10,
    });
    const response = await unlockRequest("first-word");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, code: "unavailable" });
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(limiter.recordUnlockFailure).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(
      "security",
      expect.any(Error),
      expect.objectContaining({ phase: "unlock_state_read" }),
    );
  });

  it("keeps the generic 401 for a link with no password event behind it", async () => {
    const response = await POST(
      new Request("http://localhost/api/guests/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qr_token: "tok_nobody", password: "anything" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      code: "wrong_password",
    });
  });

  it("signs with the configured secret (a cookie from another secret opens nothing)", async () => {
    // Guard against a test that passes because verify and sign share a mistake: forge with a
    // different secret, in the exact format, and it must not open the album.
    const { createHmac, createHash } = await import("node:crypto");
    const exp = Date.now() + 60_000;
    const version = createHash("sha256")
      .update(String(event().event_password_hash))
      .digest("hex");
    const mac = createHmac("sha256", `${SECRET}-other`)
      .update(`${EVENT}.${exp}.${version}`)
      .digest("hex");
    jar.set(`pr_unlock_${EVENT}`, `${EVENT}.${exp}.${mac}`);
    expect(await isUnlocked(EVENT)).toBe(false);
  });
});
