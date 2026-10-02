/**
 * THE DAILY HEARTBEAT (`heartbeat.ts`): the Worker reads its bucket and signs what it found to the first app
 * that takes it, so a Worker that stopped, lost its bucket or its secret reads Missed or Failed in the portal.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { beat, heartbeatAddresses } from "./heartbeat";
import worker from "./index";
import { createFakeBucket } from "./testing/fake-bucket";
import { readReport } from "./testing/sign";

const SECRET = "heartbeat-test-secret";
const PROD = "https://partyreel.com/api/export/report";
const ALIAS =
  "https://partyreel-git-launch-prep-partyreel.vercel.app/api/export/report";
const NOW = 1_900_000_000_000;

type Sent = { url: string; body: string };
let sent: Sent[] = [];
let answers: number[] = [];

beforeEach(() => {
  sent = [];
  answers = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      sent.push({ url, body: String(init.body) });
      return new Response(null, { status: answers.shift() ?? 204 });
    }),
  );
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** A heartbeat off the wire, its MAC the report domain's under the app's secret. */
const decode = async (wire: string) => {
  const { report, signed } = await readReport(SECRET, wire);
  expect(signed).toBe(true);
  return report;
};

describe("the heartbeat", () => {
  it("reads the bucket and hands the app a signed beat", async () => {
    const bucket = createFakeBucket({});
    const taken = await beat(
      {
        PRIMARY: bucket,
        EXPORT_SIGNING_SECRET: SECRET,
        HEARTBEAT_URLS: `${PROD} ${ALIAS}`,
      },
      NOW,
    );
    expect(taken).toBe(true);
    expect(bucket.calls).toEqual([{ op: "list", key: "events/" }]);
    expect(sent.map((s) => s.url)).toEqual([PROD]);
    expect(await decode(sent[0].body)).toEqual({
      v: 1,
      kind: "heartbeat",
      at: NOW,
      mode: "on",
      r2: "ok",
    });
  });

  it("falls back to the next address while the first has no report path (partyreel.com before this lane)", async () => {
    answers = [404, 204];
    const taken = await beat({
      PRIMARY: createFakeBucket({}),
      EXPORT_SIGNING_SECRET: SECRET,
      HEARTBEAT_URLS: `${PROD} ${ALIAS}`,
    });
    expect(taken).toBe(true);
    expect(sent.map((s) => s.url)).toEqual([PROD, ALIAS]);
  });

  it("says a bucket it could not read, and a switch that is off", async () => {
    const bucket = createFakeBucket({});
    bucket.failing = true;
    await beat({
      PRIMARY: bucket,
      EXPORT_SIGNING_SECRET: SECRET,
      EXPORT_MODE: "off",
      HEARTBEAT_URLS: PROD,
    });
    expect(await decode(sent[0].body)).toMatchObject({
      mode: "off",
      r2: "error",
    });
  });

  it("with nobody taking it, or no secret to sign with, it logs and the portal goes Missed", async () => {
    answers = [500];
    expect(
      await beat({
        PRIMARY: createFakeBucket({}),
        EXPORT_SIGNING_SECRET: SECRET,
        HEARTBEAT_URLS: PROD,
      }),
    ).toBe(false);
    expect(
      await beat({ PRIMARY: createFakeBucket({}), HEARTBEAT_URLS: PROD }),
    ).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("goes only where a report may go", () => {
    expect(
      heartbeatAddresses(
        ` ${PROD}  http://partyreel.com/api/export/report https://evil.example/x ${ALIAS} `,
      ),
    ).toEqual([PROD, ALIAS]);
    expect(heartbeatAddresses(undefined)).toEqual([]);
  });

  it("is the Worker's scheduled handler, carried past the trigger by waitUntil", async () => {
    const waiting: Promise<unknown>[] = [];
    await (
      worker as unknown as {
        scheduled(c: unknown, e: unknown, x: unknown): Promise<void>;
      }
    ).scheduled(
      {},
      {
        PRIMARY: createFakeBucket({}),
        EXPORT_SIGNING_SECRET: SECRET,
        HEARTBEAT_URLS: PROD,
      },
      { waitUntil: (p: Promise<unknown>) => void waiting.push(p) },
    );
    expect(waiting).toHaveLength(1);
    await Promise.all(waiting);
    expect(sent).toHaveLength(1);
  });
});
