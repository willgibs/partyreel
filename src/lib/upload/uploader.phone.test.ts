/**
 * THE PHONE-SIZE COPY, IN THE BROWSER'S HALF OF AN UPLOAD (take-home r1). A photograph's copy is made beside its
 * preview, declared at presign so its PUT binds its length, PUT where the presign said, and named at complete
 * ONLY once its PUT landed; a clip never makes one, and nothing about a copy ever fails the upload. The
 * engine's own edges are stood in: the strip (a pass-through), the two derivatives, the network (fetch for the
 * two routes, XHR for the PUTs) and the image measure.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generatePreview = vi.fn();
const generatePhoneCopy = vi.fn();

vi.mock("@/lib/media/strip-metadata", () => ({
  stripFileMetadata: async (file: Blob) => ({ blob: file, stripped: true }),
}));
vi.mock("@/lib/upload/device-id", () => ({ getDeviceId: () => null }));
vi.mock("@/lib/upload/preview", () => ({
  generatePreview: (...args: unknown[]) => generatePreview(...args),
  generatePhoneCopy: (...args: unknown[]) => generatePhoneCopy(...args),
  posterPreview: vi.fn(async () => null),
}));

const { uploadFile } = await import("./uploader");

type Put = { url: string; size: number; headers: Record<string, string> };
const puts: Put[] = [];
/** URLs whose PUT fails (a dropped connection). */
const failing = new Set<string>();
const posts: { url: string; body: Record<string, unknown> }[] = [];

class FakeXhr {
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  upload = { onprogress: null as ((e: ProgressEvent) => void) | null };
  private url = "";
  private headers: Record<string, string> = {};
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  getResponseHeader() {
    return '"etag"';
  }
  send(body: Blob) {
    queueMicrotask(() => {
      if (failing.has(this.url)) {
        this.onerror?.();
        return;
      }
      puts.push({ url: this.url, size: body.size, headers: this.headers });
      this.status = 200;
      this.onload?.();
    });
  }
}

class FakeImage {
  naturalWidth = 4032;
  naturalHeight = 3024;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}

const EVENT = "33333333-3333-4333-8333-333333333333";
const MEDIA = "44444444-4444-4444-8444-444444444444";
const PHONE_KEY = `events/${EVENT}/photo/${MEDIA}/phone.jpg`;

/** The presign's answer: the photograph's PUT, and a phone PUT when the client declared one. */
function presignAnswer(body: Record<string, unknown>) {
  const kind = String(body.content_type).startsWith("video/")
    ? "video"
    : "photo";
  return {
    ok: true,
    strategy: "single",
    media_id: MEDIA,
    key: `events/${EVENT}/${kind}/${MEDIA}/original.jpg`,
    content_type: body.content_type,
    url: "https://r2.example/original",
    headers: { "Content-Type": String(body.content_type) },
    ...(typeof body.phone_size_bytes === "number"
      ? {
          phone: {
            key: PHONE_KEY,
            url: "https://r2.example/phone",
            headers: { "Content-Type": "image/jpeg" },
          },
        }
      : {}),
  };
}

beforeEach(() => {
  puts.length = 0;
  posts.length = 0;
  failing.clear();
  generatePreview.mockReset().mockResolvedValue(null);
  generatePhoneCopy.mockReset();
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
      const body = JSON.parse(init.body) as Record<string, unknown>;
      posts.push({ url, body });
      const answer = url.includes("presign")
        ? presignAnswer(body)
        : { ok: true, status: "approved" };
      return new Response(JSON.stringify(answer), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const photo = () =>
  new File([new Uint8Array(3_000_000)], "IMG_0001.jpg", { type: "image/jpeg" });

async function upload(file: File) {
  return uploadFile({
    file,
    endpoints: {
      presign: "/api/r2/presign-upload",
      complete: "/api/r2/complete-upload",
    },
    identity: { session_token: "t" },
  });
}

const presignBody = () => posts.find((p) => p.url.includes("presign"))!.body;
const completeBody = () => posts.find((p) => p.url.includes("complete"))!.body;

describe("uploadFile: a photograph's phone-size copy", () => {
  it("is made from the photograph it uploads, declared at presign, PUT where the presign said, and named at complete", async () => {
    generatePhoneCopy.mockResolvedValue({
      blob: new Blob([new Uint8Array(600_000)], { type: "image/jpeg" }),
      ext: "jpg",
    });
    const out = await upload(photo());
    expect(out).toMatchObject({ ok: true, mediaId: MEDIA });
    expect(generatePhoneCopy).toHaveBeenCalledWith(expect.any(File), "photo", {
      width: 4032,
      height: 3024,
    });
    expect(presignBody().phone_size_bytes).toBe(600_000);
    expect(puts).toContainEqual({
      url: "https://r2.example/phone",
      size: 600_000,
      headers: { "Content-Type": "image/jpeg" },
    });
    expect(completeBody().phone_key).toBe(PHONE_KEY);
  });

  it("declares nothing and names nothing when none was made", async () => {
    generatePhoneCopy.mockResolvedValue(null);
    await upload(photo());
    expect(presignBody()).not.toHaveProperty("phone_size_bytes");
    expect(puts.map((p) => p.url)).toEqual(["https://r2.example/original"]);
    expect(completeBody()).not.toHaveProperty("phone_key");
  });

  it("a PUT that fails costs the copy and never the photograph", async () => {
    generatePhoneCopy.mockResolvedValue({
      blob: new Blob([new Uint8Array(600_000)], { type: "image/jpeg" }),
      ext: "jpg",
    });
    failing.add("https://r2.example/phone");
    const out = await upload(photo());
    expect(out.ok).toBe(true);
    expect(completeBody()).not.toHaveProperty("phone_key");
  });

  it("a copy the presign would not mint (no phone in its answer) is never PUT or named", async () => {
    generatePhoneCopy.mockResolvedValue({
      blob: new Blob([new Uint8Array(600_000)], { type: "image/jpeg" }),
      ext: "jpg",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: { body: string }) => {
        const body = JSON.parse(init.body) as Record<string, unknown>;
        posts.push({ url, body });
        const answer = url.includes("presign")
          ? { ...presignAnswer(body), phone: undefined }
          : { ok: true, status: "approved" };
        return new Response(JSON.stringify(answer), { status: 200 });
      }),
    );
    await upload(photo());
    expect(puts.map((p) => p.url)).toEqual(["https://r2.example/original"]);
    expect(completeBody()).not.toHaveProperty("phone_key");
  });

  it("a clip asks for none: videos stay as taken", async () => {
    generatePhoneCopy.mockResolvedValue(null);
    const clip = new File([new Uint8Array(5_000_000)], "clip.mp4", {
      type: "video/mp4",
    });
    // A clip's measure is a <video>: stood in as an element that loads its metadata at once.
    vi.stubGlobal("document", {
      createElement: () => {
        const v = {
          videoWidth: 1920,
          videoHeight: 1080,
          duration: 12,
          onloadedmetadata: null as (() => void) | null,
          onerror: null,
          preload: "",
          set src(_: string) {
            queueMicrotask(() => v.onloadedmetadata?.());
          },
        };
        return v;
      },
    });
    await upload(clip);
    expect(generatePhoneCopy).toHaveBeenCalledWith(
      expect.any(File),
      "video",
      expect.anything(),
    );
    expect(presignBody()).not.toHaveProperty("phone_size_bytes");
    expect(completeBody()).not.toHaveProperty("phone_key");
  });
});
