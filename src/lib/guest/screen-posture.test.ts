/**
 * THE REEL ON A SCREEN: the one tap takes the document fullscreen where the platform allows it and
 * keeps the screen awake, taken again every time the tab comes back, let go for good on release,
 * and every platform gap is a quiet no rather than an error on a wall.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canFullscreen,
  createWakeLock,
  enterFullscreen,
  isFullscreen,
} from "./screen-posture";

afterEach(() => {
  vi.restoreAllMocks();
});

function fakeDoc(opts: { request?: () => Promise<void>; full?: boolean }) {
  let visibility: "visible" | "hidden" = "visible";
  const listeners = new Map<string, Set<() => void>>();
  const doc = {
    documentElement: opts.request ? { requestFullscreen: opts.request } : {},
    fullscreenElement: opts.full ? {} : null,
    get visibilityState() {
      return visibility;
    },
    addEventListener: (type: string, fn: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners.get(type)?.delete(fn);
    },
    fire(type: string) {
      for (const fn of listeners.get(type) ?? []) fn();
    },
    setVisibility(v: "visible" | "hidden") {
      visibility = v;
    },
    count: (type: string) => listeners.get(type)?.size ?? 0,
  };
  return doc as unknown as Document & {
    fire: (type: string) => void;
    setVisibility: (v: "visible" | "hidden") => void;
    count: (type: string) => number;
  };
}

describe("fullscreen", () => {
  it("takes the document's root, and says whether it could", async () => {
    const request = vi.fn(async () => {});
    const doc = fakeDoc({ request });
    expect(canFullscreen(doc)).toBe(true);
    expect(await enterFullscreen(doc)).toBe(true);
    expect(request).toHaveBeenCalledWith({ navigationUI: "hide" });
  });

  it("is a quiet no where the platform has none, or refuses", async () => {
    expect(canFullscreen(fakeDoc({}))).toBe(false);
    expect(await enterFullscreen(fakeDoc({}))).toBe(false);
    const refusing = fakeDoc({
      request: async () => {
        throw new Error("denied");
      },
    });
    expect(await enterFullscreen(refusing)).toBe(false);
  });

  it("does nothing when already there", async () => {
    const request = vi.fn(async () => {});
    const doc = fakeDoc({ request, full: true });
    expect(isFullscreen(doc)).toBe(true);
    expect(await enterFullscreen(doc)).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });
});

describe("the wake lock", () => {
  function fakeNav() {
    const sentinels: { release: ReturnType<typeof vi.fn>; released: boolean }[] =
      [];
    const request = vi.fn(async () => {
      const s = {
        released: false,
        release: vi.fn(async () => {
          s.released = true;
        }),
      };
      sentinels.push(s);
      return s;
    });
    return { nav: { wakeLock: { request } }, request, sentinels };
  }

  it("holds the screen, and takes it again when the tab comes back", async () => {
    const { nav, request, sentinels } = fakeNav();
    const doc = fakeDoc({});
    const lock = createWakeLock(nav, doc);
    expect(await lock.acquire()).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);

    // The platform lets go while the tab is hidden (the spec), and the return takes it again.
    sentinels[0].released = true;
    doc.setVisibility("visible");
    doc.fire("visibilitychange");
    await Promise.resolve();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("lets go for good on release: no re-take, no listener left behind", async () => {
    const { nav, request, sentinels } = fakeNav();
    const doc = fakeDoc({});
    const lock = createWakeLock(nav, doc);
    await lock.acquire();
    lock.release();
    expect(sentinels[0].release).toHaveBeenCalled();
    expect(doc.count("visibilitychange")).toBe(0);
    doc.fire("visibilitychange");
    expect(request).toHaveBeenCalledTimes(1);
    expect(lock.wanted()).toBe(false);
  });

  it("is a quiet no without the API, or when the request is refused", async () => {
    expect(await createWakeLock({}, fakeDoc({})).acquire()).toBe(false);
    const refused = createWakeLock(
      {
        wakeLock: {
          request: async () => {
            throw new Error("battery saver");
          },
        },
      },
      fakeDoc({}),
    );
    expect(await refused.acquire()).toBe(false);
  });
});
