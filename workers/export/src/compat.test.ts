/**
 * ★ PARTYREEL.COM'S REQUESTS STILL GET MILESTONE 29'S ANSWERS.
 *
 * This Worker is one deployment that two apps post to: launch-prep's, and partyreel.com's (the
 * milestone-29 app, whose export code is `git show milestone-29:src/lib/export/export-service.ts` and
 * `.../use-export-download.ts`). The Orchestrator deploys it once, so nothing that app sends may get
 * a different answer. These tests replay that app's requests, byte for byte, at the Worker milestone
 * 29 shipped (vendored verbatim in `./milestone-29/`) and at today's, and hold every answer equal:
 * status, every header, and the zip's own bytes.
 *
 * The token is not re-derived here: `M29_TOKEN` is the string milestone 29's signer produced
 * (node:crypto HMAC-SHA256 hex over base64url(JSON), the payload in export-service.ts's key order),
 * pasted with its secret and payload, so the replay carries that app's exact bytes. Its `exp` is far
 * off, and the clock is frozen short of it (which also pins the zip's file dates, so two runs agree).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import today from "./index";
import m29 from "./milestone-29/index";
import { createFakeBucket, type FakeBucket } from "./testing/fake-bucket";

const SECRET = "m29-replay-secret-not-a-real-one";
const E = "0c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
const KEYS = [
  `events/${E}/photo/11111111-2222-4333-8444-555555555555/original.jpg`,
  `events/${E}/photo/66666666-7777-4888-9999-aaaaaaaaaaaa/original.heic`,
  `events/${E}/video/bbbbbbbb-cccc-4ddd-8eee-ffffffffffff/original.mov`,
];
/** Milestone 29's signer's output for the payload above (see the file's header). */
const M29_TOKEN =
  "eyJ2IjoxLCJqdGkiOiJtMjktcmVwbGF5Iiwic2NvcGUiOiJndWVzdCIsImV2ZW50SWQiOiIwYzFkMmUzZi00YTViLTRjNmQtOGU3Zi05YTBiMWMyZDNlNGYiLCJ6aXBOYW1lIjoiZ2FyZGVuLXBhcnR5LnppcCIsIml0ZW1zIjpbeyJrZXkiOiJldmVudHMvMGMxZDJlM2YtNGE1Yi00YzZkLThlN2YtOWEwYjFjMmQzZTRmL3Bob3RvLzExMTExMTExLTIyMjItNDMzMy04NDQ0LTU1NTU1NTU1NTU1NS9vcmlnaW5hbC5qcGciLCJuYW1lIjoiZ2FyZGVuLXBhcnR5LTExMTExMTExLmpwZyJ9LHsia2V5IjoiZXZlbnRzLzBjMWQyZTNmLTRhNWItNGM2ZC04ZTdmLTlhMGIxYzJkM2U0Zi9waG90by82NjY2NjY2Ni03Nzc3LTQ4ODgtOTk5OS1hYWFhYWFhYWFhYWEvb3JpZ2luYWwuaGVpYyIsIm5hbWUiOiJnYXJkZW4tcGFydHktNjY2NjY2NjYuaGVpYyJ9LHsia2V5IjoiZXZlbnRzLzBjMWQyZTNmLTRhNWItNGM2ZC04ZTdmLTlhMGIxYzJkM2U0Zi92aWRlby9iYmJiYmJiYi1jY2NjLTRkZGQtOGVlZS1mZmZmZmZmZmZmZmYvb3JpZ2luYWwubW92IiwibmFtZSI6ImdhcmRlbi1wYXJ0eS1iYmJiYmJiYi5tb3YifV0sImV4cCI6MTkwMDAwMDAwMDAwMH0.bb87bf342f94975cf664d70f0522493a03cf6b6569dc2f28e5474687b1b52109";
const NOW = 1_899_999_000_000;

/** The deployed Worker's address, as the app's EXPORT_WORKER_URL names it (the form's action). */
const WORKER_URL = "https://partyreel-export.example.workers.dev";

type Worker = { fetch(request: Request, env: never): Promise<Response> };
type Env = {
  PRIMARY: FakeBucket;
  EXPORT_SIGNING_SECRET: string;
  EXPORT_MODE?: string;
};

/**
 * Milestone 29's `postToWorker`: a top-level form, method POST, one hidden input `t`, submitted with
 * the form's default encoding (application/x-www-form-urlencoded).
 */
const m29FormPost =
  (token: string, url = WORKER_URL) =>
  () =>
    new Request(url, {
      method: "POST",
      body: new URLSearchParams({ t: token }),
    });

async function answer(worker: Worker, request: Request, env: Env) {
  const res = await worker.fetch(request, env as never);
  return {
    status: res.status,
    headers: [...res.headers.entries()].sort(),
    body: new Uint8Array(await res.arrayBuffer()),
  };
}

/** The same request, sent fresh to each Worker over its own copy of the bucket. */
async function bothAnswer(
  make: () => Request,
  objects: Record<string, string>,
  env: Partial<Env> = {},
) {
  const oldBucket = createFakeBucket(objects);
  const newBucket = createFakeBucket(objects);
  const base = { EXPORT_SIGNING_SECRET: SECRET, ...env };
  const before = await answer(m29 as Worker, make(), {
    ...base,
    PRIMARY: oldBucket,
  });
  const after = await answer(today as Worker, make(), {
    ...base,
    PRIMARY: newBucket,
  });
  return { before, after, oldBucket, newBucket };
}

const ALL = {
  [KEYS[0]]: "a photograph",
  [KEYS[1]]: "another photograph",
  [KEYS[2]]: "a clip",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("milestone 29's app, replayed at both Workers", () => {
  it("a whole album: the same 200, the same headers, the same zip, byte for byte", async () => {
    const { before, after, oldBucket, newBucket } = await bothAnswer(
      m29FormPost(M29_TOKEN),
      ALL,
    );
    expect(before.status).toBe(200);
    expect(after).toEqual(before);
    expect(after.headers).toContainEqual([
      "content-disposition",
      'attachment; filename="garden-party.zip"',
    ]);
    // A real archive, its three files named inside: a local file header up front.
    expect([...after.body.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const inside = new TextDecoder().decode(after.body);
    for (const name of [
      "garden-party-11111111.jpg",
      "garden-party-66666666.heic",
      "garden-party-bbbbbbbb.mov",
    ])
      expect(inside).toContain(name);
    // Read in the token's order, one object at a time, by both.
    expect(newBucket.calls).toEqual(oldBucket.calls);
  });

  it("a zip with one object gone: both skip it the same way", async () => {
    const { before, after } = await bothAnswer(m29FormPost(M29_TOKEN), {
      [KEYS[0]]: "a photograph",
      [KEYS[2]]: "a clip",
    });
    expect(before.status).toBe(200);
    expect(after).toEqual(before);
  });

  it("a zip with every object gone: both still send the (empty) zip milestone 29 sent", async () => {
    const { before, after } = await bothAnswer(m29FormPost(M29_TOKEN), {});
    expect(before.status).toBe(200);
    expect(after).toEqual(before);
  });

  it("the same form posted to any other path streams as it always did", async () => {
    const { before, after } = await bothAnswer(
      m29FormPost(M29_TOKEN, `${WORKER_URL}/some/path`),
      ALL,
    );
    expect(before.status).toBe(200);
    expect(after).toEqual(before);
  });

  it("a multipart form is read the same way", async () => {
    const make = () => {
      const form = new FormData();
      form.set("t", M29_TOKEN);
      return new Request(WORKER_URL, { method: "POST", body: form });
    };
    const { before, after } = await bothAnswer(make, ALL);
    expect(before.status).toBe(200);
    expect(after).toEqual(before);
  });

  it.each([
    [
      "an expired token",
      () => {
        vi.setSystemTime(1_900_000_000_001);
        return m29FormPost(M29_TOKEN)();
      },
      403,
    ],
    [
      "a tampered MAC",
      m29FormPost(
        M29_TOKEN.slice(0, -1) + (M29_TOKEN.endsWith("9") ? "8" : "9"),
      ),
      403,
    ],
    [
      "a form with no t",
      () =>
        new Request(WORKER_URL, {
          method: "POST",
          body: new URLSearchParams({ x: "1" }),
        }),
      403,
    ],
    ["a GET", () => new Request(WORKER_URL), 405],
    [
      "a body that is not a form",
      () =>
        new Request(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ t: M29_TOKEN }),
        }),
      400,
    ],
  ])("%s: the same refusal, word for word", async (_, make, status) => {
    const { before, after, newBucket } = await bothAnswer(make, ALL);
    expect(before.status).toBe(status);
    expect(after).toEqual(before);
    expect(newBucket.calls).toEqual([]);
  });

  it("the redeploy kill switch pauses both the same way", async () => {
    const { before, after } = await bothAnswer(m29FormPost(M29_TOKEN), ALL, {
      EXPORT_MODE: "off",
    });
    expect(before.status).toBe(503);
    expect(after).toEqual(before);
  });
});

describe("the deployment itself", () => {
  it("exports its handler and nothing else, or workerd refuses to start", async () => {
    // Every named export of the entry module is read as an entrypoint; a constant there failed
    // `wrangler dev` outright while a dry-run build passed (check.ts holds the constants).
    expect(Object.keys(await import("./index"))).toEqual(["default"]);
    expect(Object.keys(await import("./milestone-29/index"))).toEqual([
      "default",
    ]);
  });
});

describe("today's app, reaching a Worker from before the check", () => {
  it("its check is refused at once by milestone 29's Worker, reading nothing", async () => {
    const bucket = createFakeBucket(ALL);
    const res = await (m29 as Worker).fetch(
      new Request(`${WORKER_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: M29_TOKEN,
      }),
      { PRIMARY: bucket, EXPORT_SIGNING_SECRET: SECRET } as never,
    );
    expect(res.status).toBe(400);
    // No Access-Control-Allow-Origin: the browser's fetch fails, and the app goes on to the zip.
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    expect(bucket.calls).toEqual([]);
  });

  it("a token today's app signs is still one milestone 29's Worker streams", async () => {
    // Today's app signs the same v1 payload (it adds nothing to the token), so M29_TOKEN stands
    // for it; the part and the Yours set live in the zip's name and its items, never in the format.
    const bucket = createFakeBucket(ALL);
    const res = await (m29 as Worker).fetch(m29FormPost(M29_TOKEN)(), {
      PRIMARY: bucket,
      EXPORT_SIGNING_SECRET: SECRET,
    } as never);
    expect(res.status).toBe(200);
  });
});
