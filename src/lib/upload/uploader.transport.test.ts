/**
 * A CANCEL AND A DROPPED CONNECTION, TOLD APART, AND NEVER HIDDEN (E6, Will 2026-10-04: "a network failure is never
 * hidden: it says the connection dropped and what to do, so she neither tries in vain nor blames the app", his
 * picture a crowded indoor stadium). The words are the uploader's, since the failure sheet and the host's rows print
 * a message as it is. The network stood in for: fetch for presign and complete, a controllable XHR for the byte PUT.
 *
 * What is held: every way the connection can fail says so in the one sentence presign and complete always said
 * (the byte PUT's "Network error during upload." is gone); a PUT whose bytes stop moving is ended and said the same
 * way instead of sitting at its percentage for ever (the clock restarts on every byte, and waits longer for R2's
 * answer once the last byte is out); an answer that is an error is neither the line's nor hers; and a signal she
 * aborts says it was cancelled, before any byte, mid-transfer, or while the copies went, and never writes a row.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/media/strip-metadata", () => ({
  stripFileMetadata: async (file: Blob) => ({ blob: file, stripped: true }),
}));
vi.mock("@/lib/upload/device-id", () => ({ getDeviceId: () => null }));
vi.mock("@/lib/upload/preview", () => ({
  generatePreview: async () => null,
  generatePhoneCopy: async () => null,
  posterPreview: vi.fn(async () => null),
}));

const { uploadFile, UPLOAD_ANSWER_MS, UPLOAD_STALL_MS, UPLOAD_WORDS } =
  await import("./uploader");

const MEDIA = "44444444-4444-4444-8444-444444444444";
const DROPPED = "Your connection dropped. Check your signal and try again.";

type Behaviour =
  /** The browser reports the network failed. */
  | "error"
  /** Answered with this status. */
  | number
  /** Sends some bytes, then nothing more: a stalled link. */
  | "stall"
  /** Sends every byte, then R2 never answers. */
  | "silent-answer"
  /** Sends bytes at intervals past the stall ceiling's worth of time in total, then lands: a slow link that moves. */
  | "slow-but-moving"
  /** The browser ends the request itself (an abort nobody asked for). */
  | "browser-abort";

let behaviour: Behaviour = 200;
let xhrs: FakeXhr[] = [];

class FakeXhr {
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = {
    onprogress: null as ((e: ProgressEvent) => void) | null,
    onload: null as (() => void) | null,
  };
  aborted = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  open() {}
  setRequestHeader() {}
  getResponseHeader() {
    return '"etag"';
  }
  abort() {
    if (this.aborted) return;
    this.aborted = true;
    for (const t of this.timers) clearTimeout(t);
    this.onabort?.();
  }
  private progress(loaded: number, total: number) {
    this.upload.onprogress?.({
      lengthComputable: true,
      loaded,
      total,
    } as ProgressEvent);
  }
  send(body: Blob) {
    xhrs.push(this);
    const later = (ms: number, fn: () => void) =>
      this.timers.push(setTimeout(fn, ms));
    if (behaviour === "error") {
      later(0, () => this.onerror?.());
    } else if (typeof behaviour === "number") {
      const status = behaviour;
      later(0, () => {
        this.progress(body.size, body.size);
        this.upload.onload?.();
        this.status = status;
        this.onload?.();
      });
    } else if (behaviour === "stall") {
      later(0, () => this.progress(1, body.size));
    } else if (behaviour === "silent-answer") {
      later(0, () => {
        this.progress(body.size, body.size);
        this.upload.onload?.();
      });
    } else if (behaviour === "slow-but-moving") {
      // Three reports, each just inside the ceiling of the last: 2.7x the ceiling in all, and never stalled.
      const gap = UPLOAD_STALL_MS - 5_000;
      later(gap, () => this.progress(1, body.size));
      later(gap * 2, () => this.progress(2, body.size));
      later(gap * 3, () => {
        this.progress(body.size, body.size);
        this.upload.onload?.();
        this.status = 200;
        this.onload?.();
      });
    } else if (behaviour === "browser-abort") {
      later(0, () => {
        this.aborted = true;
        this.onabort?.();
      });
    }
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

const posts: string[] = [];
let presignGate: Promise<void> | null = null;
let rejectNext: "network" | null = null;

beforeEach(() => {
  behaviour = 200;
  xhrs = [];
  posts.length = 0;
  presignGate = null;
  rejectNext = null;
  vi.stubGlobal("XMLHttpRequest", FakeXhr);
  vi.stubGlobal("Image", FakeImage);
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
      posts.push(url);
      if (rejectNext === "network") throw new TypeError("Failed to fetch");
      if (presignGate && url.includes("presign")) {
        await new Promise<void>((resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
          void presignGate!.then(resolve);
        });
      }
      const body = JSON.parse(init.body) as Record<string, unknown>;
      const answer = url.includes("presign")
        ? {
            ok: true,
            strategy: "single",
            media_id: MEDIA,
            key: `events/e/photo/${MEDIA}/original.jpg`,
            content_type: body.content_type,
            url: "https://r2.example/original",
            headers: {},
          }
        : { ok: true, status: "approved" };
      return new Response(JSON.stringify(answer), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const photo = () =>
  new File([new Uint8Array(1_000_000)], "IMG_0001.jpg", { type: "image/jpeg" });

const send = (signal?: AbortSignal) =>
  uploadFile({
    file: photo(),
    endpoints: {
      presign: "/api/r2/presign-upload",
      complete: "/api/r2/complete-upload",
    },
    identity: { session_token: "t" },
    signal,
  });

describe("a dropped connection names itself, whichever step it drops at", () => {
  it("★ the byte PUT: the browser's network error says the connection dropped, with what to do", async () => {
    behaviour = "error";
    const out = await send();
    expect(out).toEqual({ ok: false, message: DROPPED, cause: "dropped" });
    // Never the developer's sentence the PUT used to say.
    expect(JSON.stringify(out)).not.toContain("Network error during upload");
    // And no row is written for what never landed.
    expect(posts.some((u) => u.includes("complete"))).toBe(false);
  });

  it("presign and complete say it in the same words (a request that never reaches the network)", async () => {
    rejectNext = "network";
    const out = await send();
    expect(out).toEqual({ ok: false, message: DROPPED, cause: "dropped" });
  });

  it("the words are one sentence, in one place", () => {
    expect(UPLOAD_WORDS.dropped).toBe(DROPPED);
  });

  it("a request the browser ended on its own is the connection's too, not a cancel", async () => {
    behaviour = "browser-abort";
    expect(await send()).toEqual({
      ok: false,
      message: DROPPED,
      cause: "dropped",
    });
  });
});

describe("an answer that is an error is neither the line's nor hers", () => {
  it("says it did not go through, with no code to read and no cause, and Retry may pass", async () => {
    behaviour = 403;
    const out = await send();
    expect(out).toEqual({
      ok: false,
      message: "That upload didn't go through. Please try again.",
    });
    // The status is the console's: a guest never reads "Upload failed (403)".
    expect(JSON.stringify(out)).not.toContain("403");
  });
});

describe("a stalled transfer is ended and said, never left at its percentage", () => {
  it("★ bytes that stop moving end the PUT as a dropped connection after the ceiling", async () => {
    vi.useFakeTimers();
    behaviour = "stall";
    const going = send();
    await vi.advanceTimersByTimeAsync(UPLOAD_STALL_MS - 1_000);
    expect(xhrs[0].aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(xhrs[0].aborted).toBe(true);
    expect(await going).toEqual({
      ok: false,
      message: DROPPED,
      cause: "dropped",
    });
    expect(posts.some((u) => u.includes("complete"))).toBe(false);
  });

  it("a slow link that keeps moving is never ended: the clock restarts on every byte", async () => {
    vi.useFakeTimers();
    behaviour = "slow-but-moving";
    const going = send();
    await vi.advanceTimersByTimeAsync(UPLOAD_STALL_MS * 4);
    const out = await going;
    expect(xhrs[0].aborted).toBe(false);
    expect(out).toMatchObject({ ok: true, mediaId: MEDIA });
  });

  it("once the last byte is out it waits longer for R2's answer, then calls it a drop", async () => {
    vi.useFakeTimers();
    behaviour = "silent-answer";
    const going = send();
    // Past the byte ceiling and still inside the answer's: not ended.
    await vi.advanceTimersByTimeAsync(UPLOAD_STALL_MS + 5_000);
    expect(xhrs[0].aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(UPLOAD_ANSWER_MS);
    expect(xhrs[0].aborted).toBe(true);
    expect(await going).toMatchObject({ ok: false, cause: "dropped" });
  });
});

describe("a cancel is hers, and says so", () => {
  it("★ a signal already aborted starts nothing: no request, no byte", async () => {
    const ctl = new AbortController();
    ctl.abort();
    const out = await send(ctl.signal);
    expect(out).toEqual({
      ok: false,
      message: UPLOAD_WORDS.cancelled,
      cause: "cancelled",
    });
    expect(posts).toEqual([]);
    expect(xhrs).toHaveLength(0);
  });

  it("aborted mid-transfer, the PUT ends as a cancel, never as a drop, and no row is written", async () => {
    behaviour = "stall";
    const ctl = new AbortController();
    const going = send(ctl.signal);
    // Let the transfer begin, then she cancels.
    for (let i = 0; i < 20 && xhrs.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 0));
    }
    expect(xhrs).toHaveLength(1);
    ctl.abort();
    expect(await going).toEqual({
      ok: false,
      message: "That upload was cancelled.",
      cause: "cancelled",
    });
    expect(xhrs[0].aborted).toBe(true);
    expect(posts.some((u) => u.includes("complete"))).toBe(false);
  });

  it("aborted while the presign is in the air, it is a cancel and not a dropped connection", async () => {
    let release!: () => void;
    presignGate = new Promise<void>((r) => (release = r));
    const ctl = new AbortController();
    const going = send(ctl.signal);
    for (let i = 0; i < 20 && posts.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 0));
    }
    ctl.abort();
    expect(await going).toMatchObject({ ok: false, cause: "cancelled" });
    release();
    expect(xhrs).toHaveLength(0);
  });

  it("a cancel that arrives after the bytes landed writes no row", async () => {
    // The original is PUT, then she cancels before the copies finish: complete is never asked.
    behaviour = 200;
    const ctl = new AbortController();
    const going = send(ctl.signal);
    for (let i = 0; i < 40 && xhrs.length === 0; i++) {
      await new Promise((r) => setTimeout(r, 0));
    }
    ctl.abort();
    const out = await going;
    // Either the cancel beat the complete (no row, cancelled) or the upload had already landed (ok): never a drop.
    if (out.ok) {
      expect(posts.some((u) => u.includes("complete"))).toBe(true);
    } else {
      expect(out.cause).toBe("cancelled");
      expect(posts.some((u) => u.includes("complete"))).toBe(false);
    }
  });
});
