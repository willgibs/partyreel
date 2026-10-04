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

/** The real timer, taken before any test fakes the clock (the harness's pauses ride it). */
const turn = globalThis.setTimeout;

const WORKER = "https://partyreel-export.example.workers.dev";
const CHECK = `${WORKER}/check`;
const STATUS = "/api/export/status";

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
  /** The selection's summary (`export-ends`'s hidden question): a host mint body with step "summary". */
  const summaries: Scripted[] = [];
  /** The status poll (`export-ends`); once the queue is empty it answers `idle`. */
  const statuses: Scripted[] = [];
  let idle: Scripted = { status: 200, body: { ok: true, state: "none" } };
  /** The browser's own word on its line (`navigator.onLine`). */
  let online = true;
  const calls: Call[] = [];
  const posted: [string, string][] = [];
  const shown: { id: string; view: ToastView }[] = [];
  const dismissed: string[] = [];
  let ids = 0;

  const fetchFn = ((input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    const step = (() => {
      try {
        return (JSON.parse(String(init.body)) as { step?: string }).step;
      } catch {
        return undefined;
      }
    })();
    const queue =
      url === CHECK
        ? checks
        : url === STATUS
          ? statuses
          : step === "summary"
            ? summaries
            : mints;
    const next = queue.shift() ?? (url === STATUS ? idle : undefined);
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
    online: () => online,
    // A pause yields one turn of the event loop (never real time), so a walk that listens for the Worker's
    // word moves one poll a turn, as a test steps it, instead of spinning through every poll at once. The
    // loader's own timer, so a test that fakes the clock still has its pauses turn.
    sleep: () => new Promise((resolve) => turn(resolve, 0)),
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
      .filter((c) => c.url.startsWith("/api/export/") && c.url !== STATUS)
      .map((c) => JSON.parse(String(c.init.body)) as Record<string, unknown>)
      .filter((b) => b.step === "mint");
  /** The nonces the walk has asked the status route about, in order. */
  const polled = () =>
    calls
      .filter((c) => c.url === STATUS)
      .map((c) => (JSON.parse(String(c.init.body)) as { jti: string }).jti);

  return {
    walker,
    mints,
    checks,
    summaries,
    statuses,
    setIdle: (answer: Scripted) => {
      idle = answer;
    },
    setOnline: (value: boolean) => {
      online = value;
    },
    calls,
    posted,
    shown,
    dismissed,
    now,
    mintBodies,
    polled,
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
  // ★ RESHAPED ON PURPOSE (E6; scar kept: two silent re-attempts, one wait the whole time, then Try again takes the
  // same part and lands). The expired reason: every failure said "Couldn't start that download.", which blamed the
  // app for a line that dropped. Three requests that never reached the app now say the connection dropped, and what
  // to do (below); an app that ANSWERED an error keeps the old sentence.
  it("re-attempts twice without a word, then says the connection dropped, with Try again", async () => {
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
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
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

  // `export-ends` retires ROADMAP's "the mint has no timeout and no cancel (a hung request leaves the toast
  // spinning and Download disabled until a reload)" on this evidence: every try hanging still ends on its own
  // ceilings, said with Try again, and the tap's promise resolves, which is what lets the bulk bar go.
  it("every try hanging still ends: about 47 s of ceilings, then Try again, and the tap resolves", async () => {
    vi.useFakeTimers();
    const h = harness();
    h.mints.push("hang", "hang", "hang");
    let resolved: boolean | null = null;
    void h.walker.start("host", { event_id: "e" }).then((r) => {
      resolved = r;
    });
    // The ceilings run on the faked clock, the pauses between tries on real turns: step both.
    let waited = 0;
    while (resolved === null && waited < 60_000) {
      await vi.advanceTimersByTimeAsync(1_000);
      await new Promise((r) => turn(r, 0));
      waited += 1_000;
    }
    expect(resolved).toBe(false);
    // Three ceilings (10 + 15 + 20 s) and two short pauses: never past about 47 s.
    expect(waited).toBeLessThanOrEqual(47_000);
    expect(h.mintBodies()).toHaveLength(3);
    expect(h.calls.every((c) => c.init.signal?.aborted)).toBe(true);
    // A request that never comes back is a line that is not carrying it: said as one (E6).
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
      action: { label: "Try again" },
    });
  });

  it("★ an app that answers an error is not a dropped connection: it keeps its own sentence, with nothing to blame on the line", async () => {
    const h = harness();
    const broken = { status: 500, body: { ok: false } };
    h.mints.push(broken, broken, broken);

    const handed = await h.walker.start("host", { event_id: "e" });

    expect(handed).toBe(false);
    const failed = h.now();
    expect(failed).toMatchObject({
      tone: "refused",
      title: "Couldn't start that download.",
      action: { label: "Try again" },
    });
    expect((failed as { detail?: unknown }).detail).toBeUndefined();
  });

  it("★ the last try decides: a line that came back to an app that errors is the app's, not the line's", async () => {
    const h = harness();
    h.mints.push("network", "network", { status: 500, body: { ok: false } });
    await h.walker.start("host", { event_id: "e" });
    expect(h.now()).toMatchObject({ title: "Couldn't start that download." });
  });

  it("★ offline by the browser's own word, a dropped request is said at once: a second try can only fail the same way", async () => {
    const h = harness();
    h.setOnline(false);
    h.mints.push("network");
    const handed = await h.walker.start("host", { event_id: "e" });
    expect(handed).toBe(false);
    expect(h.mintBodies()).toHaveLength(1);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
    });
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

/** A question's answer, by its label. */
function answer(view: ToastView | undefined, label: string) {
  if (view?.tone !== "confirm") throw new Error(`not asking: ${view?.tone}`);
  const found = view.actions.find((a) => a.label === label);
  if (!found) throw new Error(`no answer "${label}"`);
  return found;
}

// ★ RESHAPED ON PURPOSE (E6, Will 2026-10-04: "a cancel is intentional: it asks to confirm first, then offers Try
// again"). The scars kept: the x really stops things (the mint's and the check's fetch aborted so the Worker stops
// reading), nothing is posted afterwards whatever arrives late, and a walk can always be left. The expired reason:
// the x used to cancel on the press, silently, which a thumb's slip could not take back.
describe("the x (his note: interruptibility; E6: it asks first)", () => {
  it("★ asks first: Keep going or Cancel download, and nothing is cancelled by the press alone", async () => {
    const h = harness();
    h.mints.push("hang");
    const handed = h.walker.start("host", { event_id: "e" });
    await settle();

    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();

    expect(h.now()).toMatchObject({
      tone: "confirm",
      title: "Cancel this download?",
      actions: [{ label: "Keep going" }, { label: "Cancel download" }],
    });
    // Nothing was cancelled: the mint is still in flight, the toast is not dismissed.
    expect(h.calls[0].init.signal?.aborted).toBe(false);
    expect(h.dismissed).toEqual([]);

    answer(h.now(), "Keep going").run();
    expect(h.now()).toMatchObject({
      tone: "wait",
      title: "Preparing your download…",
    });
    // Still going: leave it by confirming, so the test does not wait on the hang.
    const again = h.now();
    if (again?.tone !== "wait") throw new Error("not waiting");
    again.close.run();
    answer(h.now(), "Cancel download").run();
    expect(await handed).toBe(false);
  });

  it("cancels a mint in flight once she says so: aborted, nothing posted, whatever arrives late, and it says so with Try again", async () => {
    const h = harness();
    h.mints.push("hang");
    const handed = h.walker.start("host", { event_id: "e" });
    await settle();

    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();
    answer(h.now(), "Cancel download").run();

    expect(await handed).toBe(false);
    expect(h.calls[0].init.signal?.aborted).toBe(true);
    expect(h.posted).toEqual([]);
    // Said as hers, neutral (never an error), with the way back and a Dismiss.
    expect(h.now()).toMatchObject({
      tone: "cancelled",
      title: "Download cancelled.",
      action: { label: "Try again" },
      close: { label: "Dismiss" },
      duration: 8000,
    });
    // Nothing is said after it by the work it abandoned.
    const shown = h.shown.length;
    await settle();
    expect(h.shown).toHaveLength(shown);
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
    answer(h.now(), "Cancel download").run();

    expect(await handed).toBe(false);
    const check = h.calls.find((c) => c.url === CHECK);
    expect(check?.init.signal?.aborted).toBe(true);
    expect(h.posted).toEqual([]);
  });

  it("★ hands nothing to the browser while the question stands: Keep going then goes on to the download", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(counted(148));
    const handed = h.walker.start("guest", { qr_token: "qr" });
    // The press comes while the mint and the check are still in the air.
    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();
    await settle();
    await settle();
    await settle();

    // Everything it needed has answered, and still nothing is posted: the question has not been answered.
    expect(h.calls.map((c) => c.url)).toContain(CHECK);
    expect(h.posted).toEqual([]);
    expect(h.now()).toMatchObject({ tone: "confirm" });

    answer(h.now(), "Keep going").run();
    expect(await handed).toBe(true);
    expect(h.posted).toEqual([[WORKER, "tok-1"]]);
    expect(h.now()).toMatchObject({ tone: "done" });
  });

  it("★ a Cancel at the post hands nothing over, and Try again takes the whole download again", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push(counted(148));
    const handed = h.walker.start("guest", { qr_token: "qr" });
    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();
    await settle();
    await settle();
    await settle();

    answer(h.now(), "Cancel download").run();
    expect(await handed).toBe(false);
    expect(h.posted).toEqual([]);

    const cancelled = h.now();
    if (cancelled?.tone !== "cancelled" || !cancelled.action) {
      throw new Error("no Try again");
    }
    h.mints.push(minted({ token: "tok-2" }));
    h.checks.push(counted(148));
    cancelled.action.run();
    await settle();
    await settle();
    expect(h.dismissed).toContain("walk-1");
    expect(h.posted).toEqual([[WORKER, "tok-2"]]);
    expect(h.now("walk-2")).toMatchObject({ tone: "done" });
  });

  it("a Worker that refuses the zip while the question stands replaces it too: nothing is left to cancel or to keep", async () => {
    const h = harness();
    h.mints.push(minted());
    h.checks.push({ status: 200, body: { ok: false, reason: "paused" } });
    const handed = h.walker.start("guest", { qr_token: "qr" });
    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();
    expect(h.now()).toMatchObject({ tone: "confirm" });
    expect(await handed).toBe(false);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Downloads are paused right now. Please try again later.",
    });
    expect(h.posted).toEqual([]);
  });

  it("a failure that arrives while the question stands replaces it: the walk is over, there is nothing to cancel", async () => {
    const h = harness();
    h.mints.push("network", "network", "network");
    const handed = h.walker.start("host", { event_id: "e" });
    // The x is pressed before the first try has even answered.
    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    wait.close.run();
    expect(h.now()).toMatchObject({ tone: "confirm" });
    // Every try then fails under the question, which the failure replaces.
    expect(await handed).toBe(false);
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Your connection dropped.",
    });
  });

  it("cannot be swiped past: every waiting state carries it", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    for (const { view } of h.shown) {
      // A done toast goes by itself, and a question's answers are its way out.
      if (view.tone === "done" || view.tone === "confirm") continue;
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

  // ★ RESHAPED ON PURPOSE (E6; scar kept: a stop leaves the rest behind and a stale tap takes nothing). The expired
  // reason: the x used to end the walk silently, so a host who stopped after part 1 of 3 was told nothing of what she
  // had left behind ("would hate for someone to think they downloaded everything").
  it("★ the x between parts asks what stopping leaves, and Keep going draws the walk as it stood", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 3, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    expect(h.now()).toMatchObject({
      tone: "confirm",
      title: "Stop after part 1 of 3?",
      detail: "Parts 2 and 3 won't download.",
      actions: [{ label: "Keep going" }, { label: "Stop here" }],
    });
    expect(h.dismissed).toEqual([]);

    answer(h.now(), "Keep going").run();
    expect(h.now()).toMatchObject({
      tone: "between",
      title: "Part 1 of 3 is downloading.",
      action: { label: "Get part 2" },
    });
  });

  it("★ Stop here says where she stopped, keeps the tap that takes the rest, and ends only when she puts it away", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    answer(h.now(), "Stop here").run();

    expect(h.dismissed).toEqual([]);
    const stopped = h.now();
    expect(stopped).toMatchObject({
      tone: "between",
      title: "Stopped after part 1 of 2.",
      action: { label: "Get part 2" },
      close: { label: "Dismiss" },
    });
    if (stopped?.tone !== "between") throw new Error("not stopped");

    // The tap that takes the rest still works, once.
    h.mints.push(minted({ part: 2, parts: 2, token: "tok-2" }));
    h.checks.push(counted(5));
    stopped.action.run();
    stopped.action.run();
    await settle();
    expect(h.mintBodies()).toHaveLength(2);
    expect(h.posted).toHaveLength(2);
  });

  it("Dismiss after a stop puts the walk away, and the old button does nothing after", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 2, next: "1_a" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    answer(h.now(), "Stop here").run();
    const stopped = h.now();
    if (stopped?.tone !== "between") throw new Error("not stopped");
    stopped.close.run();
    stopped.action.run();
    await settle();
    expect(h.dismissed).toEqual(["walk-1"]);
    expect(h.mintBodies()).toHaveLength(1);
  });

  it("★ the Worker's word on an earlier part never draws over the question", async () => {
    const h = harness();
    h.mints.push(
      reporting({ parts: 2, next: "1_a", items: 2000, token: "t1" }),
    );
    h.checks.push(promised(2000));
    h.setIdle({ status: 200, body: { ok: true, state: "none" } });
    await h.walker.start("guest", { qr_token: "qr" });
    const between = h.now();
    if (between?.tone !== "between") throw new Error("not between");
    between.close.run();
    const asked = h.now();
    expect(asked).toMatchObject({ tone: "confirm" });
    // Part 1's word arrives (saved) while she is reading the question: it is kept, never drawn over it.
    h.setIdle(said("saved", []));
    await settle();
    await settle();
    expect(h.now()).toBe(asked);
    // Her answer draws the walk as it now stands, with the word.
    answer(h.now(), "Keep going").run();
    expect(h.now()).toMatchObject({
      tone: "between",
      title: "Part 1 of 2 is saved.",
    });
  });

  it("★ cancelling the preparing of a LATER part stops where she stood: the parts before it are hers, and Get part N takes it again", async () => {
    const h = harness();
    h.mints.push(minted({ parts: 3, next: "1_a", items: 2000, token: "t1" }));
    h.checks.push(counted(2000));
    await h.walker.start("host", { event_id: "e" });
    const between = h.now();
    // Part 2's mint hangs: she taps Get part 2, then thinks better of it.
    h.mints.push("hang");
    if (between?.tone !== "between") throw new Error("not between");
    between.action.run();
    await settle();
    const wait = h.now();
    if (wait?.tone !== "wait") throw new Error("not waiting");
    expect(wait.title).toBe("Preparing part 2 of 3…");
    wait.close.run();
    answer(h.now(), "Cancel download").run();
    await settle();

    expect(h.posted).toHaveLength(1);
    expect(h.now()).toMatchObject({
      tone: "between",
      title: "Stopped after part 1 of 3.",
      action: { label: "Get part 2" },
    });
    // And she can take part 2 after all.
    h.mints.push(minted({ part: 2, parts: 3, next: "2_b", token: "t2" }));
    h.checks.push(counted(5));
    const stopped = h.now();
    if (stopped?.tone !== "between") throw new Error("not stopped");
    stopped.action.run();
    await settle();
    expect(h.posted.map(([, tok]) => tok)).toEqual(["t1", "t2"]);
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
        // `export-ends`: each handed part's word; no word can come for this one (its mint asked none).
        handedParts: [
          {
            part: 1,
            items: 2000,
            jti: null,
            word: "unheard",
            outcome: null,
            missing: [],
          },
        ],
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
    // Asked, not yet stopped: the walk is still offered if the page is reloaded now.
    expect(t.held()).not.toBeNull();
    answer(h.now(), "Stop here").run();
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

/*
 * ── `export-ends`: every download ends, and says how ───────────────────────────────────────────────────
 *
 * The page goes blind when the browser takes a zip, so the Worker reports its stream to the app and the walk
 * listens (`/api/export/status`). A zip reads saved only on the Worker's word; one the album emptied after
 * its check was never sent and says so; one cut short or stopped says so with a Try again for what it lacks;
 * and where no word can come, the walk says what it knows and claims nothing.
 */

const JTI = "0123456789abcdef0123456789abcdef";
const JTI_2 = "fedcba9876543210fedcba9876543210";

/** A mint that asked the Worker to report, and a check from a Worker that promised it. */
const reporting = (over: Record<string, unknown> = {}) =>
  minted({ jti: JTI, reports: true, ...over });
const promised = (items: number, missing: string[] = []) => ({
  status: 200,
  body: {
    ok: true,
    items,
    found: items - missing.length,
    missing,
    reports: true,
  },
});
const said = (state: string, missing?: string[]) => ({
  status: 200,
  body: { ok: true, state, ...(missing ? { missing } : {}) },
});

/** Let the walk's listening run until `ready` holds (each poll is a few ticks). */
async function until(ready: () => boolean, ticks = 400) {
  for (let i = 0; i < ticks && !ready(); i++) await settle();
}

describe("saved means saved (export-ends)", () => {
  it("★ one zip says it is downloading, and turns to saved only on the Worker's word", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148));
    h.statuses.push(said("none"), said("streaming"), said("streaming"));
    h.setIdle(said("saved", []));

    const handed = await h.walker.start("guest", { qr_token: "qr" });
    expect(handed).toBe(true);
    expect(h.posted).toHaveLength(1);
    // Handed over, and held: no "done" until the Worker says its last byte went out.
    expect(h.now()).toEqual({
      tone: "downloading",
      title: "Downloading…",
      close: { label: "Dismiss", run: expect.any(Function) },
    });

    await until(() => h.now()?.tone === "done");
    expect(h.polled().every((j) => j === JTI)).toBe(true);
    expect(h.now()).toEqual({
      tone: "done",
      title: "Your download is saved.",
      duration: 4000,
    });
  });

  it("a phone hears where it went", async () => {
    for (const [place, during, after] of [
      ["files", "Saving to your Files app…", "Saved to your Files app."],
      ["downloads", "Saving to your Downloads…", "Saved to your Downloads."],
    ] as const) {
      const h = harness(place);
      h.mints.push(reporting());
      h.checks.push(promised(3));
      h.setIdle(said("saved", []));
      await h.walker.start("guest", { qr_token: "qr" });
      expect(h.now()).toMatchObject({ tone: "downloading", title: during });
      await until(() => h.now()?.tone === "done");
      expect(h.now()).toMatchObject({ tone: "done", title: after });
    }
  });

  it("★ a walk's parts turn saved one by one, and its last word waits for every part", async () => {
    const h = harness();
    h.mints.push(
      reporting({ parts: 2, next: "1_a", items: 2000, token: "t1" }),
    );
    h.checks.push(promised(2000));
    h.setIdle(said("streaming"));
    await h.walker.start("host", { event_id: "e" });
    expect(h.now()).toMatchObject({
      tone: "between",
      title: "Part 1 of 2 is downloading.",
      action: { label: "Get part 2" },
    });

    h.setIdle(said("saved", []));
    await until(() => h.now()?.title === "Part 1 of 2 is saved.");
    const first = h.now();
    expect(first).toMatchObject({
      tone: "between",
      title: "Part 1 of 2 is saved.",
      action: { label: "Get part 2" },
    });

    h.setIdle(said("streaming"));
    h.mints.push(
      reporting({ jti: JTI_2, part: 2, parts: 2, items: 300, token: "t2" }),
    );
    h.checks.push(promised(300));
    if (first?.tone !== "between") throw new Error("not between");
    first.action.run();
    await until(() => h.posted.length === 2);
    // Every part taken, the last still on its way: said, and held.
    expect(h.now()).toMatchObject({
      tone: "downloading",
      title: "Both parts are downloading. That's everything.",
    });

    h.setIdle(said("saved", []));
    await until(() => h.now()?.tone === "done");
    expect(h.now()).toEqual({
      tone: "done",
      title: "Both parts are saved. That's everything.",
      duration: 7000,
    });
  });

  it("where no word comes (the Worker cannot reach this app), it stops listening and claims nothing", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148));
    // Idle: "none" forever.
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "done");
    expect(h.now()).toMatchObject({
      tone: "done",
      title: "Your download is starting.",
    });
    // It listened only through the stream's start: about fifteen polls, then never again.
    const asked = h.polled().length;
    expect(asked).toBeGreaterThan(5);
    expect(asked).toBeLessThanOrEqual(16);
    await until(() => false, 50);
    expect(h.polled()).toHaveLength(asked);
  });

  it("an older Worker promises nothing, so nothing is polled and today's words stand", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(counted(148));
    await h.walker.start("guest", { qr_token: "qr" });
    expect(h.now()).toMatchObject({
      tone: "done",
      title: "Your download is starting.",
    });
    await until(() => false, 20);
    expect(h.polled()).toEqual([]);
  });

  it("a mint that asked nothing (a laptop behind a deployed Worker) is never listened for either", async () => {
    const h = harness();
    h.mints.push(minted({ jti: JTI, reports: false }));
    h.checks.push(promised(148));
    await h.walker.start("guest", { qr_token: "qr" });
    expect(h.now()).toMatchObject({ tone: "done" });
    await until(() => false, 20);
    expect(h.polled()).toEqual([]);
  });

  it("the x lets the toast go and stops the listening; the browser keeps the file", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148));
    h.setIdle(said("streaming"));
    await h.walker.start("guest", { qr_token: "qr" });
    const downloading = h.now();
    if (downloading?.tone !== "downloading") throw new Error("not downloading");
    downloading.close.run();
    expect(h.dismissed).toEqual(["walk-1"]);
    const asked = h.polled().length;
    await until(() => false, 30);
    expect(h.polled().length).toBeLessThanOrEqual(asked + 1);
    expect(h.shown.at(-1)?.view.tone).toBe("downloading");
  });
});

describe("an empty or short zip is said, never sent as if whole (export-ends)", () => {
  it("★ an album emptied between the check and the stream sent no file, and says so with Try again", async () => {
    const h = harness();
    h.mints.push(reporting({ items: 3 }));
    h.checks.push(promised(3));
    h.setIdle(said("empty", ["m1", "m2", "m3"]));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "refused");
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Nothing left to download.",
      action: { label: "Try again" },
    });
  });

  it("★ objects gone mid-stream are counted, with a Try again for exactly those", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148));
    h.setIdle(said("short", ["m7"]));
    await h.walker.start("host", { event_id: "e", types: "all" });
    await until(() => h.now()?.tone === "short");
    const short = h.now();
    expect(short).toMatchObject({
      tone: "short",
      title: "147 of 148 are in your download.",
      action: { label: "Try again for the 1" },
    });

    h.mints.push(minted({ items: 1, token: "tok-2" }));
    h.checks.push(counted(1));
    if (short?.tone !== "short" || !short.action) throw new Error("no retry");
    short.action.run();
    await settle();
    expect(h.mintBodies().at(-1)).toMatchObject({ ids: ["m7"], part: 1 });
  });

  it("a gone one the check already counted is counted once", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148, ["m1"]));
    h.setIdle(said("short", ["m1", "m2"]));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "short");
    expect(h.now()).toMatchObject({
      title: "146 of 148 are in your download.",
      action: { label: "Try again for the 2" },
    });
  });

  // ★ RESHAPED ON PURPOSE (E6; scar kept: a zip with nothing whole says so with a Try again that takes the whole zip
  // again from its first part). The expired reason: a zip the client left and a zip a read broke both said "That
  // download didn't finish.", so a cancel and a dropped connection read the same. The Worker's `failed` (a read of
  // ours broke) keeps the sentence; `stopped` (the client left) is told apart by what the page's own line did.
  it("a zip a read broke says it did not finish, with Try again, and Try again takes the whole zip again", async () => {
    const h = harness();
    h.mints.push(reporting({ items: 3 }));
    h.checks.push(promised(3));
    h.setIdle(said("failed", ["m1", "m2", "m3"]));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "refused");
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "That download didn't finish.",
      action: { label: "Try again" },
    });

    // Try again takes the whole zip again, from its first part.
    h.mints.push(minted({ token: "tok-2" }));
    h.checks.push(counted(148));
    const refused = h.now();
    if (refused?.tone !== "refused" || !refused.action)
      throw new Error("no retry");
    refused.action.run();
    await settle();
    expect(h.posted.map(([, t]) => t)).toEqual(["tok-1", "tok-2"]);
  });

  it("★ a zip the client left while the page's own line held is a CANCEL: neutral, hers, with Try again", async () => {
    const h = harness();
    h.mints.push(reporting({ items: 3 }));
    h.checks.push(promised(3));
    // Every poll answered: streaming, then the Worker says the client left. Her line never failed.
    h.statuses.push(said("streaming"), said("streaming"));
    h.setIdle(said("stopped", ["m1", "m2", "m3"]));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "cancelled");
    expect(h.now()).toMatchObject({
      tone: "cancelled",
      title: "Download cancelled.",
      action: { label: "Try again" },
      close: { label: "Dismiss" },
      // Held: the Worker's word can come after she has looked away.
      duration: Infinity,
    });

    h.mints.push(minted({ token: "tok-2" }));
    h.checks.push(counted(148));
    const cancelled = h.now();
    if (cancelled?.tone !== "cancelled" || !cancelled.action) {
      throw new Error("no retry");
    }
    cancelled.action.run();
    await settle();
    expect(h.posted.map(([, t]) => t)).toEqual(["tok-1", "tok-2"]);
  });

  it("★ a zip the client left after the page's own line failed is a DROPPED CONNECTION: named, with what to do", async () => {
    const h = harness();
    h.mints.push(reporting({ items: 3 }));
    h.checks.push(promised(3));
    // The line fails under the stream (two polls never reach the app), then comes back to the Worker's word.
    h.statuses.push(said("streaming"), "network", "network");
    h.setIdle(said("stopped", ["m1", "m2", "m3"]));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(() => h.now()?.tone === "refused");
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "Your connection dropped.",
      detail: "Check your signal, then try again.",
      action: { label: "Try again" },
    });
  });

  it("one poll that only ran long is the app's slowness, not a dropped line: a stall counts when it repeats", async () => {
    const h = harness();
    h.mints.push(reporting({ items: 3 }));
    h.checks.push(promised(3));
    vi.useFakeTimers();
    h.statuses.push(said("streaming"), "hang");
    h.setIdle(said("stopped", ["m1", "m2", "m3"]));
    const started = h.walker.start("guest", { qr_token: "qr" });
    // The one hung poll runs out its 8 s ceiling; every other poll answers.
    for (let i = 0; i < 40 && h.now()?.tone !== "cancelled"; i++) {
      await vi.advanceTimersByTimeAsync(1_000);
      await new Promise((r) => turn(r, 0));
    }
    await started;
    expect(h.now()).toMatchObject({ tone: "cancelled" });
  });

  it("a walk an older build kept (no record of its line) claims neither: the old sentence", async () => {
    const saved = {
      scope: "guest",
      body: { qr_token: "qr" },
      retryOf: null,
      part: 1,
      parts: 1,
      next: null,
      items: 3,
      found: 3,
      missing: [],
      handed: 1,
      handedParts: [
        {
          part: 1,
          items: 3,
          jti: JTI,
          word: "listening",
          outcome: null,
          missing: [],
        },
      ],
    };
    const store: WalkStore = {
      load: () => [saved as SavedWalk],
      save: () => {},
    };
    const h = harness("desk", store);
    h.setIdle(said("stopped", ["m1", "m2", "m3"]));
    h.walker.resume();
    await until(() => h.now()?.tone === "refused");
    expect(h.now()).toMatchObject({
      tone: "refused",
      title: "That download didn't finish.",
    });
  });

  it("★ a line that stops answering while a zip streams is said under 'Downloading…', and clears when it answers", async () => {
    const h = harness();
    h.mints.push(reporting());
    h.checks.push(promised(148));
    h.statuses.push(said("streaming"), "network", "network", "network");
    h.setIdle(said("streaming"));
    await h.walker.start("guest", { qr_token: "qr" });
    await until(
      () =>
        h.now()?.tone === "downloading" &&
        (h.now() as { detail?: string }).detail !== undefined,
    );
    expect(h.now()).toMatchObject({
      tone: "downloading",
      title: "Downloading…",
      detail: "Your connection dropped. Check your signal.",
    });
    // It answers again: the line is back, and the notice goes with it.
    await until(() => (h.now() as { detail?: string }).detail === undefined);
    expect((h.now() as { detail?: string }).detail).toBeUndefined();
  });

  it("a part that came up short mid-walk says its count between parts, and the walk's last word counts it", async () => {
    const h = harness();
    h.mints.push(
      reporting({ parts: 2, next: "1_a", items: 2000, token: "t1" }),
    );
    h.checks.push(promised(2000));
    h.setIdle(said("short", ["g1"]));
    await h.walker.start("host", { event_id: "e" });
    await until(() => h.now()?.title === "1,999 of 2,000 are in part 1.");
    const first = h.now();
    expect(first).toMatchObject({
      tone: "between",
      action: { label: "Get part 2" },
    });

    h.setIdle(said("saved", []));
    h.mints.push(
      reporting({ jti: JTI_2, part: 2, parts: 2, items: 300, token: "t2" }),
    );
    h.checks.push(promised(300));
    if (first?.tone !== "between") throw new Error("not between");
    first.action.run();
    await until(() => h.now()?.tone === "short");
    expect(h.now()).toMatchObject({
      tone: "short",
      title: "2,299 of 2,300 are in your download.",
      action: { label: "Try again for the 1" },
    });
  });
});

describe("a reload while the last part downloads (export-ends)", () => {
  function tab() {
    let held: unknown = null;
    const store: WalkStore = {
      load: () => held,
      save: (walks) => {
        held = walks.length === 0 ? null : structuredClone(walks);
      },
    };
    return { store, held: () => held as SavedWalk[] | null };
  }

  it("keeps the walk, and the page after goes on listening to say saved", async () => {
    const t = tab();
    const before = harness("files", t.store);
    before.mints.push(reporting());
    before.checks.push(promised(148));
    before.setIdle(said("streaming"));
    await before.walker.start("guest", { qr_token: "qr" });
    expect(t.held()).toEqual([
      expect.objectContaining({
        next: null,
        handed: 1,
        handedParts: [expect.objectContaining({ jti: JTI, word: "listening" })],
      }),
    ]);

    const after = harness("files", t.store);
    after.setIdle(said("saved", []));
    after.walker.resume();
    expect(after.now()).toMatchObject({
      tone: "downloading",
      title: "Saving to your Files app…",
    });
    await until(() => after.now()?.tone === "done");
    expect(after.now()).toMatchObject({ title: "Saved to your Files app." });
    expect(after.posted).toEqual([]);
    expect(t.held()).toBeNull();
  });

  it("reads a kept walk's parts only as a server and the walk could go on with them", () => {
    const walk: SavedWalk = {
      scope: "guest",
      body: { qr_token: "qr" },
      retryOf: null,
      part: 1,
      parts: 1,
      next: null,
      items: 3,
      found: 3,
      missing: [],
      handed: 1,
      handedParts: [
        {
          part: 1,
          items: 3,
          jti: JTI,
          word: "listening",
          outcome: null,
          missing: [],
        },
      ],
    };
    expect(readSavedWalks([walk])).toEqual([walk]);
    const part = walk.handedParts![0];
    // Every part taken and nothing listened for: nothing to go on with.
    expect(
      readSavedWalks([{ ...walk, handedParts: [{ ...part, word: "saved" }] }]),
    ).toEqual([]);
    expect(
      readSavedWalks([{ ...walk, handedParts: [{ ...part, jti: "x" }] }]),
    ).toEqual([]);
    expect(
      readSavedWalks([{ ...walk, handedParts: [{ ...part, jti: null }] }]),
    ).toEqual([]);
    expect(readSavedWalks([{ ...walk, handedParts: "all" }])).toEqual([]);
  });
});

describe("a host's selection with hidden items in it (export-ends)", () => {
  const selection = {
    event_id: "e",
    ids: ["a", "b", "c"],
    types: "all",
    include_hidden: true,
  };
  const mix = (shown: number, hidden: number) => ({
    status: 200,
    body: {
      ok: true,
      summary: {
        shown: {
          photo: { count: shown, bytes: 1 },
          video: { count: 0, bytes: 0 },
        },
        hidden: {
          photo: { count: hidden, bytes: 1 },
          video: { count: 0, bytes: 0 },
        },
      },
    },
  });

  it("★ asks first when it mixes hidden and shown, and lets the bar go while she decides", async () => {
    const h = harness();
    h.summaries.push(mix(9, 3));
    const handed = await h.walker.start("host", selection);
    expect(handed).toBe(false);
    expect(h.mintBodies()).toEqual([]);
    const ask = h.now();
    expect(ask).toMatchObject({
      tone: "ask",
      title: "3 of these 12 are hidden.",
      actions: [{ label: "Include them" }, { label: "Leave them out" }],
      close: { label: "Cancel download" },
    });
    // The question reads the server's own count of the selection.
    const summary = h.calls.find(
      (c) => JSON.parse(String(c.init.body)).step === "summary",
    );
    expect(JSON.parse(String(summary?.init.body))).toEqual({
      step: "summary",
      ...selection,
    });

    h.mints.push(minted());
    h.checks.push(counted(9));
    if (ask?.tone !== "ask") throw new Error("not asking");
    ask.actions[1].run();
    await settle();
    expect(h.mintBodies()).toEqual([
      { step: "mint", ...selection, include_hidden: false, part: 1 },
    ]);
    expect(h.posted).toHaveLength(1);
  });

  it("Include them takes the selection whole", async () => {
    const h = harness();
    h.summaries.push(mix(9, 1));
    await h.walker.start("host", selection);
    const ask = h.now();
    expect(ask).toMatchObject({
      title: "1 of these 10 is hidden.",
      actions: [{ label: "Include it" }, { label: "Leave it out" }],
    });
    h.mints.push(minted());
    h.checks.push(counted(10));
    if (ask?.tone !== "ask") throw new Error("not asking");
    ask.actions[0].run();
    ask.actions[0].run();
    await settle();
    expect(h.mintBodies()).toEqual([{ step: "mint", ...selection, part: 1 }]);
  });

  it("the x on the question takes nothing", async () => {
    const h = harness();
    h.summaries.push(mix(9, 3));
    await h.walker.start("host", selection);
    const ask = h.now();
    if (ask?.tone !== "ask") throw new Error("not asking");
    ask.close.run();
    ask.actions[0].run();
    await settle();
    expect(h.dismissed).toEqual(["walk-1"]);
    expect(h.mintBodies()).toEqual([]);
  });

  it.each([
    ["only shown", mix(12, 0)],
    ["only hidden (picking them is her answer)", mix(0, 3)],
    ["a summary that could not answer", { status: 500, body: { ok: false } }],
  ])("goes as picked for %s", async (_, summary) => {
    const h = harness();
    h.summaries.push(summary);
    h.mints.push(minted());
    h.checks.push(counted(3));
    expect(await h.walker.start("host", selection)).toBe(true);
    expect(h.mintBodies()).toEqual([{ step: "mint", ...selection, part: 1 }]);
  });

  it("never asks of Download all's own rows, nor of a guest", async () => {
    for (const [scope, body] of [
      ["host", { event_id: "e", types: "all", include_hidden: true }],
      ["guest", { qr_token: "qr", ids: ["a"], include_hidden: true }],
    ] as const) {
      const h = harness();
      h.mints.push(minted());
      h.checks.push(counted(3));
      await h.walker.start(scope, body);
      expect(
        h.calls.some((c) => String(c.init.body).includes('"step":"summary"')),
      ).toBe(false);
    }
  });
});
