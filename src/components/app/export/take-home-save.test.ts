/**
 * SAVE, ON A PHONE (take-home r1, `save=light`): the engine on stood-in edges. The links come from the route's
 * `save` step, the files from R2 (each answered at its own size), and the phone's share sheet is a spy that keeps
 * what it was handed: 24 phone-size JPEGs into one sheet, a lapsed tap answered with "ready" and one more tap, a
 * dismissed sheet kept in hand, a set past 100 MB in parts, a file that will not come left out and said, and an x
 * that stops everything.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createTakeHomeSaver,
  type SaveState,
} from "@/components/app/export/take-home-save";
import type { ToastView } from "@/components/app/export/export-walk";
import type { SaveItem } from "@/lib/export/take-home";

const MB = 1024 * 1024;
const PHONE = Math.round(0.55 * MB);

function items(
  n: number,
  bytes = PHONE,
  type: "photo" | "video" = "photo",
): SaveItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${type}-${i}`,
    type,
    url: `https://r2.example/${type}-${i}`,
    name: `maya-jay-${String(i).padStart(8, "0")}.${type === "photo" ? "jpg" : "mp4"}`,
    bytes,
  }));
}

type World = {
  saver: ReturnType<typeof createTakeHomeSaver>;
  shared: File[][];
  toasts: ToastView[];
  dismissed: string[];
  states: SaveState[];
  downloads: string[];
  fileReads: string[];
  share: ReturnType<typeof vi.fn>;
  nav: { userActivation: { isActive: boolean } };
};

function world(opts: {
  answer: SaveItem[] | { status: number; body: unknown };
  /** URLs whose reads fail every time. */
  broken?: Set<string>;
  /** URLs whose reads never reach the app: the fetch rejects (a dropped network), every time. */
  dropped?: Set<string>;
  /** The route's own request fails outright (a dropped network) instead of answering. */
  askRejects?: boolean;
  active?: boolean;
  /** What the sheet does: resolve (saved), or reject with a name. */
  sheet?: () => Promise<void>;
  /** File reads that never answer until they are aborted (a party's network, mid-Save). */
  hang?: boolean;
}): World {
  const shared: File[][] = [];
  const toasts: ToastView[] = [];
  const dismissed: string[] = [];
  const states: SaveState[] = [];
  const downloads: string[] = [];
  const fileReads: string[] = [];
  const nav = {
    userActivation: { isActive: opts.active ?? true },
    canShare: () => true,
    share: vi.fn(async (data: ShareData) => {
      shared.push([...(data.files ?? [])]);
      await (opts.sheet ?? (async () => {}))();
    }),
  };
  const byUrl = new Map(
    (Array.isArray(opts.answer) ? opts.answer : []).map((i) => [i.url, i]),
  );
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/export/")) {
        if (opts.askRejects) throw new TypeError("Failed to fetch");
        const a = opts.answer;
        return Array.isArray(a)
          ? new Response(JSON.stringify({ ok: true, items: a, more: false }), {
              status: 200,
            })
          : new Response(JSON.stringify(a.body), { status: a.status });
      }
      fileReads.push(url);
      if (opts.hang) {
        await new Promise((_, reject) =>
          init?.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          ),
        );
      }
      if (opts.broken?.has(url)) return new Response("no", { status: 403 });
      if (opts.dropped?.has(url)) throw new TypeError("Failed to fetch");
      const item = byUrl.get(url)!;
      return new Response(new Uint8Array(item.bytes), {
        status: 200,
        headers: {
          "content-type": item.type === "photo" ? "image/jpeg" : "video/mp4",
          "content-length": String(item.bytes),
        },
      });
    },
  );
  let n = 0;
  const saver = createTakeHomeSaver({
    fetch: fetcher as unknown as typeof fetch,
    nav,
    toast: {
      show: (_id, view) => toasts.push(view),
      dismiss: (id) => dismissed.push(id),
    },
    download: (url) => downloads.push(url),
    newId: () => `save-${++n}`,
    onState: (s) => states.push(s),
  });
  return {
    saver,
    shared,
    toasts,
    dismissed,
    states,
    downloads,
    fileReads,
    share: nav.share,
    nav,
  };
}

const last = <T>(xs: T[]) => xs[xs.length - 1];
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => vi.clearAllMocks());

describe("a guest's 24 picks into Photos", () => {
  it("fetches all 24 at phone size and hands them to one sheet, inside the tap", async () => {
    const w = world({ answer: items(24) });
    await w.saver.start("guest", { qr_token: "q", ids: ["a"], size: "phone" });
    expect(w.shared).toHaveLength(1);
    const files = w.shared[0];
    expect(files).toHaveLength(24);
    expect(files[0].name).toBe("maya-jay-00000000.jpg");
    expect(files[0].type).toBe("image/jpeg");
    expect(files.reduce((s, f) => s + f.size, 0)).toBe(24 * PHONE);
    expect(last(w.toasts)).toMatchObject({
      tone: "done",
      title: "Saved 24 photos.",
    });
    expect(last(w.states)).toEqual({ kind: "done" });
  });

  it("counts the bytes as they come, in the board's own words, the ring filling to whole", async () => {
    const w = world({ answer: items(24) });
    await w.saver.start("guest", { qr_token: "q" });
    const getting = w.states.filter(
      (s): s is Extract<SaveState, { kind: "getting" }> => s.kind === "getting",
    );
    expect(getting[0].progress).toBe(0);
    expect(last(getting).progress).toBe(1);
    expect(w.toasts.map((t) => t.title)).toContain(
      "Getting 24 photos: 13.2 MB of 13.2 MB",
    );
    // Every wait carries its x.
    const wait = w.toasts.find((t) => t.tone === "wait");
    expect(wait && "close" in wait && wait.close.label).toBe("Stop saving");
  });

  it("asks the route for the links at phone size, once", async () => {
    const w = world({ answer: items(3) });
    await w.saver.start("guest", {
      qr_token: "q",
      ids: ["a", "b", "c"],
      size: "phone",
    });
    expect(w.fileReads).toHaveLength(3);
  });
});

describe("a tap that lapsed, a sheet dismissed", () => {
  it("says the files are ready and opens the sheet on the next tap, never fetching them twice", async () => {
    const w = world({ answer: items(24), active: false });
    await w.saver.start("guest", { qr_token: "q" });
    expect(w.share).not.toHaveBeenCalled();
    expect(last(w.states)).toEqual({ kind: "ready", part: 1, parts: 1 });
    const ready = last(w.toasts);
    expect(ready).toMatchObject({ tone: "between", title: "24 photos ready." });
    // Her tap, on the toast's Save or on the caller's own control.
    w.nav.userActivation.isActive = true;
    w.saver.tap();
    await settle();
    expect(w.shared).toHaveLength(1);
    expect(w.fileReads).toHaveLength(24);
    expect(last(w.toasts)).toMatchObject({ tone: "done" });
  });

  it("keeps the files in hand when she dismisses the sheet, for one more tap", async () => {
    let first = true;
    const w = world({
      answer: items(5),
      sheet: async () => {
        if (first) {
          first = false;
          throw Object.assign(new Error("dismissed"), { name: "AbortError" });
        }
      },
    });
    await w.saver.start("guest", { qr_token: "q" });
    expect(last(w.states)).toEqual({ kind: "ready", part: 1, parts: 1 });
    w.saver.tap();
    await settle();
    expect(w.shared).toHaveLength(2);
    expect(w.shared[1]).toHaveLength(5);
    expect(w.fileReads).toHaveLength(5);
    expect(last(w.toasts)).toMatchObject({ title: "Saved 5 photos." });
  });

  it("a tap while files still arrive does nothing", async () => {
    const w = world({ answer: items(2) });
    const going = w.saver.start("guest", { qr_token: "q" });
    w.saver.tap();
    await going;
    expect(w.shared).toHaveLength(1);
  });
});

describe("past one sheet, in parts", () => {
  it("fills each sheet up to 100 MB, and the next part is a tap", async () => {
    // 200 phone-size photographs: 181 in the first sheet, 19 in the second.
    const w = world({ answer: items(200) });
    await w.saver.start("host", {
      event_id: "e",
      types: "photo",
      size: "phone",
    });
    expect(w.shared.map((s) => s.length)).toEqual([181]);
    const between = last(w.toasts);
    expect(between).toMatchObject({
      tone: "between",
      title: "Part 1 of 2 is saved.",
    });
    expect(between.tone === "between" && between.action.label).toBe(
      "Get part 2",
    );
    expect(last(w.states)).toEqual({ kind: "ready", part: 2, parts: 2 });
    w.saver.tap();
    await settle();
    await settle();
    expect(w.shared.map((s) => s.length)).toEqual([181, 19]);
    expect(last(w.toasts)).toMatchObject({ title: "Saved 200 photos." });
  });
});

describe("what cannot come", () => {
  it("tries a broken file twice, leaves it out, and says so", async () => {
    const set = items(4);
    const w = world({ answer: set, broken: new Set([set[2].url]) });
    await w.saver.start("guest", { qr_token: "q" });
    expect(w.fileReads.filter((u) => u === set[2].url)).toHaveLength(2);
    expect(w.shared[0]).toHaveLength(3);
    expect(last(w.toasts)).toMatchObject({
      tone: "done",
      title: "Saved 3 photos. 1 couldn't be saved.",
    });
  });

  it("downloads a clip too heavy for any sheet as a file, and says so", async () => {
    const big = items(1, 140 * MB, "video");
    const w = world({ answer: [...items(2), ...big] });
    await w.saver.start("guest", { qr_token: "q" });
    expect(w.shared[0]).toHaveLength(2);
    expect(w.downloads).toEqual([big[0].url]);
    expect(last(w.toasts).title).toBe(
      "Saved 2 photos. 1 video was too big for Photos: it downloads as a file.",
    );
  });

  it("a refused Save says so with a Try again, and reads no file", async () => {
    const w = world({
      answer: { status: 403, body: { ok: false, code: "forbidden" } },
    });
    await w.saver.start("guest", { qr_token: "q" });
    expect(w.fileReads).toHaveLength(0);
    expect(last(w.toasts)).toMatchObject({
      tone: "refused",
      title: "Couldn't get your photos. Try again.",
    });
    expect(last(w.states)).toEqual({ kind: "idle" });
  });

  it("a set past one Save's 2,000 is refused whole, never saved in part, with no Try again", async () => {
    // The route hands back its first 2,000 and says there were more: saving those would leave the rest behind
    // while the toast said "Saved 2,000 photos", so the engine reads nothing and says where all of them go.
    const w = world({
      answer: { status: 200, body: { ok: true, items: items(3), more: true } },
    });
    await w.saver.start("guest", { qr_token: "q", set: "album" });
    expect(w.fileReads).toHaveLength(0);
    expect(w.share).not.toHaveBeenCalled();
    expect(last(w.toasts)).toMatchObject({
      tone: "refused",
      title: "Photos takes up to 2,000 at a time: the originals take them all.",
    });
    const said = last(w.toasts);
    expect(
      said.tone === "refused" ? said.action : "not refused",
    ).toBeUndefined();
    expect(last(w.states)).toEqual({ kind: "idle" });
  });
});

/** The question's answer, by its label. */
function answer(view: ToastView | undefined, label: string) {
  if (view?.tone !== "confirm") throw new Error(`not asking: ${view?.tone}`);
  const found = view.actions.find((a) => a.label === label);
  if (!found) throw new Error(`no answer "${label}"`);
  return found;
}

// E6 (Will 2026-10-04): a cancel is intentional, so the toast's x (and the foot's press) asks first, then says it was
// cancelled with a Try again; and a dropped connection is never hidden.
describe("the x asks first (E6)", () => {
  it("★ asks 'Stop saving?' with Keep going first, and cancels nothing on the press alone", async () => {
    const w = world({ answer: items(24), hang: true });
    const going = w.saver.start("guest", { qr_token: "q" });
    await settle();
    expect(w.fileReads.length).toBeGreaterThan(0);

    w.saver.cancel();
    expect(last(w.toasts)).toMatchObject({
      tone: "confirm",
      title: "Stop saving?",
      actions: [{ label: "Keep going" }, { label: "Stop saving" }],
    });
    // Nothing has stopped: the run is alive and its toast is not dismissed.
    expect(w.saver.busy).toBe(true);
    expect(w.dismissed).toEqual([]);

    answer(last(w.toasts), "Keep going").run();
    expect(last(w.toasts)).toMatchObject({ tone: "wait" });
    // Leave it for real, so the hung reads end.
    w.saver.stop();
    await going;
  });

  it("★ Stop saving says it was cancelled, neutral, with Try again, and no sheet opens", async () => {
    const w = world({ answer: items(24), hang: true });
    const going = w.saver.start("guest", { qr_token: "q" });
    await settle();
    w.saver.cancel();
    answer(last(w.toasts), "Stop saving").run();
    await going;

    expect(w.share).not.toHaveBeenCalled();
    expect(w.saver.busy).toBe(false);
    expect(last(w.states)).toEqual({ kind: "idle" });
    const said = last(w.toasts);
    expect(said).toMatchObject({
      tone: "cancelled",
      title: "Saving cancelled.",
      action: { label: "Try again" },
      close: { label: "Dismiss" },
      duration: 8000,
    });

    // Try again is the Save again, from its start.
    if (said.tone !== "cancelled" || !said.action) throw new Error("no retry");
    const reads = w.fileReads.length;
    said.action.run();
    await settle();
    expect(w.fileReads.length).toBeGreaterThan(reads);
  });

  it("★ hands nothing to the phone's sheet while the question stands, then Keep going lets the files wait for a tap", async () => {
    const w = world({ answer: items(3) });
    const going = w.saver.start("guest", { qr_token: "q" });
    // The press comes while the links and files are still on their way.
    w.saver.cancel();
    await settle();
    await settle();
    await settle();
    expect(w.fileReads).toHaveLength(3);
    expect(w.share).not.toHaveBeenCalled();
    expect(last(w.toasts)).toMatchObject({ tone: "confirm" });

    answer(last(w.toasts), "Keep going").run();
    await going;
    // The sheet opens, or waits for one more tap where the first has lapsed: never a failure.
    expect(w.shared.length === 1 || last(w.states).kind === "ready").toBe(true);
  });

  it("past the first part, Stop here says where she stopped and keeps the tap that takes the rest", async () => {
    const w = world({ answer: items(200) });
    await w.saver.start("host", { event_id: "e", types: "photo" });
    expect(last(w.toasts)).toMatchObject({
      tone: "between",
      title: "Part 1 of 2 is saved.",
    });

    w.saver.cancel();
    expect(last(w.toasts)).toMatchObject({
      tone: "confirm",
      title: "Stop after part 1 of 2?",
      detail: "Part 2 won't be saved.",
      actions: [{ label: "Keep going" }, { label: "Stop here" }],
    });
    // A tap meanwhile does nothing: the question comes first.
    w.saver.tap();
    await settle();
    expect(w.shared).toHaveLength(1);

    answer(last(w.toasts), "Stop here").run();
    expect(last(w.toasts)).toMatchObject({
      tone: "between",
      title: "Stopped after part 1 of 2.",
      action: { label: "Get part 2" },
      close: { label: "Dismiss" },
    });
    expect(w.saver.busy).toBe(true);
    expect(last(w.states)).toEqual({ kind: "ready", part: 2, parts: 2 });

    // The rest is still hers to take.
    w.saver.tap();
    await settle();
    await settle();
    expect(w.shared.map((s) => s.length)).toEqual([181, 19]);
    expect(last(w.toasts)).toMatchObject({ title: "Saved 200 photos." });
  });

  it("stop() is still the page leaving: at once, silent, nothing asked", async () => {
    const w = world({ answer: items(24), hang: true });
    const going = w.saver.start("guest", { qr_token: "q" });
    await settle();
    w.saver.stop();
    await going;
    expect(w.toasts.some((t) => t.tone === "confirm")).toBe(false);
    expect(w.toasts.some((t) => t.tone === "cancelled")).toBe(false);
  });
});

describe("a dropped connection is never hidden (E6)", () => {
  it("★ links that never arrive say the connection dropped, with what to do and a Try again", async () => {
    const w = world({ answer: items(3), askRejects: true });
    await w.saver.start("guest", { qr_token: "q" });
    expect(last(w.toasts)).toMatchObject({
      tone: "refused",
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
      action: { label: "Try again" },
    });
    expect(w.fileReads).toHaveLength(0);
  });

  it("an app that answers an error is not a dropped connection: it keeps its sentence", async () => {
    const w = world({ answer: { status: 500, body: { ok: false } } });
    await w.saver.start("guest", { qr_token: "q" });
    const said = last(w.toasts);
    expect(said).toMatchObject({
      tone: "refused",
      title: "Couldn't get your photos. Try again.",
    });
    expect((said as { detail?: unknown }).detail).toBeUndefined();
  });

  it("★ files the line dropped say so beside what did save, and stay until she puts it away", async () => {
    const set = items(4);
    const w = world({
      answer: set,
      dropped: new Set([set[1].url, set[2].url]),
    });
    await w.saver.start("guest", { qr_token: "q" });
    expect(w.shared[0]).toHaveLength(2);
    expect(last(w.toasts)).toMatchObject({
      tone: "short",
      title: "Saved 2 photos. 2 couldn't be saved.",
      detail:
        "Your connection dropped. Check your signal, then save those again.",
      close: { label: "Dismiss" },
    });
  });

  it("a file the app refused (not a dropped read) keeps the plain, brief word", async () => {
    const set = items(4);
    const w = world({ answer: set, broken: new Set([set[2].url]) });
    await w.saver.start("guest", { qr_token: "q" });
    expect(last(w.toasts)).toMatchObject({
      tone: "done",
      title: "Saved 3 photos. 1 couldn't be saved.",
    });
  });
});

describe("the x", () => {
  it("stops every read and lets the files go: no sheet opens", async () => {
    const w = world({ answer: items(24), hang: true });
    const going = w.saver.start("guest", { qr_token: "q" });
    await settle();
    expect(w.fileReads.length).toBeGreaterThan(0);
    w.saver.stop();
    await going;
    expect(w.share).not.toHaveBeenCalled();
    expect(w.dismissed).toEqual(["save-1"]);
    expect(last(w.states)).toEqual({ kind: "idle" });
    expect(w.saver.busy).toBe(false);
  });
});
