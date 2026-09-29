/**
 * THE CHECK, WHAT A TOKEN'S ZIP WOULD HOLD (`check.ts`), and its door (`POST /check` in index.ts).
 *
 * The app asks it before the browser takes the file, so an empty zip is refused in one line, a
 * short one is counted, and a token this Worker would refuse is said in the app's toast instead of
 * replacing the page. It reads no object's bytes: a small folder is asked key by key, a big one
 * from its listing, which stops once it passes the last key it needs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CHECK_PATH, checkItems, HEAD_GROUP_MAX, mediaIdOf } from "./check";
import worker from "./index";
import {
  EXPORT_TOKEN_VERSION,
  type ExportManifestPayload,
} from "./export-token";
import { createFakeBucket } from "./testing/fake-bucket";

const E = "11111111-1111-4111-8111-111111111111";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const photo = (n: number) => `events/${E}/photo/${uuid(n)}/original.jpg`;
const video = (n: number) => `events/${E}/video/${uuid(n)}/original.mp4`;
const item = (key: string) => ({ key, name: `${mediaIdOf(key)}.jpg` });

describe("checkItems", () => {
  it("counts a whole zip, asking a small folder key by key", async () => {
    const keys = [photo(1), photo(2), video(3)];
    const bucket = createFakeBucket(
      Object.fromEntries(keys.map((k) => [k, "x"])),
    );
    const result = await checkItems(bucket, keys.map(item));
    expect(result).toEqual({ items: 3, found: 3, missing: [] });
    expect(bucket.calls.every((c) => c.op === "head")).toBe(true);
    expect(bucket.calls.some((c) => c.op === "get")).toBe(false);
  });

  it("names what a short zip would miss, in the token's order", async () => {
    const keys = [photo(1), photo(2), video(3), photo(4)];
    const bucket = createFakeBucket({ [photo(1)]: "x", [video(3)]: "x" });
    const result = await checkItems(bucket, keys.map(item));
    expect(result).toEqual({
      items: 4,
      found: 2,
      missing: [uuid(2), uuid(4)],
    });
  });

  it("finds nothing at all in an empty one", async () => {
    const keys = [photo(1), video(2)];
    const result = await checkItems(createFakeBucket({}), keys.map(item));
    expect(result).toEqual({ items: 2, found: 0, missing: [uuid(1), uuid(2)] });
  });

  it("reads a big folder from its listing, a thousand keys a call, never key by key", async () => {
    // 2,500 photographs with previews beside them (5,000 objects), 1,999 of them asked for.
    const objects: Record<string, string> = {};
    for (let i = 0; i < 2500; i++) {
      objects[photo(i)] = "x";
      objects[`events/${E}/photo/${uuid(i)}/preview.webp`] = "p";
    }
    const bucket = createFakeBucket(objects);
    const wanted = Array.from({ length: 1999 }, (_, i) => photo(i + 1));
    bucket.objects.delete(photo(700));
    const result = await checkItems(bucket, wanted.map(item));
    expect(result.found).toBe(1998);
    expect(result.missing).toEqual([uuid(700)]);
    expect(bucket.calls.every((c) => c.op === "list")).toBe(true);
    // The listing stops at the page that reaches the last key asked for (uuid 1999 sorts in the
    // fourth thousand of 5,000 keys), never walking the folder to its end.
    expect(bucket.calls.length).toBe(4);
  });

  it("asks at most a folder's worth of heads, and lists past the threshold", async () => {
    const small = Array.from({ length: HEAD_GROUP_MAX }, (_, i) => photo(i));
    const bucket = createFakeBucket(
      Object.fromEntries(small.map((k) => [k, "x"])),
    );
    await checkItems(bucket, small.map(item));
    expect(bucket.calls.filter((c) => c.op === "head")).toHaveLength(
      HEAD_GROUP_MAX,
    );

    const big = Array.from({ length: HEAD_GROUP_MAX + 1 }, (_, i) => photo(i));
    const listed = createFakeBucket(
      Object.fromEntries(big.map((k) => [k, "x"])),
    );
    await checkItems(listed, big.map(item));
    expect(listed.calls.map((c) => c.op)).toEqual(["list"]);
  });

  it("stops as soon as the client leaves", async () => {
    const keys = Array.from({ length: 30 }, (_, i) => photo(i));
    const bucket = createFakeBucket(
      Object.fromEntries(keys.map((k) => [k, "x"])),
    );
    const gone = new AbortController();
    gone.abort();
    await expect(
      checkItems(bucket, keys.map(item), gone.signal),
    ).rejects.toThrow("The client left");
    expect(bucket.calls).toEqual([]);
  });

  it("throws when R2 cannot answer, so the door can say so", async () => {
    const bucket = createFakeBucket({ [photo(1)]: "x" });
    bucket.failing = true;
    await expect(checkItems(bucket, [item(photo(1))])).rejects.toThrow(
      "R2 is unavailable",
    );
  });
});

/* ── the door ────────────────────────────────────────────────────────────── */

const SECRET = "check-door-secret";
const NOW = 1_800_000_000_000;
const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: ExportManifestPayload, secret = SECRET) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, enc.encode(body)),
  );
  return `${body}.${[...mac].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

const payload = (keys: string[]): ExportManifestPayload => ({
  v: EXPORT_TOKEN_VERSION,
  jti: "door",
  scope: "guest",
  eventId: E,
  zipName: "garden.zip",
  items: keys.map(item),
  exp: NOW + 60_000,
});

const URL_ = `https://partyreel-export.example.workers.dev${CHECK_PATH}`;

function ask(body: string, init: RequestInit = {}) {
  return new Request(URL_, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body,
    ...init,
  });
}

async function send(
  request: Request,
  objects: Record<string, string>,
  env = {},
) {
  const bucket = createFakeBucket(objects);
  const res = await worker.fetch(request, {
    PRIMARY: bucket,
    EXPORT_SIGNING_SECRET: SECRET,
    ...env,
  } as never);
  const text = await res.text();
  return {
    res,
    bucket,
    body: text ? (JSON.parse(text) as Record<string, unknown>) : null,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("POST /check", () => {
  it("answers what the zip would hold, readable from any origin, and reads no bytes", async () => {
    const keys = [photo(1), photo(2)];
    const { res, body, bucket } = await send(ask(await sign(payload(keys))), {
      [photo(1)]: "x",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({ ok: true, items: 2, found: 1, missing: [uuid(2)] });
    expect(bucket.calls.some((c) => c.op === "get")).toBe(false);
  });

  it("refuses a token it would not stream, in words the app can read", async () => {
    const forged = await sign(payload([photo(1)]), "another-secret");
    const { res, body, bucket } = await send(ask(forged), { [photo(1)]: "x" });
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(body).toEqual({ ok: false, reason: "forbidden" });
    expect(bucket.calls).toEqual([]);
  });

  it("refuses an expired token", async () => {
    const token = await sign(payload([photo(1)]));
    vi.setSystemTime(NOW + 61_000);
    const { res } = await send(ask(token), { [photo(1)]: "x" });
    expect(res.status).toBe(403);
  });

  it("says the kill switch is on rather than checking", async () => {
    const { res, body } = await send(
      ask(await sign(payload([photo(1)]))),
      {},
      {
        EXPORT_MODE: "off",
      },
    );
    expect(res.status).toBe(503);
    expect(body).toEqual({ ok: false, reason: "paused" });
  });

  it("an empty body is a forbidden token, never a check", async () => {
    const { res, bucket } = await send(ask(""), { [photo(1)]: "x" });
    expect(res.status).toBe(403);
    expect(bucket.calls).toEqual([]);
  });

  it("says R2 could not answer, so the app goes ahead without it", async () => {
    const request = ask(await sign(payload([photo(1)])));
    const bucket = createFakeBucket({ [photo(1)]: "x" });
    bucket.failing = true;
    const res = await worker.fetch(request, {
      PRIMARY: bucket,
      EXPORT_SIGNING_SECRET: SECRET,
    } as never);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, reason: "unavailable" });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("answers a preflight, and refuses any other method", async () => {
    const pre = await worker.fetch(
      new Request(URL_, { method: "OPTIONS" }),
      {} as never,
    );
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe("*");
    expect(pre.headers.get("access-control-allow-methods")).toContain("POST");
    const got = await worker.fetch(new Request(URL_), {} as never);
    expect(got.status).toBe(405);
  });

  it("never streams: a zip's own form posted to /check is only ever checked", async () => {
    const token = await sign(payload([photo(1)]));
    const { res, bucket } = await send(
      new Request(URL_, {
        method: "POST",
        body: new URLSearchParams({ t: token }),
      }),
      { [photo(1)]: "x" },
    );
    // The body "t=<token>" is not a token, so it is refused; nothing is ever read as a zip.
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(bucket.calls).toEqual([]);
  });
});
