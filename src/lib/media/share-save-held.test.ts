import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import {
  HELD_MAX_ITEM_BYTES,
  LOW_AT_ONCE,
  PLAIN,
  PROGRESS_EVERY_MS,
  RELEASE_GRACE_MS,
  createHeldStore,
  presignExpired,
  type HeldStore,
} from "./share-save-held";

/**
 * THE HELD ORIGINAL'S LIFE, OVER A FETCH THE TEST ANSWERS BY HAND (save-speed).
 * What is held is what made Will's Save immediate: an original is downloaded
 * once and handed over as a file, the photograph on screen goes first, nothing a
 * slot let go of keeps downloading, memory stays inside its budget, and an
 * origin R2 will not answer turns the store off instead of failing every
 * photograph twice.
 */

type Answer = {
  chunk: (text: string) => void;
  end: () => void;
};

function fakeFetch() {
  const calls: {
    url: string;
    init: RequestInit;
    respond: (opts?: { length?: number; type?: string }) => Answer;
    refuse: () => void;
  }[] = [];
  const fetch = vi.fn(
    (url: string, init: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
        calls.push({
          url,
          init,
          respond(opts = {}) {
            let ctl!: ReadableStreamDefaultController<Uint8Array>;
            const body = new ReadableStream<Uint8Array>({
              start(c) {
                ctl = c;
              },
            });
            const headers = new Headers({
              "content-type": opts.type ?? "image/jpeg",
            });
            if (opts.length !== undefined)
              headers.set("content-length", String(opts.length));
            resolve(new Response(body, { status: 200, headers }));
            return {
              chunk: (text) => ctl.enqueue(new TextEncoder().encode(text)),
              end: () => ctl.close(),
            };
          },
          refuse: () => reject(new TypeError("Failed to fetch")),
        });
      }),
  );
  return { fetch, calls };
}

/** Lets every pending promise and zero-delay timer run. */
const settle = () => vi.advanceTimersByTimeAsync(0);

let net: ReturnType<typeof fakeFetch>;
let urls: {
  create: Mock<(blob: Blob) => string>;
  revoke: Mock<(url: string) => void>;
};
let store: HeldStore;

function makeStore(over: Partial<Parameters<typeof createHeldStore>[0]> = {}) {
  let n = 0;
  urls = {
    create: vi.fn((_: Blob) => `blob:held-${++n}`),
    revoke: vi.fn((_: string) => {}),
  };
  return createHeldStore({
    fetch: net.fetch as unknown as typeof fetch,
    createObjectURL: urls.create,
    revokeObjectURL: urls.revoke,
    ...over,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  net = fakeFetch();
  store = makeStore();
});
afterEach(() => {
  vi.useRealTimers();
});

const want = (id: string, priority: "high" | "low" = "high", url?: string) =>
  store.want(id, url ?? `https://r2.test/${id}.jpg`, {
    priority,
    name: `${id}.jpg`,
  });

describe("holding an original", () => {
  it("★ downloads it once and hands over the very file it draws", async () => {
    want("a");
    expect(store.get("a")?.kind).toBe("loading");
    expect(net.fetch).toHaveBeenCalledTimes(1);
    const waiting = store.whenHeld("a");
    const answer = net.calls[0].respond({ length: 6 });
    await settle();
    // The answer's length repaints at once; the bytes, at most every PROGRESS_EVERY_MS.
    expect(store.get("a")).toEqual({ kind: "loading", received: 0, total: 6 });
    answer.chunk("ab");
    await settle();
    expect(store.get("a")).toEqual({ kind: "loading", received: 0, total: 6 });
    await vi.advanceTimersByTimeAsync(PROGRESS_EVERY_MS);
    answer.chunk("c");
    await settle();
    expect(store.get("a")).toEqual({ kind: "loading", received: 3, total: 6 });
    answer.chunk("def");
    answer.end();
    await settle();
    const held = store.get("a");
    expect(held?.kind).toBe("held");
    if (held?.kind !== "held") return;
    expect(held.src).toBe("blob:held-1");
    expect(await held.file.text()).toBe("abcdef");
    expect(held.file.name).toBe("a.jpg");
    expect(await waiting).toBe(held.file);
    // A second want of the same photograph (its neighbour slot becoming the
    // centre, a re-minted link) asks for nothing more.
    want("a", "high", "https://r2.test/a.jpg?b=2");
    expect(net.fetch).toHaveBeenCalledTimes(1);
  });

  it("reads with CORS, past the HTTP cache, with the priority it was asked at", () => {
    want("a", "high");
    want("b", "low");
    expect(net.calls[0].init).toMatchObject({
      mode: "cors",
      cache: "no-store",
      priority: "high",
    });
    expect(net.calls).toHaveLength(1);
  });

  it("★ the photograph on screen first: a neighbour waits for it, then two at most at once", async () => {
    want("centre", "high");
    want("n1", "low");
    want("n2", "low");
    want("n3", "low");
    expect(net.calls.map((c) => c.url)).toEqual(["https://r2.test/centre.jpg"]);
    expect(store.get("n1")?.kind).toBe("waiting");
    const a = net.calls[0].respond({ length: 1 });
    a.chunk("x");
    a.end();
    await settle();
    expect(net.calls.map((c) => c.url.split("/").pop())).toEqual([
      "centre.jpg",
      "n1.jpg",
      "n2.jpg",
    ]);
    expect(net.calls).toHaveLength(1 + LOW_AT_ONCE);
    expect(net.calls[1].init.priority).toBe("low");
  });

  it("★ a neighbour that asks first in the same breath still waits for the centre", async () => {
    // A commit mounts the slots in track order: the left neighbour's want lands first.
    want("left", "low");
    want("centre", "high");
    await settle();
    expect(net.calls.map((c) => c.url.split("/").pop())).toEqual([
      "centre.jpg",
    ]);
  });

  it("a photograph that leaves the middle drops back to low: the new centre is the one waited on", async () => {
    const asCentre = want("a", "high");
    // The swipe: a's slot re-renders as a neighbour, b's as the centre.
    asCentre();
    want("a", "low");
    want("b", "high");
    want("c", "low");
    await settle();
    expect(net.calls.map((call) => call.url.split("/").pop())).toEqual([
      "a.jpg",
      "b.jpg",
    ]);
    const b = net.calls[1].respond({ length: 1 });
    b.chunk("x");
    b.end();
    await settle();
    // b held: the lows may go, a (still coming, low now) and c beside it.
    expect(net.calls.map((call) => call.url.split("/").pop())).toEqual([
      "a.jpg",
      "b.jpg",
      "c.jpg",
    ]);
  });

  it("a neighbour that becomes the centre goes at once", () => {
    want("centre", "high");
    want("n1", "low");
    expect(net.calls).toHaveLength(1);
    want("n1", "high");
    expect(net.calls.map((c) => c.url.split("/").pop())).toEqual([
      "centre.jpg",
      "n1.jpg",
    ]);
  });
});

describe("letting go", () => {
  it("★ a download nobody draws any more is aborted after the grace", async () => {
    const release = want("a");
    release();
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS - 1);
    expect(net.calls[0].init.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(net.calls[0].init.signal?.aborted).toBe(true);
    expect(store.get("a")).toBeNull();
  });

  it("a slot that re-mounts in the same breath keeps the download it had", async () => {
    const release = want("a", "low");
    release();
    want("a", "high");
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS * 2);
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(net.calls[0].init.signal?.aborted).toBe(false);
  });

  it("a release frees the queue: the next neighbour starts", async () => {
    const centre = want("centre", "high");
    want("n1", "low");
    centre();
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS);
    expect(net.calls.map((c) => c.url.split("/").pop())).toEqual([
      "centre.jpg",
      "n1.jpg",
    ]);
  });

  it("★ a held file nobody draws stays for a later visit, inside the budget, oldest out first", async () => {
    store = makeStore({ budgetBytes: 10, maxUnused: 24 });
    const hold = async (id: string, body: string) => {
      const release = want(id);
      const answer = net.calls.at(-1)!.respond({ length: body.length });
      answer.chunk(body);
      answer.end();
      await settle();
      return release;
    };
    (await hold("old", "123456"))();
    (await hold("new", "123456"))();
    // Twelve bytes unused over a ten-byte budget: the older one goes.
    expect(store.get("old")).toBeNull();
    expect(urls.revoke).toHaveBeenCalledWith("blob:held-1");
    expect(store.get("new")?.kind).toBe("held");
    // And a held file still drawn is never evicted, whatever the budget.
    const third = want("new");
    await hold("big", "1234567890ab");
    expect(store.get("new")?.kind).toBe("held");
    third();
  });

  it("whenHeld answers null when the photograph is let go, or its caller stops waiting", async () => {
    const release = want("a");
    const forgotten = store.whenHeld("a");
    release();
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS);
    expect(await forgotten).toBeNull();

    want("b");
    const ctl = new AbortController();
    const stopped = store.whenHeld("b", ctl.signal);
    ctl.abort();
    expect(await stopped).toBeNull();
    expect(await store.whenHeld("nobody")).toBeNull();
  });
});

describe("what it cannot hold is plain, and plain is the old path", () => {
  it("★ an original over the cap goes plain before a byte of it is held, and stays known", async () => {
    const release = want("big");
    net.calls[0].respond({ length: HELD_MAX_ITEM_BYTES + 1 });
    await settle();
    expect(store.get("big")).toBe(PLAIN);
    release();
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS);
    want("big");
    expect(net.fetch).toHaveBeenCalledTimes(1);
    expect(store.get("big")).toBe(PLAIN);
  });

  it("a body that stops arriving goes plain, so the tap fetches afresh", async () => {
    store = makeStore({ stallMs: 1_000 });
    want("a");
    const waiting = store.whenHeld("a");
    net.calls[0].respond({ length: 10 }).chunk("abc");
    await settle();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(store.get("a")).toBe(PLAIN);
    expect(await waiting).toBeNull();
  });

  it("★ a plain answer stands for the visit: a re-minted link does not send it back to waiting", async () => {
    const release = want("a");
    net.calls[0].respond({ length: HELD_MAX_ITEM_BYTES + 1 });
    await settle();
    // The slot's effect re-runs on a re-minted link: a release and a want in one breath.
    release();
    want("a", "high", "https://r2.test/a.jpg?b=2");
    await vi.advanceTimersByTimeAsync(RELEASE_GRACE_MS);
    expect(store.get("a")).toBe(PLAIN);
    expect(net.fetch).toHaveBeenCalledTimes(1);
  });

  it("★ two refusals with no success turn the store off: every later photograph goes plain at once", async () => {
    want("a");
    want("b");
    net.calls[0].refuse();
    await settle();
    expect(store.get("a")).toBe(PLAIN);
    net.calls[1].refuse();
    await settle();
    expect(store.get("b")).toBe(PLAIN);
    // Off: nothing is asked any more, and everything answers plain.
    want("c");
    expect(net.fetch).toHaveBeenCalledTimes(2);
    expect(store.get("c")).toBe(PLAIN);
  });

  it("a refusal after a success is the network's, never the origin's: the store stays on", async () => {
    want("ok");
    const answer = net.calls[0].respond({ length: 1 });
    answer.chunk("x");
    answer.end();
    await settle();
    want("a");
    net.calls[1].refuse();
    await settle();
    want("b");
    net.calls[2].refuse();
    await settle();
    want("c");
    expect(net.fetch).toHaveBeenCalledTimes(4);
  });

  it("an expired presign's refusal never counts toward turning the store off", async () => {
    const stale =
      "https://r2.test/a.jpg?X-Amz-Date=20260101T000000Z&X-Amz-Expires=5400";
    want("a", "high", stale);
    want("b", "high", stale.replace("a.jpg", "b.jpg"));
    net.calls[0].refuse();
    net.calls[1].refuse();
    await settle();
    want("c");
    expect(net.fetch).toHaveBeenCalledTimes(3);
  });
});

describe("a presign's own expiry", () => {
  it("is read off its query, with a minute's slack", () => {
    const url =
      "https://r2.test/a.jpg?X-Amz-Date=20261002T203000Z&X-Amz-Expires=5400";
    const signed = Date.UTC(2026, 9, 2, 20, 30, 0);
    expect(presignExpired(url, signed + 60_000)).toBe(false);
    expect(presignExpired(url, signed + 5_400_000 - 30_000)).toBe(true);
    expect(presignExpired("https://r2.test/a.jpg", signed)).toBe(false);
    expect(presignExpired("not a url", signed)).toBe(false);
  });
});
