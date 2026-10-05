/**
 * ★ A PRESIGN THAT HANGS DOES NOT HOLD THE FILES BEHIND IT (red-team 55's NIT). A burst presigns its first file alone (so
 * its bytes start as soon as they can) and the rest together, and only one presign was ever out: a first presign held in
 * the air kept every sibling from asking for its own until the whole 30 s ceiling ended it ("2 to go", no bytes moving,
 * no word). A presign out past `PRESIGN_REASK_MS` with a prepared file waiting behind it is taken back and its files go
 * into the next request with the waiting ones, so the rest go on at once.
 *
 * What is held: the siblings are presigned and sent at the re-ask, the stuck file with them and landing too; a line that
 * is truly down still ends the burst as the dropped connection it is, one ask later and never a third; a presign with
 * nobody waiting behind it is not asked again and keeps the whole ceiling; her cancel and one file's own cancel are
 * never taken for a re-ask; a page left hidden never ends a presign (its clock restarts when it is looked at again).
 * Stood in: the strip (a pass-through), the derivatives (none), the image measure, the network (fetch for the two
 * routes, an XHR that lands at once) and the page's visibility.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/media/strip-metadata", () => ({
  stripFileMetadata: async (file: Blob) => ({ blob: file, stripped: true }),
}));
vi.mock("@/lib/upload/device-id", () => ({ getDeviceId: () => null }));
vi.mock("@/lib/upload/preview", () => ({
  generatePreview: async () => null,
  generatePhoneCopy: async () => null,
  posterPreview: async () => null,
}));

const { uploadBurst, UPLOAD_WORDS, PRESIGN_CEILING_MS, PRESIGN_REASK_MS } =
  await import("./uploader");

type Entry = Record<string, unknown>;
/** Each request as it went, with the (fake) clock's time. */
type Call = { url: string; files: Entry[]; at: number };
const calls: Call[] = [];
const presigns = () => calls.filter((c) => c.url.includes("presign"));
const completes = () => calls.filter((c) => c.url.includes("complete"));
/** The byte PUTs, by the URL each presign minted, with the time each began. */
const puts: { url: string; at: number }[] = [];

/** Whether the nth presign (from 1) never answers (until it is ended). */
let presignHangs: (call: number) => boolean;
let minted = 0;
const t0 = 1_000_000;

class FakeXhr {
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = {
    onprogress: null as ((e: ProgressEvent) => void) | null,
    onload: null as (() => void) | null,
  };
  private url = "";
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader() {}
  getResponseHeader() {
    return '"etag"';
  }
  abort() {
    this.onabort?.();
  }
  send() {
    puts.push({ url: this.url, at: Date.now() - t0 });
    setTimeout(() => {
      this.upload.onload?.();
      this.status = 200;
      this.onload?.();
    }, 10);
  }
}

class FakeImage {
  naturalWidth = 100;
  naturalHeight = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const page = {
  visibilityState: "visible" as "visible" | "hidden",
  listeners: new Set<() => void>(),
  addEventListener(_type: string, fn: () => void) {
    this.listeners.add(fn);
  },
  removeEventListener(_type: string, fn: () => void) {
    this.listeners.delete(fn);
  },
  turn(state: "visible" | "hidden") {
    this.visibilityState = state;
    for (const fn of [...this.listeners]) fn();
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(t0);
  calls.length = 0;
  puts.length = 0;
  minted = 0;
  page.visibilityState = "visible";
  page.listeners.clear();
  presignHangs = () => false;
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("document", page);
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal(
    "URL",
    Object.assign(URL, {
      createObjectURL: () => "blob:x",
      revokeObjectURL: () => {},
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: { body: string; signal?: AbortSignal }) => {
      const files = (JSON.parse(init.body) as { files: Entry[] }).files;
      calls.push({ url, files, at: Date.now() - t0 });
      if (url.includes("presign")) {
        if (presignHangs(presigns().length)) {
          return new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          });
        }
        return new Response(
          JSON.stringify({
            ok: true,
            files: files.map((f) => {
              const id = `m${++minted}`;
              return {
                ok: true,
                strategy: "single",
                media_id: id,
                key: `events/e/photo/${id}/original.jpg`,
                content_type: f.content_type,
                url: `https://r2.example/put/${id}`,
                headers: {},
              };
            }),
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          files: files.map(() => ({ ok: true, status: "approved" })),
        }),
        { status: 200 },
      );
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

let named = 0;
/** A photograph whose declared size names it, so a presign's entries say whose they are. */
const photo = () => {
  const size = 1000 + ++named;
  const file = new File([new Uint8Array(4)], `IMG_${named}.jpg`, {
    type: "image/jpeg",
  });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

const ENDPOINTS = {
  presign: "/api/r2/presign-upload",
  complete: "/api/r2/complete-upload",
};
const DROPPED = {
  ok: false,
  message: UPLOAD_WORDS.dropped,
  cause: "dropped",
} as const;

/** A burst of these files, each with its own signal where one is handed, started and left to run on the clock. */
function start(
  files: File[],
  extra: {
    signal?: AbortSignal;
    signals?: (AbortSignal | undefined)[];
  } = {},
) {
  const told = new Map<number, { outcome: unknown; at: number }>();
  const going = uploadBurst({
    files: files.map((file, i) => ({ file, signal: extra.signals?.[i] })),
    endpoints: ENDPOINTS,
    identity: { session_token: "t" },
    signal: extra.signal,
    onOutcome: (i, outcome) => told.set(i, { outcome, at: Date.now() - t0 }),
  });
  return { going, told };
}

describe("★ a presign held in the air frees the files waiting behind it", () => {
  it("★ the siblings are presigned and sent at the re-ask, not at the ceiling, and the stuck file goes with them", async () => {
    presignHangs = (call) => call === 1;
    const files = [photo(), photo(), photo()];
    const { going, told } = start(files);
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS - 500);
    // Held: only the first file's presign is out; nothing of the siblings has asked or moved.
    expect(presigns().map((c) => c.files.length)).toEqual([1]);
    expect(puts).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2_000);
    // Taken back at the re-ask, and asked again as ONE request with the siblings that waited.
    expect(presigns().map((c) => c.files.length)).toEqual([1, 3]);
    expect(presigns()[1]!.at).toBeGreaterThanOrEqual(PRESIGN_REASK_MS);
    expect(presigns()[1]!.at).toBeLessThan(PRESIGN_REASK_MS + 1_000);
    await vi.advanceTimersByTimeAsync(5_000);
    const out = await going;
    // All three landed, the stuck file included, in one complete, long before the 30 s ceiling would have freed them.
    expect(out.every((o) => o.ok)).toBe(true);
    expect(completes().map((c) => c.files.length)).toEqual([3]);
    expect(puts.length).toBe(3);
    expect(Math.max(...[...told.values()].map((t) => t.at))).toBeLessThan(
      PRESIGN_CEILING_MS,
    );
    // The first bytes went at the re-ask, where they went at the ceiling before.
    expect(puts[0]!.at).toBeLessThan(PRESIGN_REASK_MS + 1_000);
  });

  it("★ a line that is truly down still ends the burst as the dropped connection it is, one ask later, and never asks a third time", async () => {
    presignHangs = () => true;
    const { going, told } = start([photo(), photo()]);
    await vi.advanceTimersByTimeAsync(
      PRESIGN_REASK_MS + PRESIGN_CEILING_MS - 1_000,
    );
    expect(told.size).toBe(0);
    await vi.advanceTimersByTimeAsync(2_000);
    const out = await going;
    expect(out).toEqual([DROPPED, DROPPED]);
    // Asked, taken back, asked again with the sibling: two requests, and it ends at the second one's ceiling.
    expect(presigns().map((c) => c.files.length)).toEqual([1, 2]);
    expect(puts).toHaveLength(0);
    expect(completes()).toHaveLength(0);
  });

  it("a presign with nobody waiting behind it is not asked again, and keeps the whole ceiling", async () => {
    presignHangs = () => true;
    const { going } = start([photo()]);
    await vi.advanceTimersByTimeAsync(PRESIGN_CEILING_MS - 1_000);
    expect(presigns()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await going).toEqual([DROPPED]);
    expect(presigns()).toHaveLength(1);
  });

  it("a presign that answers in good time is never taken back", async () => {
    const { going } = start([photo(), photo(), photo()]);
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS * 2);
    expect((await going).every((o) => o.ok)).toBe(true);
    // The first file alone, then the rest: the two requests a burst always was.
    expect(presigns().map((c) => c.files.length)).toEqual([1, 2]);
  });
});

describe("a re-ask is never taken for a cancel, nor a cancel for a re-ask", () => {
  it("her cancel of the burst, while the first presign is out, ends everything as cancelled and asks nothing again", async () => {
    presignHangs = () => true;
    const stop = new AbortController();
    const { going } = start([photo(), photo()], { signal: stop.signal });
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS - 1_000);
    stop.abort();
    await vi.advanceTimersByTimeAsync(5_000);
    const out = await going;
    expect(out.map((o) => !o.ok && o.cause)).toEqual([
      "cancelled",
      "cancelled",
    ]);
    expect(presigns()).toHaveLength(1);
  });

  it("one file's own cancel of the stuck file: it alone is cancelled, and the re-ask carries the others", async () => {
    presignHangs = (call) => call === 1;
    const stuck = new AbortController();
    const files = [photo(), photo(), photo()];
    const { going } = start(files, {
      signals: [stuck.signal, undefined, undefined],
    });
    await vi.advanceTimersByTimeAsync(2_000);
    stuck.abort();
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS + 5_000);
    const out = await going;
    expect(out.map((o) => (o.ok ? "ok" : o.cause))).toEqual([
      "cancelled",
      "ok",
      "ok",
    ]);
    // The re-ask carried the two that still went, and the cancelled file never asked again.
    expect(presigns().map((c) => c.files.length)).toEqual([1, 2]);
  });
});

describe("the page's own clock", () => {
  it("★ a page left hidden past the re-ask never ends the presign, and the clock restarts when it is looked at again", async () => {
    presignHangs = (call) => call === 1;
    const { going } = start([photo(), photo()]);
    await vi.advanceTimersByTimeAsync(1_000);
    page.turn("hidden");
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS * 2);
    expect(presigns()).toHaveLength(1);
    page.turn("visible");
    // Out from the moment it is looked at again: not taken back at once ...
    await vi.advanceTimersByTimeAsync(PRESIGN_REASK_MS - 1_000);
    expect(presigns()).toHaveLength(1);
    // ... but when the clock has run its length.
    await vi.advanceTimersByTimeAsync(2_000);
    expect(presigns()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(5_000);
    expect((await going).every((o) => o.ok)).toBe(true);
  });
});
