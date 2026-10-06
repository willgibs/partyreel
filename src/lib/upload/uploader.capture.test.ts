/**
 * ★ A FILE'S CAPTURE TIME RIDES ITS OWN COMPLETE (capture-time, Will's X7: "keep the capture time, never the place or
 * device"). The strip reads when the original says it was taken before rewriting a byte; the uploader turns that into
 * an ISO instant (`captureClaim`) and the complete carries it as `captured_at`, file by file, never the presign. A file
 * that said nothing carries no key at all (the server's default stands), and a kept complete sent again carries it as
 * first asked. Fails on the code before the lane: no complete carried a time.
 * Stood in: the strip (a stand-in reporting each file's stamp by its name), the derivatives (none), the image
 * measure, the network (fetch for the two routes, an XHR that lands at once).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CaptureStamp } from "@/lib/media/strip-metadata";

/** Each file's stamp, by its name, as the strip would read it from the original. */
const stamps = new Map<string, CaptureStamp>();
vi.mock("@/lib/media/strip-metadata", () => ({
  stripFileMetadata: async (file: File) => ({
    blob: file,
    stripped: true,
    ...(stamps.has(file.name) ? { captured: stamps.get(file.name) } : {}),
  }),
}));
vi.mock("@/lib/upload/device-id", () => ({ getDeviceId: () => null }));
vi.mock("@/lib/upload/preview", () => ({
  generatePreview: async () => null,
  generatePhoneCopy: async () => null,
  posterPreview: async () => null,
}));

const { uploadBurst, uploadFile } = await import("./uploader");

type Entry = Record<string, unknown>;
const calls: { url: string; files: Entry[] }[] = [];
const presigns = () => calls.filter((c) => c.url.includes("presign"));
const completes = () => calls.filter((c) => c.url.includes("complete"));
let minted = 0;
let completeDrops = false;

class FakeXhr {
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = {
    onprogress: null as ((e: ProgressEvent) => void) | null,
    onload: null as (() => void) | null,
  };
  open() {}
  setRequestHeader() {}
  getResponseHeader() {
    return '"etag"';
  }
  abort() {
    this.onabort?.();
  }
  send() {
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

beforeEach(() => {
  vi.useFakeTimers();
  calls.length = 0;
  stamps.clear();
  minted = 0;
  completeDrops = false;
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
    vi.fn(async (url: string, init: { body: string }) => {
      const files = (JSON.parse(init.body) as { files: Entry[] }).files;
      calls.push({ url, files });
      if (url.includes("presign")) {
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
      if (completeDrops) throw new TypeError("Failed to fetch");
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

const ENDPOINTS = {
  presign: "/api/r2/presign-upload",
  complete: "/api/r2/complete-upload",
};
const photo = (name: string) =>
  new File([new Uint8Array(1000)], name, { type: "image/jpeg" });

describe("★ the complete carries each file's own capture time", () => {
  it("as an ISO instant, zone applied; a file that said nothing carries no key; the presign never carries one", async () => {
    stamps.set("taken.jpg", {
      kind: "wall",
      wall: "2026:10:03 21:14:05",
      offset: "-04:00",
    });
    stamps.set("clip.jpg", {
      kind: "instant",
      ms: Date.parse("2026-10-04T01:20:00Z"),
    });
    const going = uploadBurst({
      files: [photo("taken.jpg"), photo("silent.jpg"), photo("clip.jpg")].map(
        (file) => ({ file }),
      ),
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(30_000);
    const out = await going;
    expect(out.every((o) => o.ok)).toBe(true);
    const entries = completes().flatMap((c) => c.files);
    expect(entries.map((e) => e.captured_at)).toEqual([
      "2026-10-04T01:14:05.000Z",
      undefined,
      "2026-10-04T01:20:00.000Z",
    ]);
    expect(entries[1]).not.toHaveProperty("captured_at");
    for (const p of presigns()) {
      for (const f of p.files) expect(f).not.toHaveProperty("captured_at");
    }
  });

  it("a kept complete, sent again on the file's next try, carries its time as first asked", async () => {
    stamps.set("again.jpg", {
      kind: "wall",
      wall: "2026:10:03 22:00:00",
      offset: "+00:00",
    });
    const file = photo("again.jpg");
    completeDrops = true;
    const first = uploadFile({
      file,
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await first).ok).toBe(false);
    completeDrops = false;
    const second = uploadFile({
      file,
      endpoints: ENDPOINTS,
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(30_000);
    expect((await second).ok).toBe(true);
    // One presign in all: the second try is the very complete again, its time with it.
    expect(presigns()).toHaveLength(1);
    expect(completes().map((c) => c.files[0]!.captured_at)).toEqual([
      "2026-10-03T22:00:00.000Z",
      "2026-10-03T22:00:00.000Z",
    ]);
  });
});
