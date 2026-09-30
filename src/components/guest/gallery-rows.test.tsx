import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { GalleryRows } from "@/components/guest/gallery-rows";

/**
 * THE GUEST ALBUM'S ROWS HOLD A LIVE ARRIVAL AT THE DOOR UNTIL IT CAN LAND COMPLETE (crumbs-23, build 26's
 * red-team: "A live pushed arrival still fades").
 *
 * The one grid (`MasonryColumns`) is a spy here: what is pinned is what the guest's wiring HANDS it, the
 * list it lays and the marks it writes. Until this lane the wiring passed the album through untouched, so
 * an arrival was laid the moment the manifest brought it, before its link had been asked for, and its
 * photograph faded in a beat after the row had opened. The gate's own rules are `use-arrival-gate.test`'s.
 */
const { gridSpy } = vi.hoisted(() => ({ gridSpy: vi.fn() }));
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: (props: unknown) => {
    gridSpy(props);
    return <div data-testid="grid" />;
  },
}));

type GridProps = {
  items: GridMedia[];
  arrivedIds?: ReadonlySet<string>;
  landedIds?: ReadonlySet<string>;
};
const grid = () => gridSpy.mock.calls.at(-1)![0] as GridProps;
const laid = () => grid().items.map((item) => item.id);

let decodes: { src: string; resolve: () => void }[] = [];
class FakeImage {
  decoding = "";
  src = "";
  decode() {
    return new Promise<void>((resolve) => {
      decodes.push({ src: this.src, resolve });
    });
  }
}

beforeEach(() => {
  decodes = [];
  gridSpy.mockClear();
  vi.useFakeTimers();
  vi.stubGlobal("Image", FakeImage);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const photo = (id: string, linked = true): GridMedia => ({
  id,
  type: "photo",
  url: linked ? `https://r2.test/o/${id}` : "",
  previewUrl: linked ? `https://r2.test/t/${id}` : null,
  width: 640,
  height: 480,
});
const SEED = [photo("a"), photo("b")];

/** The props the live view hands the rows that this file does not care about. */
const REST = {
  step: 1 as const,
  onStepChange: () => {},
  seed: 0,
};

describe("GalleryRows: an arrival is laid when it can land complete", () => {
  it("★ lays the seed as it is, then an arrival only once its link has landed and its photograph is decoded", async () => {
    const onNeedLinks = vi.fn();
    const view = render(
      <GalleryRows
        {...REST}
        items={SEED}
        arrivals={[]}
        onNeedLinks={onNeedLinks}
      />,
    );
    expect(laid()).toEqual(["a", "b"]);

    // The delta: the manifest's tuple alone, no link. The rows are not handed it, and its link is asked for
    // here, since no window stands over it to ask.
    view.rerender(
      <GalleryRows
        {...REST}
        items={[photo("c", false), ...SEED]}
        arrivals={["c"]}
        onNeedLinks={onNeedLinks}
      />,
    );
    expect(laid()).toEqual(["a", "b"]);
    expect(onNeedLinks).toHaveBeenCalledWith(["c"]);

    // The link lands and the preview is fetched into the document: still not laid until it is decoded.
    view.rerender(
      <GalleryRows
        {...REST}
        items={[photo("c"), ...SEED]}
        arrivals={["c"]}
        onNeedLinks={onNeedLinks}
      />,
    );
    expect(decodes.map((d) => d.src)).toEqual(["https://r2.test/t/c"]);
    expect(laid()).toEqual(["a", "b"]);

    await act(async () => decodes[0].resolve());
    expect(laid()).toEqual(["c", "a", "b"]);
  });

  it("writes the arrival's glow when it is laid, and this device's own landing's sweep as it is handed", async () => {
    const own = new Set(["a"]);
    const view = render(
      <GalleryRows {...REST} items={SEED} arrivals={[]} landedIds={own} />,
    );
    expect(grid().landedIds).toBe(own);
    expect(grid().arrivedIds?.size ?? 0).toBe(0);

    view.rerender(
      <GalleryRows
        {...REST}
        items={[photo("c"), ...SEED]}
        arrivals={["c"]}
        landedIds={own}
      />,
    );
    // Held: nothing glows for a photograph that is not in the rows.
    expect(grid().arrivedIds?.has("c") ?? false).toBe(false);
    await act(async () => decodes[0].resolve());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(grid().arrivedIds?.has("c")).toBe(true);
    expect(grid().landedIds).toBe(own);
  });

  it("lays an album handed no arrivals exactly as it is handed it", () => {
    const view = render(<GalleryRows {...REST} items={SEED} />);
    view.rerender(
      <GalleryRows {...REST} items={[photo("c", false), ...SEED]} />,
    );
    expect(laid()).toEqual(["c", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });
});
