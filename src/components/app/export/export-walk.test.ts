/**
 * THE DOWNLOAD'S WALK (`export-walk.ts`), with the network, the Worker and the toast stood in for.
 *
 * What `export-flow` r1 asked of it, pinned: the toast stays until the file is handed over and
 * carries an x that really stops things (`wait=toast`, `stuck=retry` and his "subtle x"); two quiet
 * re-attempts before a word is said; an empty zip is never sent and is refused in one line
 * (`hollow=refuse`); a short one is counted with a Try again for exactly what it missed; a big album
 * is walked as parts, a tap each, ending on "That's everything" (`cap=split`); and a check that
 * cannot answer never stops a download.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createExportWalker,
  readSavedWalks,
  type SavedWalk,
  type ToastView,
  type WalkStore,
} from "@/components/app/export/export-walk";
import type { DownloadPlace } from "@/lib/export/walk";

const WORKER = "https://partyreel-export.example.workers.dev";
const CHECK = `${WORKER}/check`;

type Scripted =
  | { status: number; body: unknown }
  /** The request never answers (a party network's dropped request), until it is aborted. */
  | "hang"
  /** The request fails outright (offline, or CORS against a Worker from before the check). */
  | "network";

type Call = { url: string; init: RequestInit };

function harness(place: DownloadPlace = "desk", store?: WalkStore) {
  const mints: Scripted[] = [];
  const checks: Scripted[] = [];
  const calls: Call[] = [];
  const posted: [string, string][] = [];
  const shown: { id: string; view: ToastView }[] = [];
  const dismissed: string[] = [];
  let ids = 0;

  const fetchFn = ((input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const queue = url === CHECK ? checks : mints;
    const next = queue.shift();
    if (!next) throw new Error(`nothing scripted for ${url}`);
    return new Promise<Response>((resolve, reject) => {
      const signal = init.signal;
      const abort = () => reject(new DOMException("aborted", "AbortError"));
      if (signal?.aborted) return abort();
      signal?.addEventListener("abort", abort);
      if (next === "hang") return;
      if (next === "network") return reject(new TypeError("Failed to fetch"));
      resolve(
        new Response(JSON.stringify(next.body), {
          status: next.status,
          headers: { "content-type": "application/json" },
        }),
      );
    });
  }) as typeof fetch;

  const walker = createExportWalker({
    fetch: fetchFn,
    post: (url, token) => posted.push([url, token]),
    toast: {
      show: (id, view) => shown.push({ id, view }),
      dismiss: (id) => dismissed.push(id),
    },
    place: () => place,
    sleep: () => Promise.resolve(),
    newId: () => `walk-${++ids}`,
    store,
  });

  /** The toast as it stands now, for one walk. */
  const now = (id = "walk-1") => {
    const views = shown.filter((s) => s.id === id);
    return views.at(-1)?.view;
  };
  const mintBodies = () =>
    calls
      .filter((c) => c.url.startsWith("/api/export/"))
      .map((c) => JSON.parse(String(c.init.body)) as Record<string, unknown>);

  return {
    walker,
    mints,
    checks,
    calls,
    posted,
    shown,
    dismissed,
    now,
    mintBodies,
  };
}

/** A mint's answer: one part unless told otherwise. */
const minted = (over: Record<string, unknown> = {}) => ({
  status: 200,
  body: {
    ok: true,
    token: "tok-1",
    workerUrl: WORKER,
    checkUrl: CHECK,
    part: 1,
    parts: 1,
    next: null,
    items: 148,
    bytes: 1,
    ...over,
  },
});

const counted = (items: number, missing: string[] = []) => ({
  status: 200,
  body: { ok: true, items, found: items - missing.length, missing },
});

/** Let every pending promise and zero-delay step run. */
const settle = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.useRealTimers();
});

describe("one zip", () => {
  it("says it is preparing, hands the file over after the Worker's count, then says so", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(counted(148));

    const handed = await h.walker.start("guest", {
      qr_token: "qr",
      types: "all",
    });

    expect(handed).toBe(true);
    expect(h.shown[0].view).toMatchObject({
      tone: "wait",
      title: "Preparing your download…",
      close: { label: "Cancel download" },
    });
    expect(h.mintBodies()).toEqual([
      { step: "mint", qr_token: "qr", types: "all", part: 1 },
    ]);
    // The check carries the token as plain text, with no credential: a CORS "simple" request.
    const check = h.calls.find((c) => c.url === CHECK);
    expect(check?.init).toMatchObject({
      method: "POST",
      body: "tok-1",
      credentials: "omit",
      headers: { "content-type": "text/plain;charset=UTF-8" },
    });
    expect(h.posted).toEqual([[WORKER, "tok-1"]]);
    expect(h.now()).toEqual({
      tone: "done",
      title: "Your download is starting.",
      duration: 4000,
    });
  });

  it("names where a phone keeps it", async () => {
    for (const [place, said] of [
      ["files", "Saving to your Files app."],
      ["downloads", "Saving to your Downloads."],
    ] as const) {
      const h = harness(place);
      h.mints.push(minted());
      h.checks.push(counted(3));
      await h.walker.start("guest", { qr_token: "qr" });
      expect(h.now()).toMatchObject({ tone: "done", title: said });
    }
  });

  it("goes straight to the file when the server names no check", async () => {
    const h = harness();
    h.mints.push(minted({ checkUrl: undefined }));
    await h.walker.start("host", { event_id: "e" });
    expect(h.calls.map((c) => c.url)).toEqual(["/api/export/host"]);
    expect(h.posted).toHaveLength(1);
  });
});

describe("a tap with no answer (stuck=retry)", () => {
  it("re-attempts twice without a word, then says it could not start, with Try again", async () => {
    const h = harness();
    h.mints.push("network", "network", "network");

    const handed = await h.walker.start("host", { event_id: "e" });

    expect(handed).toBe(false);
    expect(h.mintBodies()).toHaveLength(3);
    // One wait the whole time: the re-attempts are silent.
    expect(h.shown.map((s) => s.view.tone)).toEqual(["wait", "refused"]);
    const failed = h.now();
    expect(failed).toMatchObject({
      tone: "refused",
      title: "Couldn't start that download.",
      action: { label: "Try again" },
    });
    expect(h.posted).toEqual([]);

    // Try again takes the same part again, and this time it lands.
    h.mints.push(minted());
    h.checks.push(counted(148));
    if (failed?.tone !== "refused" || !failed.action)
      throw new Error("no Try again");
    failed.action.run();
    await settle();
    expect(h.posted).toHaveLength(1);
    expect(h.now()).toMatchObject({ tone: "done" });
  });

  it("a hang is a timeout: the ceiling ends it and the next try goes", async () => {
    vi.useFakeTimers();
    const h = harness();
    h.mints.push("hang", minted());
    h.checks.push(counted(148));

    const handed = h.walker.start("host", { event_id: "e" });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await handed).toBe(true);

    expect(h.calls[0].init.signal?.aborted).toBe(true);
    expect(h.posted).toHaveLength(1);
  });

  it("a server error with no settled reason is tried again; a pause is said at once", async () => {
    const h = harness();
    h.mints.push({ status: 500, body: { ok: false, code: "error" } }, minted());
    h.checks.push(counted(1));
    await h.walker.start("host", { event_id: "e" });
    expect(h.mintBodies()).toHaveLength(2);
    expect(h.posted).toHaveLength(1);

    const paused = harness();
    paused.mints.push({
      status: 503,
      body: {
        ok: false,
        code: "paused",
        message: "Downloads are paused right now. Please try again later.",
      },
    });
    await paused.walker.start("host", { event_id: "e" });
    expect(paused.mintBodies()).toHaveLength(1);
    expect(paused.now()).toMatchObject({
      tone: "refused",
      title: "Downloads are paused right now. Please try again later.",
    });
    expect((paused.now() as { action?: unknown }).action).toBeUndefined();
  });

  it("a refusal on purpose is said in the server's words, once, with nothing to press but the x", async () => {
    const h = harness();
    h.mints.push({
      status: 429,
      body: {
        ok: false,
        code: "rate_limited",
        message:
          "Too many downloads from this network right now. Please wait a bit.",
      },
    });
    await h.walker.start("guest", { qr_token: "qr" });
    expect(h.mintBodies()).toHaveLength(1);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title:
        "Too many downloads from this network right now. Please wait a bit.",
      close: { label: "Dismiss" },
    });
    expect((h.now() as { action?: unknown }).action).toBeUndefined();
  });
});

describe("the x (his note: interruptibility)", () => {
  it("cancels a mint in flight: aborted, dismissed, and never posted, whatever arrives late", async () => {
    const h = harness();
    h.mints.push("hang");
    const handed = h.walker.start("host", { event_id: "e" });
    await settle();

    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();

    expect(await handed).toBe(false);
    expect(h.calls[0].init.signal?.aborted).toBe(true);
    expect(h.dismissed).toEqual(["walk-1"]);
    expect(h.posted).toEqual([]);
    // Nothing said after the x: the toast it dismissed stays dismissed.
    expect(h.shown).toHaveLength(1);
  });

  it("cancels the Worker's check in flight: its fetch is aborted, so the Worker stops reading", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push("hang");
    const handed = h.walker.start("guest", { qr_token: "qr" });
    await settle();
    await settle();

    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();

    expect(await handed).toBe(false);
    const check = h.calls.find((c) => c.url === CHECK);
    expect(check?.init.signal?.aborted).toBe(true);
    expect(h.posted).toEqual([]);
  });

  it("cannot be swiped past: every waiting state carries it", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    for (const { view } of h.shown) {
      if (view.tone === "done") continue;
      expect(view.close.label.length).toBeGreaterThan(0);
    }
    expect(h.now()).toMatchObject({
      tone: "between",
      close: { label: "Stop after this part" },
    });
  });
});

describe("a zip with nothing in it (hollow=refuse)", () => {
  it("is never sent: refused in one line, with Try again", async () => {
    const h = harness();
    h.mints.push(minted({ items: 3 }));
    h.checks.push(counted(3, ["m1", "m2", "m3"]));

    const handed = await h.walker.start("guest", { qr_token: "qr" });

    expect(handed).toBe(false);
    expect(h.posted).toEqual([]);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Nothing left to download.",
      action: { label: "Try again" },
    });
  });

  it("the mint's own empty is the same line", async () => {
    const h = harness();
    h.mints.push({
      status: 400,
      body: { ok: false, code: "empty", message: "Nothing left to download." },
    });
    await h.walker.start("host", { event_id: "e" });
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Nothing left to download.",
      action: { label: "Try again" },
    });
  });
});

describe("a short zip (failed=exact's register)", () => {
  it("is sent and counted, with a Try again for exactly the ones it missed", async () => {
    const h = harness();
    const missing = ["m1", "m2", "m3", "m4", "m5", "m6"];
    h.mints.push(minted());
    h.checks.push(counted(148, missing));

    await h.walker.start("guest", {
      qr_token: "qr",
      set: "yours",
      types: "all",
    });

    expect(h.posted).toHaveLength(1);
    const short = h.now();
    expect(short).toMatchObject({
      tone: "short",
      title: "142 of 148 are in your download.",
      action: { label: "Try again for the 6" },
    });

    // The retry is a zip of the six alone, in the same set, on its own toast.
    h.mints.push(minted({ items: 6, token: "tok-2" }));
    h.checks.push(counted(6));
    if (short?.tone !== "short" || !short.action) throw new Error("no retry");
    short.action.run();
    await settle();

    expect(h.dismissed).toContain("walk-1");
    expect(h.mintBodies().at(-1)).toEqual({
      step: "mint",
      qr_token: "qr",
      set: "yours",
      types: "all",
      ids: missing,
      part: 1,
    });
    expect(h.shown.find((s) => s.id === "walk-2")?.view).toMatchObject({
      tone: "wait",
      title: "Preparing the 6…",
    });
    expect(h.posted.at(-1)).toEqual([WORKER, "tok-2"]);
  });

  it("the missed ones, still in the album with their files still not there, are said so", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(counted(148, ["m1", "m2"]));
    await h.walker.start("host", { event_id: "e" });
    const short = h.now();
    h.mints.push(minted({ items: 2, token: "tok-2" }));
    h.checks.push(counted(2, ["m1", "m2"]));
    if (short?.tone !== "short" || !short.action) throw new Error("no retry");
    short.action.run();
    await settle();
    expect(h.posted).toHaveLength(1);
    expect(h.now("walk-2")).toMatchObject({
      tone: "refused",
      title: "Those 2 couldn't be downloaded.",
      action: undefined,
    });
  });

  it("the missed ones, gone from the album, are said to be gone", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(counted(148, ["m1", "m2"]));
    await h.walker.start("host", { event_id: "e" });
    const short = h.now();
    h.mints.push({
      status: 400,
      body: { ok: false, code: "empty", message: "Nothing left to download." },
    });
    if (short?.tone !== "short" || !short.action) throw new Error("no retry");
    short.action.run();
    await settle();
    expect(h.now("walk-2")).toMatchObject({
      tone: "refused",
      title: "Those 2 aren't in the album anymore.",
      action: undefined,
    });
  });
});

describe("a big album, in parts (cap=split)", () => {
  it("walks part by part, a tap each, and ends on everything", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 3, next: "100_a", items: 2000, token: "t1" }));
    h.checks.push(counted(2000));

    await h.walker.start("host", {
      event_id: "e",
      types: "all",
      include_hidden: false,
    });
    expect(h.posted.map(([, t]) => t)).toEqual(["t1"]);
    const first = h.now();
    expect(first).toMatchObject({
      tone: "between",
      title: "Part 1 of 3 is downloading.",
      action: { label: "Get part 2" },
    });

    h.mints.push(
      minted({ part: 2, parts: 3, next: "200_b", items: 2000, token: "t2" }),
    );
    h.checks.push(counted(2000));
    if (first?.tone !== "between") throw new Error("not between");
    first.action.run();
    await settle();
    expect(h.shown.some((s) => s.view.title === "Preparing part 2 of 3…")).toBe(
      true,
    );
    expect(h.mintBodies().at(-1)).toMatchObject({ part: 2, after: "100_a" });
    const second = h.now();
    expect(second).toMatchObject({
      tone: "between",
      title: "Part 2 of 3 is downloading.",
      action: { label: "Get part 3" },
    });

    h.mints.push(
      minted({ part: 3, parts: 3, next: null, items: 440, token: "t3" }),
    );
    h.checks.push(counted(440));
    if (second?.tone !== "between") throw new Error("not between");
    second.action.run();
    await settle();

    expect(h.mintBodies().at(-1)).toMatchObject({ part: 3, after: "200_b" });
    expect(h.posted.map(([, t]) => t)).toEqual(["t1", "t2", "t3"]);
    expect(h.now()).toEqual({
      tone: "done",
      title: "All 3 parts are downloading. That's\u00a0everything.",
      duration: 7000,
    });
  });

  it("two parts end on both", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    h.mints.push(minted({ part: 2, parts: 2, items: 9 }));
    h.checks.push(counted(9));
    if (between?.tone !== "between") throw new Error("not between");
    between.action.run();
    await settle();
    expect(h.now()).toMatchObject({
      tone: "done",
      title: "Both parts are downloading. That's\u00a0everything.",
    });
  });

  it("a double tap on Get part 2 takes it once", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    h.mints.push(minted({ part: 2, parts: 2 }));
    h.checks.push(counted(5));
    if (between?.tone !== "between") throw new Error("not between");
    between.action.run();
    between.action.run();
    await settle();
    expect(h.mintBodies()).toHaveLength(2);
    expect(h.posted).toHaveLength(2);
  });

  it("the x between parts stops the walk, and the old button does nothing after", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    between.action.run();
    await settle();
    expect(h.dismissed).toEqual(["walk-1"]);
    expect(h.mintBodies()).toHaveLength(1);
  });

  it("a later part the album emptied meanwhile ends it: what was taken is everything", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    h.mints.push({
      status: 400,
      body: { ok: false, code: "empty", message: "Nothing left to download." },
    });
    if (between?.tone !== "between") throw new Error("not between");
    between.action.run();
    await settle();
    expect(h.now()).toMatchObject({
      tone: "done",
      title: "That's everything.",
    });
  });

  it("a middle part with nothing in it is not sent, and the count at the end says so", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 3, next: "1_a", items: 2000, token: "t1" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();

    // Part 2 is all gone; the walk goes on to part 3 without a second tap.
    h.mints.push(
      minted({ part: 2, parts: 3, next: "2_b", items: 3, token: "t2" }),
    );
    h.checks.push(counted(3, ["x", "y", "z"]));
    h.mints.push(minted({ part: 3, parts: 3, items: 10, token: "t3" }));
    h.checks.push(counted(10));
    if (between?.tone !== "between") throw new Error("not between");
    between.action.run();
    await settle();

    expect(h.posted.map(([, t]) => t)).toEqual(["t1", "t3"]);
    expect(h.now()).toMatchObject({
      tone: "short",
      title: "2,010 of 2,013 are in your download.",
      action: { label: "Try again for the 3" },
    });
  });
});

/**
 * ★ A RELOAD BETWEEN PARTS OFFERS THE NEXT ONE AGAIN (crumbs-32, from `export-wiring`: "a walk lives in the page, so a
 * reload mid-walk forgets it"). The tab's store stands in for sessionStorage; a second walker on it is the page after
 * the reload. It must offer the same tap, take the next part from the cursor it kept (never part 1 again, never a
 * part twice), count the walk whole at its end, and let go of a walk the moment it ends, whichever way.
 */
describe("a reload between parts", () => {
  /** sessionStorage, as the tab keeps it across the reload: what was last saved. */
  function tab(initial: unknown = null) {
    let held: unknown = initial;
    const store: WalkStore = {
      load: () => held,
      save: (walks) => {
        held = walks.length === 0 ? null : structuredClone(walks);
      },
    };
    return { store, held: () => held as SavedWalk[] | null };
  }

  /** The server's cursors, in the shape it hands them (`<ms>_<id>`). */
  const C1 = "1790000000000_00000000-0000-4000-8000-000000000001";
  const C2 = "1790000000500_00000000-0000-4000-8000-000000000002";

  /** The first page: a three-part walk, its first part handed over. */
  async function firstPart(store: WalkStore) {
    const h = harness("desk", store);
    h.mints.push(minted({ parts: 3, next: C1, items: 2000, token: "t1" }));
    h.checks.push(counted(2000, ["gone-1"]));
    await h.walker.start("guest", { qr_token: "qr", types: "all" });
    return h;
  }

  it("★ keeps the cursor, and the page after the reload offers the same next part, taken from it", async () => {
    const t = tab();
    await firstPart(t.store);
    expect(t.held()).toEqual([
      {
        scope: "guest",
        body: { qr_token: "qr", types: "all" },
        retryOf: null,
        part: 1,
        parts: 3,
        next: C1,
        items: 2000,
        found: 1999,
        missing: ["gone-1"],
        handed: 1,
      },
    ]);

    // The reload: a new page, a new walker, the same tab.
    const after = harness("desk", t.store);
    after.walker.resume();
    const offered = after.now();
    expect(offered).toMatchObject({
      tone: "between",
      title: "Part 1 of 3 is downloading.",
      action: { label: "Get part 2" },
    });
    // An offer, never a download: nothing is minted or posted until it is tapped.
    expect(after.calls).toHaveLength(0);
    expect(after.posted).toHaveLength(0);

    after.mints.push(
      minted({ part: 2, parts: 3, next: C2, items: 2000, token: "t2" }),
    );
    after.checks.push(counted(2000));
    if (offered?.tone !== "between") throw new Error("not between");
    offered.action.run();
    await settle();
    expect(after.mintBodies().at(-1)).toMatchObject({
      step: "mint",
      qr_token: "qr",
      types: "all",
      part: 2,
      after: C1,
    });
    expect(t.held()?.[0]).toMatchObject({ part: 2, next: C2, handed: 2 });

    const second = after.now();
    after.mints.push(
      minted({ part: 3, parts: 3, next: null, items: 440, token: "t3" }),
    );
    after.checks.push(counted(440));
    if (second?.tone !== "between") throw new Error("not between");
    second.action.run();
    await settle();
    expect(after.posted.map(([, tok]) => tok)).toEqual(["t2", "t3"]);
    // Counted whole, across the reload: the missed one from the first page is still the walk's.
    expect(after.now()).toMatchObject({
      tone: "short",
      title: "4,439 of 4,440 are in your download.",
    });
    expect(t.held()).toBeNull();
  });

  it("a walk stopped by its x between parts is never offered again", async () => {
    const t = tab();
    const h = await firstPart(t.store);
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    expect(t.held()).toBeNull();

    const after = harness("desk", t.store);
    after.walker.resume();
    expect(after.shown).toHaveLength(0);
  });

  it("offers once per page, however many surfaces ask", async () => {
    const t = tab();
    await firstPart(t.store);
    const after = harness("desk", t.store);
    after.walker.resume();
    after.walker.resume();
    expect(after.shown).toHaveLength(1);
  });

  it("a store holding nothing it can read offers nothing, and is emptied", () => {
    const t = tab([
      { scope: "host", body: {}, part: 1, parts: 2, next: "../../etc" },
      "not a walk",
    ]);
    const h = harness("desk", t.store);
    h.walker.resume();
    expect(h.shown).toHaveLength(0);
    expect(t.held()).toBeNull();
  });

  it("reads only a walk a server could go on with", () => {
    const walk: SavedWalk = {
      scope: "host",
      body: { event_id: "e", types: "all", include_hidden: false },
      retryOf: null,
      part: 2,
      parts: 4,
      next: C1,
      items: 4000,
      found: 4000,
      missing: [],
      handed: 2,
    };
    expect(readSavedWalks([walk])).toEqual([walk]);
    expect(readSavedWalks([{ ...walk, parts: 2 }])).toEqual([]);
    expect(readSavedWalks([{ ...walk, scope: "admin" }])).toEqual([]);
    expect(readSavedWalks([{ ...walk, next: "a cursor" }])).toEqual([]);
    expect(readSavedWalks({ walks: [walk] })).toEqual([]);
  });
});

describe("the Worker's check", () => {
  it("that cannot answer never stops the zip: an older Worker's CORS failure falls through", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push("network", "network");
    const handed = await h.walker.start("guest", { qr_token: "qr" });
    expect(handed).toBe(true);
    expect(h.calls.filter((c) => c.url === CHECK)).toHaveLength(2);
    expect(h.posted).toHaveLength(1);
    expect(h.now()).toMatchObject({ tone: "done" });
  });

  it("that says it would refuse the token is believed: nothing is posted to replace the page", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push({ status: 403, body: { ok: false, reason: "forbidden" } });
    await h.walker.start("guest", { qr_token: "qr" });
    expect(h.posted).toEqual([]);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Couldn't start that download.",
      action: { label: "Try again" },
    });

    const paused = harness();
    paused.mints.push(minted());
    paused.checks.push({ status: 503, body: { ok: false, reason: "paused" } });
    await paused.walker.start("guest", { qr_token: "qr" });
    expect(paused.posted).toEqual([]);
    expect(paused.now()).toMatchObject({
      tone: "refused",
      title: "Downloads are paused right now. Please try again later.",
      action: undefined,
    });
  });

  it("whose R2 is down is tried once more, then the zip goes uncounted", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(
      { status: 502, body: { ok: false, reason: "unavailable" } },
      { status: 502, body: { ok: false, reason: "unavailable" } },
    );
    await h.walker.start("guest", { qr_token: "qr" });
    expect(h.posted).toHaveLength(1);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
