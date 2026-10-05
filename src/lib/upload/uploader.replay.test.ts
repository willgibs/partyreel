/**
 * ★ A REQUEST NEVER HANGS, AND A LOST ANSWER IS ASKED AGAIN, NEVER REDONE (uploads-idempotent). Presign and complete
 * each end past a ceiling as the dropped line they are ("Your connection dropped. Check your signal, then try again.",
 * its Try again), never a spinner for ever; and because a complete ended that way may have written its row, the file's
 * next try sends that very complete again (its media id, key and parts), never a presign or a byte, so the server's row
 * answers it and nothing is recorded twice. What is held: both ceilings, their clocks restarting when the page is looked
 * at again; a complete with no answer, one the phone cannot read, and the server's own "couldn't finish" are kept for
 * the next try, and every other answer lets it go; a burst's kept completes go again together and at once, before its
 * fresh files; a second pick of the same photograph is a new upload; a file going again stands full from its first
 * moment and cannot be stopped (its row may already stand).
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

const {
  uploadBurst,
  uploadFile,
  UPLOAD_WORDS,
  PRESIGN_CEILING_MS,
  COMPLETE_CEILING_MS,
} = await import("./uploader");

type Entry = Record<string, unknown>;
type Call = { url: string; files: Entry[] };
const calls: Call[] = [];
const presigns = () => calls.filter((c) => c.url.includes("presign"));
const completes = () => calls.filter((c) => c.url.includes("complete"));
/** The byte PUTs, by the URL each presign minted (`put/<media id>`). */
const puts: string[] = [];

/** What a request meets: an answer (JSON), the line dropping, a request that never answers, or an edge's error page. */
type Behaviour = "network" | "hang" | "html" | { answer: unknown };
let presignWith: (files: Entry[]) => Behaviour;
let completeWith: (files: Entry[], call: number) => Behaviour;
/** A fresh media id for every file a presign mints, so a second presign of a file is plain to see. */
let minted = 0;

const ANSWERED = (files: Entry[], status = "approved") => ({
  answer: { ok: true, files: files.map(() => ({ ok: true, status })) },
});

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
    puts.push(this.url);
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

/** A page whose visibility a case can turn (a phone freezes a hidden page's timers). */
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
  calls.length = 0;
  puts.length = 0;
  minted = 0;
  page.visibilityState = "visible";
  page.listeners.clear();
  presignWith = (files) => ({
    answer: {
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
    },
  });
  completeWith = (files) => ANSWERED(files);
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
      calls.push({ url, files });
      const behaviour = url.includes("presign")
        ? presignWith(files)
        : completeWith(files, completes().length);
      if (behaviour === "network") throw new TypeError("Failed to fetch");
      if (behaviour === "hang") {
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        });
      }
      if (behaviour === "html") {
        return new Response("<html>504 Gateway Timeout</html>", {
          status: 504,
        });
      }
      return new Response(JSON.stringify(behaviour.answer), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

let named = 0;
const photo = (name = `IMG_${++named}.jpg`) =>
  new File([new Uint8Array(1000)], name, { type: "image/jpeg" });

const ENDPOINTS = {
  presign: "/api/r2/presign-upload",
  complete: "/api/r2/complete-upload",
};
const DROPPED = {
  ok: false,
  message: UPLOAD_WORDS.dropped,
  cause: "dropped",
} as const;

/** One file through the uploader, the clock run until it settles (or `run` ms). */
async function one(
  file: File,
  opts: { run?: number; signal?: AbortSignal } = {},
) {
  const going = uploadFile({
    file,
    endpoints: ENDPOINTS,
    identity: { session_token: "t" },
    signal: opts.signal,
  });
  await vi.advanceTimersByTimeAsync(opts.run ?? 1_000);
  return going;
}

/** A burst through the uploader, the clock run until it settles. */
async function burst(
  files: File[],
  extra: { signals?: (AbortSignal | undefined)[]; run?: number } = {},
) {
  const told: string[] = [];
  const going = uploadBurst({
    files: files.map((file, i) => ({
      file,
      signal: extra.signals?.[i],
      onSending: () => told.push(`sending ${i}`),
      onProgress: (f: number) => told.push(`progress ${i} ${f}`),
      onSent: () => told.push(`sent ${i}`),
    })),
    endpoints: ENDPOINTS,
    identity: { session_token: "t" },
  });
  await vi.advanceTimersByTimeAsync(extra.run ?? 1_000);
  return { out: await going, told };
}

describe("★ a request never hangs: past its ceiling it is the dropped line it is", () => {
  it("a presign that never answers ends as a dropped connection, with nothing kept (the next try presigns afresh)", async () => {
    presignWith = () => "hang";
    const file = photo();
    const going = uploadFile({
      file,
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    let settled = false;
    void going.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(PRESIGN_CEILING_MS - 1_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await going).toEqual(DROPPED);
    expect(puts).toHaveLength(0);
    expect(completes()).toHaveLength(0);

    presignWith = (files) => ({
      answer: {
        ok: true,
        files: files.map(() => ({
          ok: true,
          strategy: "single",
          media_id: "fresh",
          key: "events/e/photo/fresh/original.jpg",
          content_type: "image/jpeg",
          url: "https://r2.example/put/fresh",
          headers: {},
        })),
      },
    });
    expect(await one(file)).toMatchObject({ ok: true, mediaId: "fresh" });
    expect(presigns()).toHaveLength(2);
  });

  it("★ a complete that never answers ends as a dropped connection after its ceiling, never a spinner for ever", async () => {
    completeWith = () => "hang";
    const going = uploadFile({
      file: photo(),
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    let settled = false;
    void going.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(COMPLETE_CEILING_MS - 1_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await going).toEqual(DROPPED);
  });

  it("the ceiling's clock restarts when the page comes back to the screen (a hidden page's timers freeze)", async () => {
    completeWith = () => "hang";
    const going = uploadFile({
      file: photo(),
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    let settled = false;
    void going.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(COMPLETE_CEILING_MS - 5_000);
    page.turn("hidden");
    page.turn("visible");
    // Looked at again: a whole ceiling from now, not the five seconds that were left.
    await vi.advanceTimersByTimeAsync(COMPLETE_CEILING_MS - 1_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await going).toEqual(DROPPED);
  });

  it("her cancel during a presign is still a cancel, never the ceiling's drop", async () => {
    presignWith = () => "hang";
    const ctl = new AbortController();
    const going = uploadFile({
      file: photo(),
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
      signal: ctl.signal,
    });
    await vi.advanceTimersByTimeAsync(1_000);
    ctl.abort();
    await vi.advanceTimersByTimeAsync(10);
    expect(await going).toMatchObject({ ok: false, cause: "cancelled" });
  });
});

describe("★ a lost answer is asked again, never redone", () => {
  it("★ a Try again after a dropped complete sends that complete again: the same media id, key and parts, no presign, no byte", async () => {
    const file = photo();
    completeWith = (files, call) => (call === 1 ? "network" : ANSWERED(files));
    expect(await one(file)).toEqual(DROPPED);
    const first = completes()[0]!.files[0]!;

    const again = await one(file);
    expect(again).toEqual({
      ok: true,
      status: "approved",
      mediaId: first.media_id,
      kind: "photo",
    });
    expect(presigns()).toHaveLength(1);
    expect(puts).toHaveLength(1);
    expect(completes()).toHaveLength(2);
    expect(completes()[1]!.files).toEqual([first]);
  });

  it("★ a complete past its ceiling whose row was written meanwhile: the next try's `recorded` is its landing", async () => {
    const file = photo();
    completeWith = (files, call) =>
      call === 1 ? "hang" : ANSWERED(files, "recorded");
    const going = uploadFile({
      file,
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(COMPLETE_CEILING_MS + 1_000);
    expect(await going).toEqual(DROPPED);

    const again = await one(file);
    expect(again).toMatchObject({
      ok: true,
      status: "recorded",
      mediaId: "m1",
    });
    expect(presigns()).toHaveLength(1);
    expect(completes().map((c) => c.files[0]!.media_id)).toEqual(["m1", "m1"]);
  });

  it("an answer the phone could not read (an edge's error page) is kept the same way", async () => {
    const file = photo();
    completeWith = (files, call) => (call === 1 ? "html" : ANSWERED(files));
    const first = await one(file);
    expect(first).toMatchObject({ ok: false });
    await one(file);
    expect(presigns()).toHaveLength(1);
    expect(completes().map((c) => c.files[0]!.media_id)).toEqual(["m1", "m1"]);
  });

  it.each(["complete_failed", "unknown"])(
    "the server's own couldn't-finish (%s) is kept: a row may stand behind it",
    async (code) => {
      const file = photo();
      completeWith = (files, call) =>
        call === 1
          ? {
              answer: {
                ok: true,
                files: files.map(() => ({
                  ok: false,
                  status: code === "unknown" ? 422 : 502,
                  code,
                  message: "Couldn't finalize the upload. Please retry.",
                })),
              },
            }
          : ANSWERED(files);
      expect(await one(file)).toMatchObject({ ok: false, code });
      expect(await one(file)).toMatchObject({ ok: true, mediaId: "m1" });
      expect(presigns()).toHaveLength(1);
    },
  );

  it("any other refusal is the server's settled word: the next try uploads afresh", async () => {
    const file = photo();
    completeWith = (files, call) =>
      call === 1
        ? {
            answer: {
              ok: true,
              files: files.map(() => ({
                ok: false,
                status: 400,
                code: "bad_key",
                message: "Couldn't verify the uploaded file. Please retry.",
              })),
            },
          }
        : ANSWERED(files);
    expect(await one(file)).toMatchObject({ ok: false, code: "bad_key" });
    expect(await one(file)).toMatchObject({ ok: true, mediaId: "m2" });
    expect(presigns()).toHaveLength(2);
    expect(puts).toHaveLength(2);
  });

  it("a landed file is let go: sent again by its caller, it is a new upload", async () => {
    const file = photo();
    expect(await one(file)).toMatchObject({ ok: true, mediaId: "m1" });
    expect(await one(file)).toMatchObject({ ok: true, mediaId: "m2" });
    expect(presigns()).toHaveLength(2);
  });

  it("★ a second pick of the same photograph is a new upload, never the kept complete of the first", async () => {
    const first = photo("IMG_0001.jpg");
    completeWith = (files, call) => (call === 1 ? "network" : ANSWERED(files));
    await one(first);
    const picked = photo("IMG_0001.jpg");
    expect(await one(picked)).toMatchObject({ ok: true, mediaId: "m2" });
    expect(presigns()).toHaveLength(2);
  });
});

describe("★ a burst going again", () => {
  it("every file of a lost complete goes again in one request, at once, and stands full from its first moment", async () => {
    const files = [photo(), photo(), photo()];
    completeWith = (fs, call) => (call === 1 ? "network" : ANSWERED(fs));
    const { out } = await burst(files);
    expect(out.every((o) => !o.ok && o.cause === "dropped")).toBe(true);
    const ids = completes()[0]!.files.map((f) => f.media_id);

    const told: string[] = [];
    const going = uploadBurst({
      files: files.map((file) => ({
        file,
        onSending: () => told.push("sending"),
        onProgress: (f: number) => told.push(`progress ${f}`),
        onSent: () => told.push("sent"),
      })),
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    // Full before any clock moves: its bytes went up on the try before.
    expect(told.filter((t) => t === "sent")).toHaveLength(3);
    expect(told).toContain("progress 1");
    await vi.advanceTimersByTimeAsync(10);
    // Asked at once, never waiting `BURST_RECORD_WAIT_MS` for a sibling.
    expect(completes()).toHaveLength(2);
    const again = await going;
    expect(again.map((o) => o.ok && o.mediaId)).toEqual(ids);
    expect(completes()[1]!.files.map((f) => f.media_id)).toEqual(ids);
    expect(presigns()).toHaveLength(2);
  });

  it("★ a kept complete beside a fresh file: the kept one goes alone and at once, the fresh one presigns and lands after", async () => {
    const kept = photo();
    completeWith = (fs, call) => (call === 1 ? "network" : ANSWERED(fs));
    await one(kept);
    const fresh = photo();
    const { out } = await burst([kept, fresh], { run: 20_000 });
    expect(out.map((o) => o.ok && o.mediaId)).toEqual(["m1", "m2"]);
    // The kept complete first and alone; the fresh file's own presign and complete after it.
    expect(completes().map((c) => c.files.map((f) => f.media_id))).toEqual([
      ["m1"],
      ["m1"],
      ["m2"],
    ]);
    expect(presigns().map((c) => c.files.length)).toEqual([1, 1]);
  });

  it("a file going again cannot be stopped: its abort is ignored and its answer stands", async () => {
    const file = photo();
    completeWith = (fs, call) =>
      call === 1 ? "network" : call === 2 ? "hang" : ANSWERED(fs);
    await one(file);
    completeWith = (fs) => ANSWERED(fs, "recorded");
    const stop = new AbortController();
    const going = uploadBurst({
      files: [{ file, signal: stop.signal }],
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    stop.abort();
    await vi.advanceTimersByTimeAsync(100);
    expect(await going).toEqual([
      { ok: true, status: "recorded", mediaId: "m1", kind: "photo" },
    ]);
  });
});
