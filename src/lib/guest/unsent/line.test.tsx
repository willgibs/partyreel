/**
 * IS THE LINE BACK? (no-signal r1, the board's carried call `check`). Pinned: the file the check asks for is the one
 * `public/` serves, with the very words it holds; an answer counts only when those words come back (a venue's sign-in
 * page answers every address with a 200 of its own); the phone's word is used only when it says offline; the watch asks
 * a few seconds on, then every 20 s, at once on `online` and on her return, never before the backoff, one ask at a time,
 * and never while nothing waits.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LINE_ANSWER_MS,
  LINE_BACKOFF_MAX_MS,
  LINE_EVERY_MS,
  LINE_FIRST_MS,
  LINE_TEXT,
  LINE_URL,
  lineAnswers,
  releaseGap,
  useLineWatch,
} from "./line";

const onLine = Object.getOwnPropertyDescriptor(Navigator.prototype, "onLine");
function phoneSays(online: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: online,
  });
}
afterEach(() => {
  delete (navigator as { onLine?: boolean }).onLine;
  if (onLine) Object.defineProperty(Navigator.prototype, "onLine", onLine);
});

describe("the line's file", () => {
  it("★ is served from public/ with the very words the check reads", () => {
    const body = readFileSync(
      join(process.cwd(), "public", LINE_URL.replace(/^\//, "")),
      "utf8",
    );
    expect(body.trim()).toBe(LINE_TEXT);
    // Static, beside the app's own files: no route, no function runs for it.
    expect(LINE_URL).toBe("/line.txt");
  });
});

describe("lineAnswers", () => {
  const reply = (status: number, text: string) =>
    vi.fn(
      async () =>
        ({
          ok: status >= 200 && status < 300,
          text: async () => text,
        }) as Response,
    );

  it("★ is true only when the file answers with its own words", async () => {
    expect(await lineAnswers(reply(200, `${LINE_TEXT}\n`))).toBe(true);
    // A venue's sign-in page answers every address, a 200 of its own: never the line.
    expect(
      await lineAnswers(
        reply(200, "<html><body>Log in to the Wi-Fi</body></html>"),
      ),
    ).toBe(false);
    expect(await lineAnswers(reply(503, LINE_TEXT))).toBe(false);
    expect(
      await lineAnswers(
        vi.fn(async () => {
          throw new TypeError("Failed to fetch");
        }),
      ),
    ).toBe(false);
  });

  it("asks past every cache, with no credential, and a query of its own", async () => {
    const ask = reply(200, LINE_TEXT);
    await lineAnswers(ask);
    const [url, init] = ask.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/^\/line\.txt\?t=\d+$/);
    expect(init).toMatchObject({ cache: "no-store", credentials: "omit" });
  });

  it("★ asks nothing while the phone says it is offline: the one way its word is true", async () => {
    phoneSays(false);
    const ask = reply(200, LINE_TEXT);
    expect(await lineAnswers(ask)).toBe(false);
    expect(ask).not.toHaveBeenCalled();
  });

  it("gives an ask that never answers up after its ceiling", async () => {
    vi.useFakeTimers();
    try {
      const ask = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("aborted", "AbortError")),
            );
          }),
      ) as unknown as typeof fetch;
      const answered = lineAnswers(ask);
      await vi.advanceTimersByTimeAsync(LINE_ANSWER_MS);
      expect(await answered).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("releaseGap", () => {
  it("★ is nothing for a first drop, then doubles from 40 s, and stops at five minutes", () => {
    expect(releaseGap(0)).toBe(0);
    expect(releaseGap(1)).toBe(2 * LINE_EVERY_MS);
    expect(releaseGap(2)).toBe(4 * LINE_EVERY_MS);
    expect(releaseGap(3)).toBe(8 * LINE_EVERY_MS);
    expect(releaseGap(4)).toBe(LINE_BACKOFF_MAX_MS);
    expect(releaseGap(40)).toBe(LINE_BACKOFF_MAX_MS);
  });
});

describe("useLineWatch", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function watch(initial: {
    waiting: boolean;
    notBefore?: number;
    up?: boolean;
  }) {
    const state = {
      up: initial.up ?? false,
      notBefore: initial.notBefore ?? 0,
    };
    const ask = vi.fn(async () => state.up);
    const onBack = vi.fn();
    const hook = renderHook(
      ({ waiting }: { waiting: boolean }) =>
        useLineWatch({
          waiting,
          notBefore: () => state.notBefore,
          onBack,
          ask,
        }),
      { initialProps: { waiting: initial.waiting } },
    );
    return { ...hook, ask, onBack, state };
  }
  const advance = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  it("★ asks a few seconds on, then every 20 s, and says the line is back once it answers", async () => {
    const w = watch({ waiting: true });
    await advance(LINE_FIRST_MS - 1);
    expect(w.ask).not.toHaveBeenCalled();
    await advance(1);
    expect(w.ask).toHaveBeenCalledTimes(1);
    expect(w.onBack).not.toHaveBeenCalled();
    await advance(LINE_EVERY_MS);
    expect(w.ask).toHaveBeenCalledTimes(2);
    w.state.up = true;
    await advance(LINE_EVERY_MS);
    expect(w.onBack).toHaveBeenCalledTimes(1);
  });

  it("★ asks at once when the phone says it is online, and when she comes back to the page", async () => {
    const w = watch({ waiting: true, up: true });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    expect(w.onBack).toHaveBeenCalledTimes(1);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(w.onBack).toHaveBeenCalledTimes(2);
  });

  it("★ asks nothing before the backoff, whatever asks for it", async () => {
    const w = watch({
      waiting: true,
      up: true,
      notBefore: Date.now() + 90_000,
    });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    await advance(LINE_EVERY_MS * 4);
    expect(w.ask).not.toHaveBeenCalled();
    await advance(10_000);
    expect(w.onBack).toHaveBeenCalledTimes(1);
  });

  it("is off while nothing waits: nothing listens and nothing is asked", async () => {
    const w = watch({ waiting: false, up: true });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });
    await advance(LINE_EVERY_MS * 3);
    expect(w.ask).not.toHaveBeenCalled();
    // And stops the moment the wait ends.
    w.rerender({ waiting: true });
    w.rerender({ waiting: false });
    await advance(LINE_EVERY_MS * 3);
    expect(w.ask).not.toHaveBeenCalled();
  });

  it("keeps one ask out at a time", async () => {
    const w = watch({ waiting: true });
    let answer: (up: boolean) => void = () => {};
    w.ask.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      window.dispatchEvent(new Event("online"));
    });
    expect(w.ask).toHaveBeenCalledTimes(1);
    await act(async () => answer(true));
    expect(w.onBack).toHaveBeenCalledTimes(1);
  });
});
