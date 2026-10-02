/**
 * ★ EVERY APP'S REQUESTS STILL GET THE ANSWERS ITS WORKER GAVE.
 *
 * This Worker is one deployment that every app posts to: launch-prep's alias and partyreel.com, whatever
 * milestone each runs. The Orchestrator deploys it once, so nothing an older app sends may get a
 * different answer. These tests replay those apps' requests, byte for byte, at the Worker each was built
 * against and at today's, and hold every answer equal: status, every header, the body's own bytes, and
 * every object read. Milestone 29's app (`git show milestone-29:src/lib/export/export-service.ts` and
 * `.../use-export-download.ts`) against the Worker it shipped (vendored verbatim in `./milestone-29/`);
 * milestones 30 to 32's apps, which add the check (`export-walk.ts`), against the Worker they shipped
 * with (`./milestone-31/`). What `export-ends` adds is asked for by the token alone (a report address),
 * which no older app signs: their answers never move, and today's app's tokens still stream at both.
 *
 * The token is not re-derived here: `M29_TOKEN` is the string milestone 29's signer produced
 * (node:crypto HMAC-SHA256 hex over base64url(JSON), the payload in export-service.ts's key order),
 * pasted with its secret and payload, so the replay carries that app's exact bytes. Its `exp` is far
 * off, and the clock is frozen short of it (which also pins the zip's file dates, so two runs agree).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import today from "./index";
import m29 from "./milestone-29/index";
import m31 from "./milestone-31/index";
import { createFakeBucket, type FakeBucket } from "./testing/fake-bucket";
import { payloadOf, signToken } from "./testing/sign";

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

type Worker = {
  fetch(request: Request, env: never, ctx?: never): Promise<Response>;
};
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

/**
 * The same request, sent fresh to each Worker over its own copy of the bucket. Today's gets a live
 * execution context too, as the runtime hands it one, so an answer that reached for a report would
 * show here: none may (`reported` stays empty).
 */
async function bothAnswer(
  make: () => Request,
  objects: Record<string, string>,
  env: Partial<Env> = {},
  old: Worker = m29 as Worker,
) {
  const oldBucket = createFakeBucket(objects);
  const newBucket = createFakeBucket(objects);
  const base = { EXPORT_SIGNING_SECRET: SECRET, ...env };
  const before = await answer(old, make(), {
    ...base,
    PRIMARY: oldBucket,
  });
  const waiting: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => void waiting.push(p) };
  const res = await (today as Worker).fetch(
    make(),
    { ...base, PRIMARY: newBucket } as never,
    ctx as never,
  );
  const after = {
    status: res.status,
    headers: [...res.headers.entries()].sort(),
    body: new Uint8Array(await res.arrayBuffer()),
  };
  await Promise.all(waiting);
  return { before, after, oldBucket, newBucket, reported: waiting };
}

const ALL = {
  [KEYS[0]]: "a photograph",
  [KEYS[1]]: "another photograph",
  [KEYS[2]]: "a clip",
};

/** Every request today's Worker makes of the world: none, for an older app's token. */
let outbound: string[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  outbound = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      outbound.push(String(url));
      return new Response(null, { status: 204 });
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  expect(outbound).toEqual([]);
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
    expect(Object.keys(await import("./milestone-31/index"))).toEqual([
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

/** Milestones 30 to 32's check, as `export-walk.ts` sends it: the token as the whole text/plain body. */
const walkCheck =
  (token: string, init: RequestInit = {}) =>
  () =>
    new Request(`${WORKER_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: token,
      ...init,
    });

describe("milestones 30 to 32's app, replayed at both Workers", () => {
  const old = m31 as Worker;

  it("a whole album, a short one and an emptied one: the same zips, byte for byte", async () => {
    for (const objects of [ALL, { [KEYS[0]]: "a photograph" }, {}]) {
      const { before, after, oldBucket, newBucket, reported } =
        await bothAnswer(m29FormPost(M29_TOKEN), objects, {}, old);
      expect(before.status).toBe(200);
      expect(after).toEqual(before);
      expect(newBucket.calls).toEqual(oldBucket.calls);
      expect(reported).toEqual([]);
    }
  });

  it("the check of a whole album, a short one and an emptied one: the same counts, no word of reports", async () => {
    for (const objects of [ALL, { [KEYS[2]]: "a clip" }, {}]) {
      const { before, after, oldBucket, newBucket, reported } =
        await bothAnswer(walkCheck(M29_TOKEN), objects, {}, old);
      expect(before.status).toBe(200);
      expect(after).toEqual(before);
      expect(new TextDecoder().decode(after.body)).not.toContain("reports");
      expect(newBucket.calls).toEqual(oldBucket.calls);
      expect(reported).toEqual([]);
    }
  });

  it.each([
    [
      "a preflight",
      () =>
        new Request(`${WORKER_URL}/check`, {
          method: "OPTIONS",
          headers: { "Access-Control-Request-Method": "POST" },
        }),
      204,
    ],
    ["a GET", () => new Request(`${WORKER_URL}/check`), 405],
    [
      "a forged token",
      walkCheck(M29_TOKEN.slice(0, -1) + (M29_TOKEN.endsWith("9") ? "8" : "9")),
      403,
    ],
    ["an empty body", walkCheck(""), 403],
    [
      "an expired token",
      () => {
        vi.setSystemTime(1_900_000_000_001);
        return walkCheck(M29_TOKEN)();
      },
      403,
    ],
  ])("%s at the check: the same answer", async (_, make, status) => {
    const { before, after, newBucket } = await bothAnswer(make, ALL, {}, old);
    expect(before.status).toBe(status);
    expect(after).toEqual(before);
    expect(newBucket.calls).toEqual([]);
  });

  it("a paused Worker's check and stream: the same 503s", async () => {
    for (const make of [walkCheck(M29_TOKEN), m29FormPost(M29_TOKEN)]) {
      const { before, after } = await bothAnswer(
        make,
        ALL,
        { EXPORT_MODE: "off" },
        old,
      );
      expect(before.status).toBe(503);
      expect(after).toEqual(before);
    }
  });

  it("a check whose bucket is down: the same 502", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = () => {
      const bucket = createFakeBucket(ALL);
      bucket.failing = true;
      return bucket;
    };
    const base = { EXPORT_SIGNING_SECRET: SECRET };
    const before = await answer(old, walkCheck(M29_TOKEN)(), {
      ...base,
      PRIMARY: failing(),
    });
    const after = await answer(today as Worker, walkCheck(M29_TOKEN)(), {
      ...base,
      PRIMARY: failing(),
    });
    expect(before.status).toBe(502);
    expect(after).toEqual(before);
    error.mockRestore();
  });
});

describe("today's app, reaching an older Worker (the deploy may come after the app)", () => {
  /** Today's signer, asking for reports: the payload grows one field, the token stays v1. */
  const asking = () =>
    signToken(SECRET, {
      ...payloadOf(M29_TOKEN),
      report: "https://app.example/api/export/report",
    });

  it("its token still streams at milestone 29's and 31's Workers, the same zip as before", async () => {
    for (const old of [m29, m31] as Worker[]) {
      const res = await old.fetch(m29FormPost(await asking())(), {
        PRIMARY: createFakeBucket(ALL),
        EXPORT_SIGNING_SECRET: SECRET,
      } as never);
      expect(res.status).toBe(200);
      const plain = await old.fetch(m29FormPost(M29_TOKEN)(), {
        PRIMARY: createFakeBucket(ALL),
        EXPORT_SIGNING_SECRET: SECRET,
      } as never);
      expect(new Uint8Array(await res.arrayBuffer())).toEqual(
        new Uint8Array(await plain.arrayBuffer()),
      );
    }
  });

  it("milestone 31's check never promises reports, so the walk never waits for one", async () => {
    const res = await (m31 as Worker).fetch(walkCheck(await asking())(), {
      PRIMARY: createFakeBucket(ALL),
      EXPORT_SIGNING_SECRET: SECRET,
    } as never);
    expect(await res.json()).toEqual({
      ok: true,
      items: 3,
      found: 3,
      missing: [],
    });
  });
});
