/**
 * A TOKEN THAT ASKS FOR REPORTS (`export-ends`), end to end through the Worker's own `fetch`: the check
 * says it will report and the app hears its count; the stream never sends an empty zip (a 204 keeps the
 * album page), says when it began, and says how it ended: every byte out (`saved`), objects gone mid-way
 * (`short`, by id), the client leaving (`stopped`) or an object read breaking it (`failed`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker from "./index";
import { createFakeBucket, type FakeBucket } from "./testing/fake-bucket";
import { readReport, signToken, until } from "./testing/sign";

const SECRET = "stream-test-secret";
const NOW = 1_899_999_000_000;
const WORKER_URL = "https://partyreel-export.example.workers.dev";
const REPORT_URL = "https://app.example/api/export/report";
const E = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const IDS = [
  "11111111-2222-4333-8444-555555555555",
  "66666666-7777-4888-9999-aaaaaaaaaaaa",
  "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff",
];
const KEYS = [
  `events/${E}/photo/${IDS[0]}/original.jpg`,
  `events/${E}/photo/${IDS[1]}/original.heic`,
  `events/${E}/video/${IDS[2]}/original.mov`,
];
const ALL = {
  [KEYS[0]]: "a photograph",
  [KEYS[1]]: "another photograph",
  [KEYS[2]]: "a clip",
};
const JTI = "0123456789abcdef0123456789abcdef";

/** The app's signer, as `src/lib/export/export-token.ts` signs. */
function sign(extra: Record<string, unknown> = {}): Promise<string> {
  return signToken(SECRET, {
    v: 1,
    jti: JTI,
    scope: "guest",
    eventId: E,
    zipName: "garden-party.zip",
    items: KEYS.map((key, i) => ({ key, name: `garden-party-${i}.bin` })),
    exp: NOW + 120_000,
    ...extra,
  });
}

type Sent = { url: string; report: Record<string, unknown>; signed: boolean };

function harness(bucket: FakeBucket) {
  const wires: { url: string; wire: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      wires.push({ url, wire: String(init.body) });
      return new Response(null, { status: 204 });
    }),
  );
  const waiting: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (p: Promise<unknown>) => void waiting.push(p),
    passThroughOnException: () => {},
  };
  const env = { PRIMARY: bucket, EXPORT_SIGNING_SECRET: SECRET };
  const send = (request: Request) =>
    (
      worker as unknown as {
        fetch(r: Request, e: unknown, c: unknown): Promise<Response>;
      }
    ).fetch(request, env, ctx);
  /** The reports sent so far, read off the wire. */
  const drainSoFar = (): Promise<Sent[]> =>
    Promise.all(
      wires.map(async ({ url, wire }) => ({
        url,
        ...(await readReport(SECRET, wire)),
      })),
    );
  /** Let every report the Worker handed to waitUntil go out, then read them all. */
  const drain = async (): Promise<Sent[]> => {
    await Promise.all(waiting);
    return drainSoFar();
  };
  return { wires, send, drain, drainSoFar };
}

const post = (token: string, signal?: AbortSignal) =>
  new Request(WORKER_URL, {
    method: "POST",
    body: new URLSearchParams({ t: token }),
    signal,
  });

const kinds = (sent: Sent[]) => sent.map((s) => s.report.kind);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the check, for a token that asks", () => {
  it("says it will report, and the app hears the count", async () => {
    const h = harness(createFakeBucket({ [KEYS[0]]: "a", [KEYS[2]]: "c" }));
    const res = await h.send(
      new Request(`${WORKER_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: await sign({ report: REPORT_URL }),
      }),
    );
    expect(await res.json()).toEqual({
      ok: true,
      items: 3,
      found: 2,
      missing: [IDS[1]],
      reports: true,
    });
    expect(await h.drain()).toEqual([
      {
        url: REPORT_URL,
        signed: true,
        report: { v: 1, kind: "check", jti: JTI, at: NOW, items: 3, found: 2 },
      },
    ]);
  });

  it("reports a bucket that could not answer, and still answers as before", async () => {
    const bucket = createFakeBucket(ALL);
    bucket.failing = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const h = harness(bucket);
    const res = await h.send(
      new Request(`${WORKER_URL}/check`, {
        method: "POST",
        body: await sign({ report: REPORT_URL }),
      }),
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ ok: false, reason: "unavailable" });
    expect((await h.drain())[0].report).toEqual({
      v: 1,
      kind: "check",
      jti: JTI,
      at: NOW,
      items: 3,
      error: "unavailable",
    });
  });

  it("an address it will not post to is no ask: the answer and the silence of before", async () => {
    const h = harness(createFakeBucket(ALL));
    const res = await h.send(
      new Request(`${WORKER_URL}/check`, {
        method: "POST",
        body: await sign({ report: "http://app.example/api/export/report" }),
      }),
    );
    expect(await res.json()).toEqual({
      ok: true,
      items: 3,
      found: 3,
      missing: [],
    });
    expect(await h.drain()).toEqual([]);
  });
});

describe("the stream, for a token that asks", () => {
  it("sends the same zip an unasked token gets, says it began, and says saved at the last byte", async () => {
    const unasked = harness(createFakeBucket(ALL));
    const before = new Uint8Array(
      await (await unasked.send(post(await sign()))).arrayBuffer(),
    );

    const h = harness(createFakeBucket(ALL));
    const res = await h.send(post(await sign({ report: REPORT_URL })));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="garden-party.zip"',
    );
    // Nothing read yet, so nothing has ended: only the start goes.
    await until(() => h.wires.length > 0);
    expect(kinds(await h.drainSoFar())).toEqual(["start"]);

    const zip = new Uint8Array(await res.arrayBuffer());
    expect(zip).toEqual(before);
    expect((await h.drain()).map((s) => s.report)).toEqual([
      { v: 1, kind: "start", jti: JTI, at: NOW },
      {
        v: 1,
        kind: "end",
        jti: JTI,
        at: NOW,
        outcome: "saved",
        files: 3,
        missing: [],
      },
    ]);
  });

  it("an object gone between the check and the stream is skipped and named: short", async () => {
    const h = harness(createFakeBucket({ [KEYS[0]]: "a", [KEYS[2]]: "c" }));
    const res = await h.send(post(await sign({ report: REPORT_URL })));
    await res.arrayBuffer();
    expect((await h.drain()).at(-1)?.report).toMatchObject({
      kind: "end",
      outcome: "short",
      files: 2,
      missing: [IDS[1]],
    });
  });

  it("a first object gone starts the zip at the next one, and counts it", async () => {
    const h = harness(createFakeBucket({ [KEYS[1]]: "b", [KEYS[2]]: "c" }));
    const res = await h.send(post(await sign({ report: REPORT_URL })));
    const inside = new TextDecoder().decode(await res.arrayBuffer());
    expect(inside).not.toContain("garden-party-0.bin");
    expect(inside).toContain("garden-party-1.bin");
    expect((await h.drain()).at(-1)?.report).toMatchObject({
      outcome: "short",
      files: 2,
      missing: [IDS[0]],
    });
  });

  it("★ an album emptied after its check sends no file: a 204 keeps her on the page, and says empty", async () => {
    const bucket = createFakeBucket({});
    const h = harness(bucket);
    const res = await h.send(post(await sign({ report: REPORT_URL })));
    expect(res.status).toBe(204);
    expect(res.headers.get("content-disposition")).toBeNull();
    expect(await res.text()).toBe("");
    // Every object asked once, in order, and nothing else.
    expect(bucket.calls).toEqual(KEYS.map((key) => ({ op: "get", key })));
    expect((await h.drain()).map((s) => s.report)).toEqual([
      {
        v: 1,
        kind: "end",
        jti: JTI,
        at: NOW,
        outcome: "empty",
        files: 0,
        missing: IDS,
      },
    ]);
  });

  it("the client leaving mid-way is stopped, and the zip that never closed holds none of them", async () => {
    const big = new Uint8Array(256 * 1024);
    const h = harness(
      createFakeBucket({ [KEYS[0]]: big, [KEYS[1]]: big, [KEYS[2]]: big }),
    );
    const leave = new AbortController();
    const res = await h.send(
      post(await sign({ report: REPORT_URL }), leave.signal),
    );
    const reader = res.body!.getReader();
    await reader.read();
    leave.abort();
    await reader.cancel("she left");
    expect((await h.drain()).at(-1)?.report).toMatchObject({
      kind: "end",
      outcome: "stopped",
      missing: IDS,
    });
  });

  it("an object read that breaks mid-way is failed, every id missing", async () => {
    const bucket = createFakeBucket(ALL);
    const get = bucket.get.bind(bucket);
    bucket.get = async (key) => {
      if (key === KEYS[1]) throw new Error("R2 hiccup");
      return get(key);
    };
    const h = harness(bucket);
    const res = await h.send(post(await sign({ report: REPORT_URL })));
    await expect(res.arrayBuffer()).rejects.toThrow();
    expect((await h.drain()).at(-1)?.report).toMatchObject({
      outcome: "failed",
      files: 1,
      missing: IDS,
    });
  });

  it("an address it will not post to streams as before, unreported, and still sends an empty zip", async () => {
    const h = harness(createFakeBucket({}));
    const res = await h.send(
      post(await sign({ report: "https://app.example/api/export/host" })),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    await res.arrayBuffer();
    expect(await h.drain()).toEqual([]);
  });
});
