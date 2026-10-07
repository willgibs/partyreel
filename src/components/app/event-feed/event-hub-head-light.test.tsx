import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { HeadStill } from "@/components/guest/event-experience-head";
import { ENTRY_PREVIEW, ENTRY_REEL } from "@/lib/events/album-wire";
import { read } from "@/testing/source-tree";

/**
 * THE HUB'S ONE LIGHT (event-header r6, the Seam made Afterglow's): what it reads, when, and what it wears until then.
 * The browser's decode and canvas are stood in for (a picture is a box whose last rows say one colour each), as is the
 * cover's box; what is held is the plumbing no screenshot shows: the cover's clock, a read per photograph a page, previews
 * only, the quiet stand-in and the one warning a page.
 */

const decodes = vi.hoisted(() => ({ fail: false, calls: [] as string[] }));
vi.mock("@/lib/reel/engine/assets", () => ({
  decodeImage: async (src: string) => {
    decodes.calls.push(src);
    if (decodes.fail) throw new Error("Failed to fetch");
    // A bitmap's own size; the stood-in canvas below paints its pixels.
    return { width: 40, height: 30, close: () => {} };
  },
}));
const warning = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/sentry", () => ({ captureWarning: warning }));
const album = vi.hoisted(() => ({
  entries: null as null | (readonly [string, number, number, number, number])[],
}));
vi.mock("./host-album", () => ({
  useHostAlbum: () => (album.entries ? {} : null),
  useHubEntries: () => album.entries,
}));

const { HubLight, HOLD_SEC } = await import("./event-hub-head-light");

/** Every picture drawn here is red: its last rows, its 32px read, all of it. */
function standInCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (this: HTMLCanvasElement) {
      const { width, height } = this;
      return {
        drawImage: () => {},
        getImageData: () => {
          const data = new Uint8ClampedArray(width * height * 4);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 220;
            data[i + 1] = 30;
            data[i + 2] = 30;
            data[i + 3] = 255;
          }
          return { data };
        },
      } as unknown as CanvasRenderingContext2D;
    } as unknown as HTMLCanvasElement["getContext"],
  );
}

/** The hub as the light finds it: the cover first, at a desk's size, then the light. */
function hub(stills: readonly HeadStill[]) {
  return render(
    <>
      <section data-event-head="hub" />
      <HubLight stills={stills} />
    </>,
  );
}

let n = 0;
/** Stills the page has never read (the reads are the page's, once each). */
const fresh = (count: number): HeadStill[] =>
  Array.from({ length: count }, () => {
    n += 1;
    return {
      id: `still-${n}`,
      tile: `https://r2.test/still-${n}/preview.webp`,
    };
  });

const light = () => document.querySelector<HTMLElement>("[data-hub-light]")!;
const slots = () => [
  ...document.querySelectorAll<HTMLElement>(".hub-light-slot"),
];
const settle = () => act(async () => new Promise((r) => setTimeout(r, 400)));

class Unobserved {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  decodes.fail = false;
  decodes.calls = [];
  album.entries = null;
  warning.mockClear();
  vi.stubGlobal("ResizeObserver", Unobserved);
  standInCanvas();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const cover = this.matches('[data-event-head="hub"]');
      const w = cover ? 1440 : 0;
      const h = cover ? 400 : 0;
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        width: w,
        height: h,
        right: w,
        bottom: h,
        toJSON: () => ({}),
      };
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("the cover's clock", () => {
  it("★ holds a photograph as long as the cover does: one hold, the cover's own", () => {
    // The cover keeps its hold to itself (`event-experience-head.tsx`), so the light's copy is held to it here: a light
    // on another clock would cross to the next photograph's colours while the last photograph still shows.
    const cover = read("src/components/guest/event-experience-head.tsx");
    const held = /const HOLD_SEC = ([\d.]+);/.exec(cover);
    expect(held, "the cover's hold was not found").not.toBeNull();
    expect(HOLD_SEC).toBe(Number(held![1]));
  });

  it("★ draws a slot a still, keyed and delayed as the cover's own six, the first at rest", () => {
    hub(fresh(4));
    const s = slots();
    // Four photographs cycle through the cover's six slots, as `HeadStills` does.
    expect(s).toHaveLength(6);
    s.forEach((slot, i) => {
      expect(Number(slot.style.getPropertyValue("--head-delay"))).toBeCloseTo(
        i * HOLD_SEC - HOLD_SEC * 6,
      );
      expect(slot.hasAttribute("data-cycle")).toBe(true);
    });
    expect(s[0]).toHaveAttribute("data-rest");
    expect(s.slice(1).some((slot) => slot.hasAttribute("data-rest"))).toBe(
      false,
    );
  });

  it("stands one photograph's light still, as the cover stands one photograph", () => {
    hub(fresh(1));
    expect(slots()).toHaveLength(1);
    expect(slots()[0].hasAttribute("data-cycle")).toBe(false);
  });
});

describe("what it reads, and what it wears until then", () => {
  it("wears the house's dusk, at once, where the cover has no photograph", () => {
    hub([]);
    expect(light()).toHaveAttribute("data-hub-light", "house");
    expect(slots()).toHaveLength(1);
    expect(slots()[0].dataset.hues).toBe("80 66 52 43 34 24");
    expect(decodes.calls).toEqual([]);
  });

  it("★ is unlit while its first photograph is read, then lit in that photograph's edge", async () => {
    hub(fresh(1));
    // The server's paint and the first frame: nothing read yet, so nothing lit (a quiet stand-in, never a guess).
    expect(light()).toHaveAttribute("data-hub-light", "reading");
    expect(slots()[0].querySelector(".hub-light-lit")).toBeNull();
    await settle();
    expect(light()).toHaveAttribute("data-hub-light", "lit");
    // Red pixels, a red edge: six sixths of one hue near red's.
    const hues = slots()[0].dataset.hues!.split(" ").map(Number);
    expect(hues).toHaveLength(6);
    hues.forEach((h) => expect(h < 45 || h > 345).toBe(true));
    expect(slots()[0].querySelector(".hub-light-glow")).not.toBeNull();
  });

  it("★ reads a photograph once a page, however often the light is drawn", async () => {
    const stills = fresh(2);
    const { unmount } = hub(stills);
    await settle();
    expect(decodes.calls).toHaveLength(2);
    unmount();
    hub(stills);
    await settle();
    expect(decodes.calls).toHaveLength(2);
  });

  it("★ reads only previews on the hub: a photograph shown as its original borrows a read neighbour's light", async () => {
    const [shown, original] = fresh(2);
    album.entries = [
      [shown.id, 40, 30, ENTRY_PREVIEW | ENTRY_REEL, 1],
      [original.id, 40, 30, ENTRY_REEL, 2],
    ];
    hub([shown, original]);
    await settle();
    // The original is never fetched: a read of megabytes for six rows of it.
    expect(decodes.calls).toEqual([shown.tile]);
    const [a, b] = slots();
    expect(b.dataset.hues).toBe(a.dataset.hues);
    expect(light()).toHaveAttribute("data-hub-light", "lit");
  });

  it("wears the house's dusk, with no read, where no photograph on the cover has a preview", () => {
    const stills = fresh(2);
    album.entries = stills.map(
      (s, i) => [s.id, 40, 30, ENTRY_REEL, i] as const,
    );
    hub(stills);
    expect(decodes.calls).toEqual([]);
    expect(light()).toHaveAttribute("data-hub-light", "house");
  });

  it("★ says so once a page where failures are read when none of its previews can be read, and wears the house's dusk", async () => {
    decodes.fail = true;
    hub(fresh(2));
    await settle();
    expect(light()).toHaveAttribute("data-hub-light", "house");
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning.mock.calls[0][0]).toBe("media");
    // A second cover that cannot be read on the same page says nothing more.
    hub(fresh(1));
    await settle();
    expect(warning).toHaveBeenCalledTimes(1);
  });
});
