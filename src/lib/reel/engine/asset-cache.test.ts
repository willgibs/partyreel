/**
 * Pins for the shared decoded-bitmap cache. The contract that matters is BEHAVIORAL — dedupe, LRU
 * release, abort isolation — not the fetch underneath, so these drive `createBitmapCache` with a
 * fake decoder (no DOM, no network; this runs in the node `unit` project).
 */
import { describe, expect, it, vi } from "vitest";

import { createBitmapCache } from "./asset-cache";
import type { CanvasImage } from "./canvas2d";

/** A stand-in decoded image with the duck-typed `close` an ImageBitmap has. */
function fakeImage(label: string) {
  return { label, close: vi.fn() } as unknown as CanvasImage & {
    label: string;
    close: ReturnType<typeof vi.fn>;
  };
}

/** A decoder whose promises resolve only when the test says so. */
function deferredDecoder() {
  const pending = new Map<
    string,
    { resolve: (img: CanvasImage) => void; reject: (err: unknown) => void }
  >();
  const decode = vi.fn(
    (url: string) =>
      new Promise<CanvasImage>((resolve, reject) => {
        pending.set(url, { resolve, reject });
      }),
  );
  return { decode, pending };
}

describe("createBitmapCache", () => {
  it("dedupes concurrent callers onto ONE in-flight decode", async () => {
    const { decode, pending } = deferredDecoder();
    const cache = createBitmapCache(decode);

    const a = cache.decode("u1");
    const b = cache.decode("u1");
    const c = cache.decode("u1");
    expect(decode).toHaveBeenCalledTimes(1);

    const image = fakeImage("one");
    pending.get("u1")!.resolve(image);
    expect(await Promise.all([a, b, c])).toEqual([image, image, image]);

    // And a LATER caller re-reads the settled entry rather than decoding again.
    expect(await cache.decode("u1")).toBe(image);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("does NOT pass a caller's signal to the shared decode", () => {
    const { decode } = deferredDecoder();
    const cache = createBitmapCache(decode);
    void cache.decode("u1", new AbortController().signal);
    // One thumb unmounting must not cancel the decode 14 other players are awaiting.
    expect(decode).toHaveBeenCalledWith("u1");
    expect(decode.mock.calls[0]).toHaveLength(1);
  });

  it("closes the evicted bitmap when the LRU overflows", async () => {
    const decoded = new Map<string, ReturnType<typeof fakeImage>>();
    const cache = createBitmapCache(async (url) => {
      const image = fakeImage(url);
      decoded.set(url, image);
      return image;
    }, 2);

    await cache.decode("u1");
    await cache.decode("u2");
    expect(cache.size()).toBe(2);
    expect(decoded.get("u1")!.close).not.toHaveBeenCalled();

    await cache.decode("u3"); // overflows -> u1 (the oldest) goes
    await Promise.resolve(); // the close rides a .then on the evicted promise
    expect(cache.size()).toBe(2);
    expect(decoded.get("u1")!.close).toHaveBeenCalledTimes(1);
    expect(decoded.get("u2")!.close).not.toHaveBeenCalled();
    expect(decoded.get("u3")!.close).not.toHaveBeenCalled();
  });

  it("a cache HIT refreshes recency, so the untouched url is the one evicted", async () => {
    const decoded = new Map<string, ReturnType<typeof fakeImage>>();
    const cache = createBitmapCache(async (url) => {
      const image = fakeImage(url);
      decoded.set(url, image);
      return image;
    }, 2);

    await cache.decode("u1");
    await cache.decode("u2");
    await cache.decode("u1"); // touch: u2 is now the oldest
    await cache.decode("u3");
    await Promise.resolve();

    expect(decoded.get("u2")!.close).toHaveBeenCalledTimes(1);
    expect(decoded.get("u1")!.close).not.toHaveBeenCalled();
  });

  it("rejects ONLY the aborting caller; the shared decode still serves everyone else", async () => {
    const { decode, pending } = deferredDecoder();
    const cache = createBitmapCache(decode);
    const controller = new AbortController();

    const aborting = cache.decode("u1", controller.signal);
    const patient = cache.decode("u1");
    expect(decode).toHaveBeenCalledTimes(1);

    controller.abort();
    await expect(aborting).rejects.toMatchObject({ name: "AbortError" });

    const image = fakeImage("one");
    pending.get("u1")!.resolve(image);
    expect(await patient).toBe(image);
    // The entry survived the abort, so the next caller is still a cache hit.
    expect(await cache.decode("u1")).toBe(image);
    expect(decode).toHaveBeenCalledTimes(1);
  });

  it("rejects immediately on an ALREADY-aborted signal", async () => {
    const { decode } = deferredDecoder();
    const cache = createBitmapCache(decode);
    const controller = new AbortController();
    controller.abort();
    await expect(cache.decode("u1", controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("does not cache a FAILED decode (a flaky load must not black out the session)", async () => {
    let attempt = 0;
    const cache = createBitmapCache(async (url) => {
      attempt += 1;
      if (attempt === 1) throw new Error("network");
      return fakeImage(url);
    });

    await expect(cache.decode("u1")).rejects.toThrow("network");
    expect(cache.size()).toBe(0);
    await expect(cache.decode("u1")).resolves.toBeTruthy();
    expect(attempt).toBe(2);
  });

  it("clear() drops + closes everything", async () => {
    const decoded = new Map<string, ReturnType<typeof fakeImage>>();
    const cache = createBitmapCache(async (url) => {
      const image = fakeImage(url);
      decoded.set(url, image);
      return image;
    });
    await cache.decode("u1");
    await cache.decode("u2");
    cache.clear();
    await Promise.resolve();
    expect(cache.size()).toBe(0);
    expect(decoded.get("u1")!.close).toHaveBeenCalledTimes(1);
    expect(decoded.get("u2")!.close).toHaveBeenCalledTimes(1);
  });
});
