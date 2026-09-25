/**
 * ★ AN UNLOCK ANSWERS TO THE PASSWORD IT WAS EARNED UNDER (unlock-cookie.ts). The server half,
 * with its three inputs stood in: the secret (`@/lib/env`), the request's cookies (`next/headers`)
 * and the event's stored password state (the in-memory PostgREST behind `createAdminClient`).
 *
 * What is pinned: a password change or a clear signs out a cookie earned before it; a cookie
 * minted before the version existed is refused; the version read fails CLOSED and says so; no
 * cookie costs no read; and, because every caller asks `isUnlocked(eventId)` and nothing else can
 * sign, verify or read the cookie (the last block), "refused here" is "refused everywhere the
 * helper answers": the guest page, the gallery poll, the export, the album reads, the guest uploads.
 */
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const SECRET = "test-unlock-secret-please-rotate";

const env = vi.hoisted(() => ({
  serverEnv: { UNLOCK_COOKIE_SECRET: "" as string | undefined },
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  serverEnv: env.serverEnv,
  assertUnlockEnv: () => {
    if (!env.serverEnv.UNLOCK_COOKIE_SECRET) throw new Error("unset");
    return { UNLOCK_COOKIE_SECRET: env.serverEnv.UNLOCK_COOKIE_SECRET };
  },
}));

// The request's cookie jar, as `cookies()` hands it to a server read. Each call is a NEW request's
// store unless a test pins one (`request.store`): Next resolves `cookies()` to one object for a
// request's whole life, which is what the per-request memo keys on.
const jar = vi.hoisted(() => new Map<string, string>());
const request = vi.hoisted(() => ({ store: null as object | null }));
function cookieStore() {
  return {
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
  };
}
vi.mock("next/headers", () => ({
  cookies: async () => request.store ?? cookieStore(),
}));

const captureWarning = vi.fn();
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => captureWarning(...args),
  captureError: vi.fn(),
}));

const db = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(db.fake as FakePostgrest),
}));

const { isUnlocked, readUnlockStateByToken, signUnlock } =
  await import("@/lib/events/unlock-cookie");

const EVENT = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
// Two bcrypt hashes of one event's password, before and after the host changed it. (A re-set of
// the SAME word salts afresh too, so it is also a new hash: the live check shows it.)
const HASH_1 = "$2a$06$abcdefghijklmnopqrstuuJ5x9o0wB0M8tqzSx3v1dW5c8i2n0mJe";
const HASH_2 = "$2a$06$zyxwvutsrqponmlkjihgfeQq6kqg2Yf3cT0n7ZrYpF0sL1uV9aBcS";

function eventRow(overrides: FakeRow = {}): FakeRow {
  return {
    id: EVENT,
    qr_token: "tok_event",
    visibility: "password",
    event_password_hash: HASH_1,
    deleted_at: null,
    ...overrides,
  };
}

function seed(...rows: FakeRow[]) {
  db.fake = createFakePostgrest({ tables: { events: rows } });
}

function storedEvent(id = EVENT): FakeRow {
  const row = db.fake?.tables.events.find((e) => e.id === id);
  if (!row) throw new Error(`no event ${id}`);
  return row;
}

/** Unlock the way the route does: read the state, sign for it, and hand the cookie to the jar. */
async function unlock(qrToken = "tok_event") {
  const state = await readUnlockStateByToken(qrToken);
  if (!state) throw new Error(`no password state behind ${qrToken}`);
  const cookie = signUnlock(state);
  jar.set(cookie.name, cookie.value);
  return cookie;
}

beforeEach(() => {
  env.serverEnv.UNLOCK_COOKIE_SECRET = SECRET;
  request.store = null;
  jar.clear();
  captureWarning.mockClear();
  seed(eventRow());
});

describe("isUnlocked, bound to the password", () => {
  it("unlocks under the password it was earned under", async () => {
    const cookie = await unlock();
    expect(cookie.name).toBe(`pr_unlock_${EVENT}`);
    expect(await isUnlocked(EVENT)).toBe(true);
  });

  it("★ a password change signs out a cookie earned under the old one", async () => {
    await unlock();
    expect(await isUnlocked(EVENT)).toBe(true);

    storedEvent().event_password_hash = HASH_2;

    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("★ a cleared password unlocks nothing, and a new one does not revive the old cookie", async () => {
    await unlock();

    storedEvent().event_password_hash = null;
    storedEvent().visibility = "open";
    expect(await isUnlocked(EVENT)).toBe(false);

    storedEvent().event_password_hash = HASH_2;
    storedEvent().visibility = "password";
    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("★ refuses a cookie signed before the version existed (the {eid,exp} MAC)", async () => {
    const exp = Date.now() + 60_000;
    const body = `${EVENT}.${exp}`;
    jar.set(
      `pr_unlock_${EVENT}`,
      `${body}.${createHmac("sha256", SECRET).update(body).digest("hex")}`,
    );
    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("never opens another event with this event's cookie, even renamed onto it", async () => {
    seed(
      eventRow(),
      eventRow({
        id: OTHER,
        qr_token: "tok_other",
        event_password_hash: HASH_1,
      }),
    );
    const cookie = await unlock("tok_event");
    jar.set(`pr_unlock_${OTHER}`, cookie.value);
    expect(await isUnlocked(OTHER)).toBe(false);
  });

  it("unlocks nothing on a deleted event", async () => {
    await unlock();
    storedEvent().deleted_at = "2026-09-25T00:00:00.000Z";
    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("costs no read at all without a cookie", async () => {
    expect(await isUnlocked(EVENT)).toBe(false);
    expect(db.fake?.requests).toEqual([]);
  });

  it("fails closed without the secret", async () => {
    await unlock();
    env.serverEnv.UNLOCK_COOKIE_SECRET = undefined;
    expect(await isUnlocked(EVENT)).toBe(false);
  });

  it("fails CLOSED on an unreadable password state, and reports it", async () => {
    await unlock();
    // Every request past this length fails the way a dead connection does.
    db.fake = createFakePostgrest({
      tables: { events: [eventRow()] },
      urlLengthLimit: 10,
    });
    expect(await isUnlocked(EVENT)).toBe(false);
    expect(captureWarning).toHaveBeenCalledWith(
      "security",
      "unlock_password_state_unreadable",
      expect.objectContaining({ reason: expect.any(String) }),
    );
  });
});

/**
 * ONE VERSION READ PER REQUEST, route handlers included (measured before the memo: three per
 * gallery poll, five per album sync, per unlocked guest every 12 seconds). The memo is keyed on the
 * request's cookie store and dies with it, so the next request sees a change.
 */
describe("isUnlocked: one read per request", () => {
  const versionReads = () =>
    (db.fake?.requests ?? []).filter((r) => r.name === "events").length;

  it("★ answers every ask in one request from one read, and the next request reads again", async () => {
    await unlock();
    const readsBefore = versionReads();

    request.store = cookieStore();
    expect(await isUnlocked(EVENT)).toBe(true);
    expect(await isUnlocked(EVENT)).toBe(true);
    expect(await isUnlocked(EVENT)).toBe(true);
    expect(versionReads() - readsBefore).toBe(1);

    // The password changes mid-request: this request keeps its one answer...
    storedEvent().event_password_hash = HASH_2;
    expect(await isUnlocked(EVENT)).toBe(true);

    // ...and the very next request is signed out.
    request.store = cookieStore();
    expect(await isUnlocked(EVENT)).toBe(false);
    expect(versionReads() - readsBefore).toBe(2);
  });

  it("keeps each event's answer apart within one request", async () => {
    seed(
      eventRow(),
      eventRow({
        id: OTHER,
        qr_token: "tok_other",
        event_password_hash: HASH_2,
      }),
    );
    await unlock("tok_event");
    request.store = cookieStore();
    expect(await isUnlocked(EVENT)).toBe(true);
    expect(await isUnlocked(OTHER)).toBe(false);
  });

  it("reports an unreadable state once per request, however often it is asked", async () => {
    await unlock();
    db.fake = createFakePostgrest({
      tables: { events: [eventRow()] },
      urlLengthLimit: 10,
    });
    request.store = cookieStore();
    for (let i = 0; i < 4; i++) expect(await isUnlocked(EVENT)).toBe(false);
    expect(captureWarning).toHaveBeenCalledTimes(1);
  });

  it("fails closed, and reports, when the client cannot even be built", async () => {
    await unlock();
    db.fake = null; // asSupabase(null): the first `.from` throws, as a missing service key would.
    expect(await isUnlocked(EVENT)).toBe(false);
    expect(captureWarning).toHaveBeenCalledWith(
      "security",
      "unlock_password_state_unreadable",
      expect.anything(),
    );
  });
});

describe("readUnlockStateByToken (the unlock route's read, before the password check)", () => {
  it("names the event and a version that is never the hash itself", async () => {
    const state = await readUnlockStateByToken("tok_event");
    expect(state?.eventId).toBe(EVENT);
    expect(state?.passwordVersion).toMatch(/^[0-9a-f]{64}$/);
    expect(state?.passwordVersion).not.toContain(HASH_1);
  });

  it("answers null for a link with no live password event behind it", async () => {
    seed(
      eventRow({ id: OTHER, qr_token: "tok_open", event_password_hash: null }),
      eventRow({ qr_token: "tok_gone", deleted_at: "2026-09-25T00:00:00Z" }),
    );
    expect(await readUnlockStateByToken("tok_open")).toBeNull();
    expect(await readUnlockStateByToken("tok_gone")).toBeNull();
    expect(await readUnlockStateByToken("tok_nobody")).toBeNull();
  });

  it("throws on a failed read, so the route answers an error rather than signing blind", async () => {
    db.fake = createFakePostgrest({
      tables: { events: [eventRow()] },
      urlLengthLimit: 10,
    });
    await expect(readUnlockStateByToken("tok_event")).rejects.toThrow(
      /unlock state read/,
    );
  });

  it("★ a cookie signed for a state read before a change is refused after it (the route's race)", async () => {
    // The route reads the state, then the host changes the password, then the check passes (the
    // guest typed the NEW word) and the route signs for what it read: the stale version.
    const state = await readUnlockStateByToken("tok_event");
    storedEvent().event_password_hash = HASH_2;
    const cookie = signUnlock(state!);
    jar.set(cookie.name, cookie.value);
    expect(await isUnlocked(EVENT)).toBe(false);
  });
});

/**
 * ★ EVERY UNLOCK ANSWER IS isUnlocked's. The version binding holds everywhere only if nothing else
 * can sign, verify or even name the cookie: a module that trusted the cookie's presence, or checked
 * the MAC itself, would answer without the password version. So outside these two files no source
 * module may use the token functions or the cookie's name (prose in a comment is fine).
 */
describe("every unlock answer goes through isUnlocked", () => {
  const SRC = join(process.cwd(), "src");
  const OWNERS = [
    "src/lib/events/unlock-cookie.ts",
    "src/lib/events/unlock-token.ts",
  ];

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
  }

  /** The code without its comments, so a doc line naming the cookie is not a use of it. */
  function codeOf(path: string): string {
    return readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");
  }

  const files = sourceFiles(SRC).map((path) => ({
    rel: relative(process.cwd(), path),
    code: codeOf(path),
  }));

  it("finds the source tree it is guarding", () => {
    expect(files.length).toBeGreaterThan(500);
    expect(files.map((f) => f.rel)).toEqual(expect.arrayContaining(OWNERS));
  });

  it("★ no other module signs, verifies or names the unlock cookie", () => {
    const users = files
      .filter((f) =>
        /\b(verifyUnlockToken|signUnlockToken|unlockCookieName)\b|pr_unlock_/.test(
          f.code,
        ),
      )
      .map((f) => f.rel)
      .sort();
    expect(users).toEqual(OWNERS);
  });

  it("★ outside the unlock route, modules import only isUnlocked from the helper", () => {
    const importers = files.filter(
      (f) =>
        f.code.includes('"@/lib/events/unlock-cookie"') &&
        f.rel !== "src/app/api/guests/unlock/route.ts",
    );
    expect(importers.length).toBeGreaterThan(0);
    for (const f of importers) {
      const named =
        /import\s*{([^}]*)}\s*from\s*"@\/lib\/events\/unlock-cookie"/.exec(
          f.code,
        );
      expect(
        named?.[1]
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
        f.rel,
      ).toEqual(["isUnlocked"]);
    }
  });
});
