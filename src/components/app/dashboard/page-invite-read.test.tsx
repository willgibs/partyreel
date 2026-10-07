import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CELL } from "./page-invite-light";

/**
 * READING HER PHOTOGRAPHS' LIGHT, ON HER DEVICE (`account-moments` r2, `invite=plate`). The ladder's rules are
 * `page-invite-light.test.ts`'s (on pixels); pinned here is the seam with the browser: the Server Function's answer is
 * decoded the hub's own CORS-clean way, one `CELL` of one strip a photograph, the bitmaps are released, and whatever fails
 * (no answer, a refused origin, no canvas) falls down the ladder instead of reaching the plate, so it is always lit.
 */

const readInviteLightAction = vi.fn();
vi.mock("@/app/(app)/me/actions", () => ({
  readInviteLightAction: () => readInviteLightAction(),
}));
const decodeImage = vi.fn();
vi.mock("@/lib/reel/engine/assets", () => ({
  decodeImage: (...args: unknown[]) => decodeImage(...args),
}));

const { readInviteLight } = await import("./page-invite-read");

/** A bitmap that can be released, and counts the releases. */
const bitmap = () => ({ close: vi.fn() }) as unknown as ImageBitmap;

/** The canvas the reader draws into: it records its draws and answers a strip of amber. */
function fakeCanvas(opts: { available?: boolean } = {}) {
  const drawImage = vi.fn();
  const getImageData = vi.fn((_x: number, _y: number, w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < data.length; i += 4) data.set([217, 119, 6, 255], i);
    return { data };
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((
    kind: string,
  ) =>
    kind === "2d" && opts.available !== false
      ? { drawImage, getImageData }
      : null) as unknown as HTMLCanvasElement["getContext"]);
  return { drawImage, getImageData };
}

beforeEach(() => {
  vi.clearAllMocks();
  readInviteLightAction.mockResolvedValue({
    photos: ["https://r2.test/a", "https://r2.test/b", "https://r2.test/c"],
    seed: "her-seed",
  });
  decodeImage.mockImplementation(async () => bitmap());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readInviteLight", () => {
  it("★ draws each decoded photograph into a cell of its own, in order, and reads the strip once", async () => {
    const { drawImage, getImageData } = fakeCanvas();
    const read = await readInviteLight();

    expect(decodeImage).toHaveBeenCalledTimes(3);
    expect(decodeImage.mock.calls.map((c) => c[0])).toEqual([
      "https://r2.test/a",
      "https://r2.test/b",
      "https://r2.test/c",
    ]);
    expect(drawImage.mock.calls.map((c) => c.slice(1))).toEqual([
      [0, 0, CELL, CELL],
      [CELL, 0, CELL, CELL],
      [2 * CELL, 0, CELL, CELL],
    ]);
    expect(getImageData).toHaveBeenCalledTimes(1);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 3 * CELL, CELL);
    expect(read).toMatchObject({ asked: 3, read: 3 });
    // Amber photographs: the plate is lit in amber, not in her seed's colour.
    expect(read.lit.from).toBe("photographs");
  });

  it("★ releases every decoded bitmap once its small copy is drawn", async () => {
    fakeCanvas();
    const made: { close: ReturnType<typeof vi.fn> }[] = [];
    decodeImage.mockImplementation(async () => {
      const b = bitmap();
      made.push(b as unknown as { close: ReturnType<typeof vi.fn> });
      return b;
    });
    await readInviteLight();
    expect(made).toHaveLength(3);
    for (const b of made) expect(b.close).toHaveBeenCalledTimes(1);
  });

  it("passes over a photograph that could not be read and lights from the ones that could", async () => {
    const { drawImage } = fakeCanvas();
    decodeImage
      .mockImplementationOnce(async () => bitmap())
      .mockImplementationOnce(async () => {
        throw new Error("HTTP 403");
      })
      .mockImplementationOnce(async () => bitmap());
    const read = await readInviteLight();
    expect(read).toMatchObject({ asked: 3, read: 2 });
    expect(drawImage).toHaveBeenCalledTimes(2);
    expect(read.lit.from).toBe("photographs");
  });

  it("★ falls to her seed's own hue when none could be read, and says how many were asked and read", async () => {
    fakeCanvas();
    decodeImage.mockRejectedValue(new Error("blocked by CORS"));
    const read = await readInviteLight();
    expect(read).toMatchObject({ asked: 3, read: 0 });
    expect(read.lit.from).toBe("seed");
  });

  it("falls to her seed's hue where the browser has no canvas to read with", async () => {
    fakeCanvas({ available: false });
    const read = await readInviteLight();
    expect(read.lit.from).toBe("seed");
    expect(read.read).toBe(0);
  });

  it("★ is her seed's light for an account with no photographs yet, and decodes nothing", async () => {
    readInviteLightAction.mockResolvedValue({ photos: [], seed: "her-seed" });
    const read = await readInviteLight();
    expect(decodeImage).not.toHaveBeenCalled();
    expect(read).toMatchObject({ asked: 0, read: 0 });
    expect(read.lit.from).toBe("seed");
  });

  it("★ is the house's ember when the server gave no answer at all (signed out, offline, a failed read)", async () => {
    for (const answer of [null, undefined]) {
      readInviteLightAction.mockResolvedValue(answer);
      expect((await readInviteLight()).lit.from).toBe("house");
    }
    readInviteLightAction.mockRejectedValue(new TypeError("Failed to fetch"));
    const read = await readInviteLight();
    expect(read.lit.from).toBe("house");
    expect(read).toMatchObject({ asked: 0, read: 0 });
    expect(decodeImage).not.toHaveBeenCalled();
  });
});
