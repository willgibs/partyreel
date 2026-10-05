/**
 * A BURST IN THE BROWSER (compute-uploads, the compute model's lever 4): the files a caller hands together share one
 * presign and as few completes as their landing allows. What is held: ten files are two presigns (the first alone, so
 * its bytes start as soon as they ever did; the rest together) and one complete, each file's answer its own; a file
 * refused at either step never stops its siblings; a refusal of who is sending is every unasked file's, never asked
 * again; a dropped PUT fails its file alone; a landed file waits at most `BURST_RECORD_WAIT_MS` for its siblings, and
 * the page leaving the screen records what landed at once, in a complete that outlives the page; preparing runs at
 * most `PREP_AHEAD_BYTES` ahead of the network; her cancel ends everything not recorded, and one file's own cancel
 * ends that file alone (its siblings are recorded together as ever); each file settles once.
 * Stood in: the strip (a pass-through), the derivatives (none), the image measure, the network (fetch for the two
 * routes, a timed XHR for the PUTs) and the clock.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BURST_RECORD_WAIT_MS,
  MAX_BURST_FILES,
  PREP_AHEAD_BYTES,
} from "@/lib/upload/burst";

const generatePreview = vi.fn();

vi.mock("@/lib/media/strip-metadata", () => ({
  stripFileMetadata: async (file: Blob) => ({ blob: file, stripped: true }),
}));
vi.mock("@/lib/upload/device-id", () => ({ getDeviceId: () => null }));
vi.mock("@/lib/upload/preview", () => ({
  generatePreview: (...args: unknown[]) => generatePreview(...args),
  generatePhoneCopy: async () => null,
  posterPreview: async () => null,
}));

const { uploadBurst, UPLOAD_WORDS } = await import("./uploader");

const MB = 1024 ** 2;
/** Every event, in order: a PUT's start and end (by its file's name), a preview made (by name), a request. */
const log: string[] = [];

type Entry = Record<string, unknown>;
type Call = { url: string; body: { files: Entry[] }; keepalive?: boolean };
const calls: Call[] = [];
const presigns = () => calls.filter((c) => c.url.includes("presign"));
const completes = () => calls.filter((c) => c.url.includes("complete"));

/** A media id per presigned file, named for its file so a PUT says whose bytes it carries. */
const idOf = (name: string) => `id-${name}`;
let presignAnswer: (files: Entry[], call: number) => unknown;
let completeAnswer: (files: Entry[], call: number) => unknown;
const presigned = (f: Entry) => ({
  ok: true,
  strategy: "single",
  media_id: idOf(String(f.name)),
  key: `events/e/photo/${idOf(String(f.name))}/original.jpg`,
  content_type: f.content_type,
  url: `https://r2.example/${f.name}`,
  headers: {},
});

/** A request held in the air until a case lets it go (the second presign, the first complete). */
let presignGate: Promise<void> | null;
let completeGate: Promise<void> | null;

/** How long a PUT takes (by its file's name), and whether it drops. */
let putMs: (name: string) => number;
let drops: (name: string) => boolean;
/** How many progress reports a PUT makes on its way, evenly paced (1: a single one as it lands). */
let steps: (name: string) => number;
/**
 * How long R2 takes to answer once the browser has handed it the last byte (by name): the line draining what the
 * browser already counted as sent, and the answer itself (0: the answer comes with the last byte).
 */
let answerMs: (name: string) => number;
/** How long a presign takes to answer, and how long preparing a file takes (by its name). */
let presignMs: number;
let prepMs: (name: string) => number;
/** When each logged moment happened, on the (fake) clock. */
const at: Record<string, number> = {};

class FakeXhr {
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  upload = {
    onprogress: null as ((e: ProgressEvent) => void) | null,
    onload: null as (() => void) | null,
  };
  private name = "";
  private timers: ReturnType<typeof setTimeout>[] = [];
  open(_method: string, url: string) {
    this.name = url.split("/").pop()!;
  }
  setRequestHeader() {}
  getResponseHeader() {
    return '"etag"';
  }
  abort() {
    for (const t of this.timers) clearTimeout(t);
    this.onabort?.();
  }
  send(body: Blob) {
    log.push(`put ${this.name}`);
    at[`put ${this.name}`] = Date.now();
    const total = putMs(this.name);
    const reports = steps(this.name);
    for (let k = 1; k < reports; k++) {
      this.timers.push(
        setTimeout(
          () =>
            this.upload.onprogress?.({
              lengthComputable: true,
              loaded: (body.size * k) / reports,
              total: body.size,
            } as ProgressEvent),
          (total * k) / reports,
        ),
      );
    }
    const land = () => {
      this.status = 200;
      log.push(`landed ${this.name}`);
      at[`landed ${this.name}`] = Date.now();
      this.onload?.();
    };
    this.timers.push(
      setTimeout(() => {
        if (drops(this.name)) {
          this.onerror?.();
          return;
        }
        this.upload.onprogress?.({
          lengthComputable: true,
          loaded: body.size,
          total: body.size,
        } as ProgressEvent);
        this.upload.onload?.();
        at[`handed off ${this.name}`] = Date.now();
        const wait = answerMs(this.name);
        if (wait > 0) this.timers.push(setTimeout(land, wait));
        else land();
      }, total),
    );
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

/** A page whose visibility a case can turn (the recording's third moment). */
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
  log.length = 0;
  calls.length = 0;
  page.visibilityState = "visible";
  page.listeners.clear();
  putMs = () => 50;
  drops = () => false;
  steps = () => 1;
  answerMs = () => 0;
  presignMs = 0;
  prepMs = () => 0;
  for (const k of Object.keys(at)) delete at[k];
  presignGate = null;
  completeGate = null;
  presignAnswer = (files) => ({ ok: true, files: files.map(presigned) });
  completeAnswer = (files) => ({
    ok: true,
    files: files.map(() => ({ ok: true, status: "approved" })),
  });
  generatePreview.mockReset().mockImplementation(async (file: File) => {
    const ms = prepMs(file.name);
    if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
    log.push(`prepared ${file.name}`);
    at[`prepared ${file.name}`] = Date.now();
    return null;
  });
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
    vi.fn(async (url: string, init: { body: string; keepalive?: boolean }) => {
      const body = JSON.parse(init.body) as { files: Entry[] };
      calls.push({ url, body, keepalive: init.keepalive });
      log.push(url.includes("presign") ? "presign" : "complete");
      if (url.includes("presign"))
        at[`presign ${presigns().length}`] = Date.now();
      if (url.includes("presign") && presignMs > 0)
        await new Promise((resolve) => setTimeout(resolve, presignMs));
      if (url.includes("presign") && presigns().length > 1) await presignGate;
      if (url.includes("complete")) await completeGate;
      // The presign's entries carry no name (none leaves the phone): the stand-in names them by size.
      const files = body.files.map((f) => ({
        ...f,
        name: f.media_id ? String(f.media_id).slice(3) : `f${f.size_bytes}`,
      }));
      const answer = url.includes("presign")
        ? presignAnswer(files, presigns().length)
        : completeAnswer(files, completes().length);
      const refused =
        typeof answer === "object" &&
        answer !== null &&
        (answer as { ok?: unknown }).ok === false;
      return new Response(JSON.stringify(answer), {
        status: refused ? 403 : 200,
      });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A photograph whose declared size names it (`f<size>`), its bytes never allocated past a few. */
function photo(size: number): File {
  const file = new File([new Uint8Array(4)], `f${size}`, {
    type: "image/jpeg",
  });
  Object.defineProperty(file, "size", { value: size });
  return file;
}
const burstOf = (count: number, base = 1000) =>
  Array.from({ length: count }, (_, i) => photo(base + i));

async function send(
  files: File[],
  opts: { signal?: AbortSignal; run?: number } = {},
) {
  const seen: number[] = [];
  const going = uploadBurst({
    files: files.map((file) => ({ file })),
    endpoints: {
      presign: "/api/r2/presign-upload",
      complete: "/api/r2/complete-upload",
    },
    identity: { session_token: "t" },
    signal: opts.signal,
    onOutcome: (i) => seen.push(i),
  });
  await vi.advanceTimersByTimeAsync(opts.run ?? 60_000);
  return { out: await going, seen };
}

describe("a burst is one presign and as few completes as its landing allows", () => {
  it("★ ten files: two presigns (the first alone, the rest together) and one complete", async () => {
    const files = burstOf(10);
    const { out, seen } = await send(files);
    expect(presigns().map((c) => c.body.files.length)).toEqual([1, 9]);
    expect(completes().map((c) => c.body.files.length)).toEqual([10]);
    // Each file's own answer, in order, and each settled once.
    expect(out.map((o) => o.ok && o.mediaId)).toEqual(
      files.map((f) => idOf(f.name)),
    );
    expect([...seen].sort((a, b) => a - b)).toEqual(files.map((_, i) => i));
    // The complete names each file's own presigned key, in order.
    expect(completes()[0]!.body.files.map((f) => f.media_id)).toEqual(
      files.map((f) => idOf(f.name)),
    );
  });

  it("the first file's bytes start before the rest are presigned: a byte never waits for batching", async () => {
    await send(burstOf(4));
    expect(log.indexOf("put f1000")).toBeGreaterThan(-1);
    expect(log.indexOf("put f1000")).toBeLessThan(log.indexOf("put f1001"));
    // The second presign went while the first file's bytes were in the air.
    const second = log.indexOf("presign", log.indexOf("presign") + 1);
    expect(second).toBeLessThan(log.indexOf("landed f1000"));
  });

  it("the identity rides once at the top of each request; no file name leaves the phone", async () => {
    await send(burstOf(2));
    for (const c of calls) {
      expect(c.body).toMatchObject({ session_token: "t" });
      for (const f of c.body.files)
        expect(f).not.toHaveProperty("session_token");
    }
    for (const c of presigns()) {
      expect(JSON.stringify(c.body)).not.toContain("f100");
    }
  });

  it(`more than ${MAX_BURST_FILES} files ride more than one request each, never past the limit`, async () => {
    await send(burstOf(MAX_BURST_FILES + 5));
    for (const c of calls) {
      expect(c.body.files.length).toBeLessThanOrEqual(MAX_BURST_FILES);
    }
    expect(completes().reduce((sum, c) => sum + c.body.files.length, 0)).toBe(
      MAX_BURST_FILES + 5,
    );
  });
});

describe("★ a file refused never stops its siblings", () => {
  it("refused at presign: it alone fails, in the server's words, and its siblings land", async () => {
    presignAnswer = (files) => ({
      ok: true,
      files: files.map((f) =>
        f.name === "f1003"
          ? {
              ok: false,
              status: 422,
              code: "too_large",
              message: "Files for this event are capped at 2 MB.",
            }
          : presigned(f),
      ),
    });
    const { out } = await send(burstOf(6));
    expect(out[3]).toEqual({
      ok: false,
      code: "too_large",
      message: "Files for this event are capped at 2 MB.",
    });
    expect(out.filter((o) => o.ok)).toHaveLength(5);
    expect(log).not.toContain("put f1003");
    expect(completes()[0]!.body.files.map((f) => f.media_id)).not.toContain(
      idOf("f1003"),
    );
  });

  it("refused at complete: it alone fails, and its siblings are recorded", async () => {
    completeAnswer = (files) => ({
      ok: true,
      files: files.map((f) =>
        f.name === "f1002"
          ? {
              ok: false,
              status: 409,
              code: "roll_spent",
              message: "You've taken all 24 shots on your roll.",
            }
          : { ok: true, status: "approved" },
      ),
    });
    const { out } = await send(burstOf(4));
    expect(out.map((o) => o.ok)).toEqual([true, true, false, true]);
    expect(out[2]).toMatchObject({ code: "roll_spent" });
  });

  it("a PUT that drops fails its file alone, said as the drop it is", async () => {
    drops = (name) => name === "f1001";
    const { out } = await send(burstOf(3));
    expect(out.map((o) => o.ok)).toEqual([true, false, true]);
    expect(out[1]).toEqual({
      ok: false,
      message: UPLOAD_WORDS.dropped,
      cause: "dropped",
    });
    expect(completes()[0]!.body.files).toHaveLength(2);
  });
});

describe("★ a refusal of who is sending is every unasked file's, never asked again", () => {
  it("the first presign refused whole: no byte moves, one request, every file its words", async () => {
    presignAnswer = () => ({
      ok: false,
      code: "session_other_account",
      message: "This upload ticket belongs to someone else.",
    });
    const { out } = await send(burstOf(5));
    expect(presigns()).toHaveLength(1);
    expect(out.every((o) => !o.ok && o.code === "session_other_account")).toBe(
      true,
    );
    expect(log.some((l) => l.startsWith("put"))).toBe(false);
  });

  it("refused at the second presign: the rest meet it, and the file already presigned goes on to its complete", async () => {
    presignAnswer = (files, call) =>
      call === 1
        ? { ok: true, files: files.map(presigned) }
        : { ok: false, code: "uploads_closed", message: "Closed." };
    const { out } = await send(burstOf(5));
    expect(presigns()).toHaveLength(2);
    expect(out[0]).toMatchObject({ ok: true });
    expect(
      out.slice(1).every((o) => !o.ok && o.code === "uploads_closed"),
    ).toBe(true);
    expect(completes()[0]!.body.files).toHaveLength(1);
  });
});

describe("★ when a landed file is recorded", () => {
  it(`waits at most ${BURST_RECORD_WAIT_MS / 1000} s for its siblings`, async () => {
    putMs = () => 6_000;
    const going = uploadBurst({
      files: burstOf(3).map((file) => ({ file })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
    });
    // The first lands at ~6 s, the second at ~12 s: at ~16 s the first has waited its 10 s, and both are recorded.
    await vi.advanceTimersByTimeAsync(15_000);
    expect(completes()).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(completes().map((c) => c.body.files.length)).toEqual([2]);
    // The last one is recorded the moment it lands: nothing is left to go up.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(completes().map((c) => c.body.files.length)).toEqual([2, 1]);
    expect((await going).every((o) => o.ok)).toBe(true);
  });

  it("the page leaving the screen records what landed at once, in a complete that outlives the page", async () => {
    putMs = (name) => (name === "f1000" ? 50 : 30_000);
    const going = uploadBurst({
      files: burstOf(2).map((file) => ({ file })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(completes()).toHaveLength(0);
    page.turn("hidden");
    await vi.advanceTimersByTimeAsync(10);
    expect(completes()).toHaveLength(1);
    expect(completes()[0]!.body.files.map((f) => f.media_id)).toEqual([
      idOf("f1000"),
    ]);
    expect(completes()[0]!.keepalive).toBe(true);
    page.turn("visible");
    await vi.advanceTimersByTimeAsync(70_000);
    expect((await going).every((o) => o.ok)).toBe(true);
  });
});

describe("★ preparing runs ahead of the network, never too far", () => {
  it(`holds at most ${PREP_AHEAD_BYTES / MB} MB of prepared files not yet up (the next one always may)`, async () => {
    putMs = () => 1_000;
    const big = 40 * MB;
    await send([photo(big), photo(big + 1), photo(big + 2)]);
    const at = (entry: string) => log.indexOf(entry);
    // The second is prepared while the first goes (80 MB held); the third only once the first is up.
    expect(at(`prepared f${big + 1}`)).toBeLessThan(at(`landed f${big}`));
    expect(at(`prepared f${big + 2}`)).toBeGreaterThan(at(`landed f${big}`));
  });

  it("small photographs are all prepared while the first goes", async () => {
    putMs = () => 1_000;
    await send(burstOf(8));
    const firstLanded = log.indexOf("landed f1000");
    for (let i = 0; i < 8; i++) {
      expect(log.indexOf(`prepared f${1000 + i}`)).toBeLessThan(firstLanded);
    }
  });
});

describe("★ the network never waits between files (uploads-idempotent)", () => {
  it("★ the next presign is asked once the file in the air has handed off its last byte, so the next file goes as it lands", async () => {
    // A slow phone on a quick line: each file takes 1.5 s to prepare, 4 s to hand its bytes to the browser's network
    // and a second more for the line to drain them and R2 to answer; a presign takes 600 ms. Preparing has not finished
    // when the first file lands, so a presign asked only then left the line idle for its round trip.
    prepMs = () => 1_500;
    putMs = () => 4_000;
    answerMs = () => 1_000;
    steps = () => 20;
    presignMs = 600;
    const { out } = await send(burstOf(5), { run: 60_000 });
    expect(out.every((o) => o.ok)).toBe(true);
    // Asked the moment the first file's last byte was handed off, for every file prepared by then.
    expect(at["presign 2"]).toBe(at["handed off f1000"]);
    expect(presigns()[1]!.body.files.length).toBeGreaterThan(1);
    // So the second file's bytes went the moment the first landed.
    expect(at["put f1001"]! - at["landed f1000"]!).toBeLessThan(50);
    // And never a presign a file: no more often than when it waited for need.
    expect(presigns().length).toBeLessThanOrEqual(3);
  });

  it("a file handed off quicker than a presign's round trip never asks ahead: the network's need asks, as before", async () => {
    // Small on a quick line: preparing is what the network waits for, so an early ask would only split the batch.
    prepMs = () => 400;
    putMs = () => 200;
    answerMs = () => 300;
    steps = () => 4;
    presignMs = 300;
    const { out } = await send(burstOf(5), { run: 60_000 });
    expect(out.every((o) => o.ok)).toBe(true);
    expect(at["presign 2"]).toBeGreaterThanOrEqual(at["landed f1000"]!);
  });

  it("★ the file after one over the budget is prepared while it goes, and presigned in time; the one beyond waits", async () => {
    putMs = () => 5_000;
    steps = () => 50;
    presignMs = 300;
    const big = 100 * MB;
    const { out } = await send([photo(big), photo(big + 1), photo(big + 2)], {
      run: 60_000,
    });
    expect(out.every((o) => o.ok)).toBe(true);
    // The second (the network's next) is prepared and presigned while the first goes: no gap between them.
    expect(at[`prepared f${big + 1}`]).toBeLessThan(at[`landed f${big}`]!);
    expect(at[`put f${big + 1}`]! - at[`landed f${big}`]!).toBeLessThan(50);
    // The third is beyond the next and the budget holds it until the first is up.
    expect(at[`prepared f${big + 2}`]).toBeGreaterThanOrEqual(
      at[`landed f${big}`]!,
    );
  });
});

describe("her cancel", () => {
  it("mid-burst: the file in the air and everything not recorded is cancelled, and no complete is asked", async () => {
    putMs = () => 1_000;
    const ctl = new AbortController();
    const going = uploadBurst({
      files: burstOf(3).map((file) => ({ file })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
      signal: ctl.signal,
    });
    // The first has landed and waits for its siblings; the second is in the air.
    await vi.advanceTimersByTimeAsync(1_500);
    ctl.abort();
    await vi.advanceTimersByTimeAsync(5_000);
    const out = await going;
    expect(out.every((o) => !o.ok && o.cause === "cancelled")).toBe(true);
    expect(completes()).toHaveLength(0);
  });

  it("before anything moved: no request at all", async () => {
    const ctl = new AbortController();
    ctl.abort();
    const { out } = await send(burstOf(3), { signal: ctl.signal });
    expect(calls).toHaveLength(0);
    expect(out.every((o) => !o.ok && o.cause === "cancelled")).toBe(true);
  });
});

describe("one file's own cancel: a burst of three, the middle one", () => {
  /** Three files, each with a stop of its own, and what each was told, in the order it was told. */
  function three() {
    const stops = [0, 1, 2].map(() => new AbortController());
    const told: { i: number; ok: boolean; cause?: string }[] = [];
    const going = uploadBurst({
      files: burstOf(3).map((file, i) => ({ file, signal: stops[i]!.signal })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
      onOutcome: (i, o) =>
        told.push({ i, ok: o.ok, cause: o.ok ? undefined : o.cause }),
    });
    return { stops, told, going };
  }
  const ids = (call: Call | undefined) =>
    call?.body.files.map((f) => f.media_id);

  it("★ the middle one, in the air: it alone is cancelled, its siblings go on and are recorded together without it", async () => {
    putMs = () => 1_000;
    const { stops, told, going } = three();
    // The first has landed and waits for its siblings; the second is in the air.
    await vi.advanceTimersByTimeAsync(1_500);
    expect(log).toContain("put f1001");
    stops[1]!.abort();
    // Told at once, before any sibling is recorded, and only that file.
    await vi.advanceTimersByTimeAsync(0);
    expect(told).toEqual([{ i: 1, ok: false, cause: "cancelled" }]);
    await vi.advanceTimersByTimeAsync(10_000);
    const out = await going;
    expect(out[0]!.ok).toBe(true);
    expect(out[1]).toEqual({
      ok: false,
      message: UPLOAD_WORDS.cancelled,
      cause: "cancelled",
    });
    expect(out[2]!.ok).toBe(true);
    // Its bytes never landed; the third went up after it.
    expect(log).not.toContain("landed f1001");
    expect(log).toContain("landed f1002");
    // The burst is recorded together, one complete, and it never names the cancelled file (nothing is counted).
    expect(completes()).toHaveLength(1);
    expect(ids(completes()[0])).toEqual([idOf("f1000"), idOf("f1002")]);
    // Each file settled once.
    expect(told.map((t) => t.i).sort()).toEqual([0, 1, 2]);
  });

  it("before its turn (presigned, waiting for the file in the air): its bytes never go", async () => {
    putMs = () => 1_000;
    const { stops, going } = three();
    await vi.advanceTimersByTimeAsync(500);
    stops[1]!.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([true, false, true]);
    expect(log).not.toContain("put f1001");
    expect(ids(completes()[0])).toEqual([idOf("f1000"), idOf("f1002")]);
  });

  it("while its presign is in the air: the answer's entry for it is let go, and nothing is sent for it", async () => {
    putMs = () => 1_000;
    let release!: () => void;
    presignGate = new Promise<void>((resolve) => (release = resolve));
    const { stops, going } = three();
    // The first went alone; the second and third ride one presign, held.
    await vi.advanceTimersByTimeAsync(500);
    expect(presigns()).toHaveLength(2);
    stops[1]!.abort();
    release();
    await vi.advanceTimersByTimeAsync(10_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([true, false, true]);
    expect(log).not.toContain("put f1001");
    expect(ids(completes()[0])).toEqual([idOf("f1000"), idOf("f1002")]);
  });

  it("while it is prepared: it is never presigned, and the files after it are not held up for good", async () => {
    putMs = () => 100;
    generatePreview.mockImplementation(async (file: File) => {
      log.push(`prepared ${file.name}`);
      if (file.name === "f1001") await new Promise((r) => setTimeout(r, 500));
      return null;
    });
    const { stops, going } = three();
    await vi.advanceTimersByTimeAsync(200);
    stops[1]!.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([true, false, true]);
    expect(log).not.toContain("put f1001");
    // No presign carried the cancelled file's size (f1001 is named for it).
    const sizes = presigns().flatMap((c) =>
      c.body.files.map((f) => f.size_bytes),
    );
    expect(sizes).not.toContain(1001);
  });

  it("landed and waiting to be recorded with its siblings: it is cancelled, never recorded", async () => {
    // The first lands at once; the second is long in the air, so the first waits.
    putMs = (name) => (name === "f1001" ? 20_000 : 100);
    const { stops, going } = three();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(log).toContain("landed f1000");
    stops[0]!.abort();
    await vi.advanceTimersByTimeAsync(60_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([false, true, true]);
    expect(ids(completes()[0])).toEqual([idOf("f1001"), idOf("f1002")]);
  });

  it("once its complete is asked it cannot be stopped: the abort is ignored and the answer stands", async () => {
    putMs = () => 100;
    let release!: () => void;
    completeGate = new Promise<void>((resolve) => (release = resolve));
    const { stops, going } = three();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(completes()).toHaveLength(1);
    // The row may be recorded: the cancel is no longer hers to make.
    stops[1]!.abort();
    release();
    await vi.advanceTimersByTimeAsync(1_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([true, true, true]);
  });

  it("a stop already pressed: that file never starts, its siblings are none the wiser", async () => {
    const stops = [0, 1, 2].map(() => new AbortController());
    stops[1]!.abort();
    const going = uploadBurst({
      files: burstOf(3).map((file, i) => ({ file, signal: stops[i]!.signal })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
    });
    await vi.advanceTimersByTimeAsync(60_000);
    const out = await going;
    expect(out.map((o) => o.ok)).toEqual([true, false, true]);
    expect(log).not.toContain("prepared f1001");
    expect(ids(completes()[0])).toEqual([idOf("f1000"), idOf("f1002")]);
  });

  it("a stop after its file settled is nothing: no second word is said", async () => {
    const { stops, told, going } = three();
    await vi.advanceTimersByTimeAsync(60_000);
    await going;
    const before = told.length;
    for (const stop of stops) stop.abort();
    expect(told).toHaveLength(before);
  });

  it("the burst's own cancel still ends everything, and a file's stop beside it changes nothing", async () => {
    putMs = () => 1_000;
    const all = new AbortController();
    const one = new AbortController();
    const going = uploadBurst({
      files: burstOf(3).map((file, i) => ({
        file,
        signal: i === 1 ? one.signal : undefined,
      })),
      endpoints: { presign: "/p/presign", complete: "/p/complete" },
      identity: { session_token: "t" },
      signal: all.signal,
    });
    await vi.advanceTimersByTimeAsync(1_500);
    one.abort();
    all.abort();
    await vi.advanceTimersByTimeAsync(5_000);
    const out = await going;
    expect(out.every((o) => !o.ok && o.cause === "cancelled")).toBe(true);
    expect(completes()).toHaveLength(0);
  });
});
