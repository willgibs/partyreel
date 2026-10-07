import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { HostMediaGrid, type HubRows } from "@/components/app/host-media-grid";
import { ARRIVAL_GLOW_MS, newIds } from "@/lib/shared/arrival";
import { ARRIVAL_HOLD_MAX } from "@/components/shared/use-arrival-gate";
import { setReducedMotion } from "../../../vitest.setup";

/**
 * THE HOST'S ALBUM HOLDS A LIVE ARRIVAL AT THE DOOR UNTIL IT CAN LAND COMPLETE (crumbs-25; the guest album's is
 * `guest/gallery-rows.test.tsx`, and the gate's own rules are `shared/use-arrival-gate.test.tsx`'s).
 *
 * The one grid (`MasonryColumns`) is a spy here: what is pinned is what the host's wiring HANDS it, the list
 * it lays and the light it writes. Until this lane the host laid whatever the hub's store handed it, so an
 * arrival (the manifest's tuple with no link, since only a window asks for links) drew a shimmer and faded its
 * photograph in after the row had opened, and it glowed from the moment the delta came, however late it
 * landed. Now it is held out of the rows until its link has landed and its photograph is decoded, then laid
 * as a photograph the browser already holds, and lit for one glow from that moment.
 */
const { gridSpy } = vi.hoisted(() => ({ gridSpy: vi.fn() }));
// The arrival grammar's one sentence, spied and left real: the grid must read it, not write its own (crumbs-27).
vi.mock("@/lib/shared/arrival", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shared/arrival")>();
  return { ...actual, newIds: vi.fn(actual.newIds) };
});
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: (props: unknown) => {
    gridSpy(props);
    return <div data-testid="grid" />;
  },
}));

// The hub's plumbing the grid reads: none of it is what is pinned here.
const writes = vi.hoisted(() => ({
  setStatus: vi.fn(async () => ({ ok: true as const })),
  remove: vi.fn(async () => ({ ok: true as const })),
  setStatusBulk: vi.fn(async () => ({ ok: true as const })),
  removeBulk: vi.fn(async () => ({ ok: true as const })),
}));
vi.mock("@/components/app/event-feed/host-album", () => ({
  useHubWrites: () => writes,
}));
vi.mock("@/components/app/host-selection-provider", () => ({
  useHostSelection: () => null,
}));
vi.mock("@/components/app/export/use-export-download", () => ({
  useExportDownload: () => ({ startDownload: vi.fn() }),
}));
vi.mock("@/components/likes/likes-provider", () => ({ useLikes: () => null }));
vi.mock("@/components/likes/like-button", () => ({
  useLikeAction: () => () => null,
}));

type GridProps = {
  items: GridMedia[];
  arrivedIds?: ReadonlySet<string>;
  onSetStatus?: (item: GridMedia, status: "approved" | "hidden") => void;
};
const grid = () => gridSpy.mock.calls.at(-1)![0] as GridProps;
const laid = () => grid().items.map((item) => item.id);
const glowing = () => [...(grid().arrivedIds ?? [])];

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
  setReducedMotion(false);
});

/** A photograph of the album: linked (its preview and original, as a link brings them) or not yet. */
const photo = (
  id: string,
  linked = true,
  status: GridMedia["status"] = "approved",
): GridMedia => ({
  id,
  type: "photo",
  url: linked ? `https://r2.test/o/${id}` : "",
  previewUrl: linked ? `https://r2.test/t/${id}` : null,
  width: 640,
  height: 480,
  status,
});
const SEED = [photo("a"), photo("b")];

/** The hub's window: what the page's store hands the grid besides the album. */
const hub = (onNeedLinks?: HubRows["onNeedLinks"]): HubRows => ({
  step: 1,
  onStepChange: () => {},
  anchor: "end",
  rhythmSeed: 0,
  onWindowChange: () => {},
  onNeedLinks,
  afterWrite: async () => {},
});

function Grid({ items, rows }: { items: GridMedia[]; rows?: HubRows }) {
  return <HostMediaGrid eventId="evt" items={items} rows={rows} />;
}

/** Let the clock run `ms` (timers and every promise they release). */
const wait = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

describe("HostMediaGrid: an arrival is laid when it can land complete", () => {
  it("★ lays the seed as it is, then an arrival only once its link has landed and its photograph is decoded", async () => {
    const onNeedLinks = vi.fn();
    const rows = hub(onNeedLinks);
    const view = render(<Grid items={SEED} rows={rows} />);
    expect(laid()).toEqual(["a", "b"]);
    expect(glowing()).toEqual([]);

    // The delta: the manifest's tuple alone, no link. The rows are not handed it, and its link is asked
    // for here, since no window stands over it to ask.
    view.rerender(<Grid items={[photo("c", false), ...SEED]} rows={rows} />);
    expect(laid()).toEqual(["a", "b"]);
    expect(onNeedLinks).toHaveBeenCalledWith(["c"]);
    expect(decodes).toHaveLength(0);
    expect(glowing()).toEqual([]);

    // The link lands and the preview is fetched into the document: still not laid until it is decoded.
    view.rerender(<Grid items={[photo("c"), ...SEED]} rows={rows} />);
    expect(decodes.map((d) => d.src)).toEqual(["https://r2.test/t/c"]);
    expect(laid()).toEqual(["a", "b"]);

    await act(async () => decodes[0].resolve());
    expect(laid()).toEqual(["c", "a", "b"]);
    await wait(0);
    expect(glowing()).toEqual(["c"]);
  });

  it("lights an arrival for one glow from the moment it lands, never from the delta", async () => {
    const rows = hub(vi.fn());
    const view = render(<Grid items={SEED} rows={rows} />);
    view.rerender(<Grid items={[photo("c", false), ...SEED]} rows={rows} />);
    // The delta came a second ago; the link only just landed.
    await wait(1000);
    view.rerender(<Grid items={[photo("c"), ...SEED]} rows={rows} />);
    await act(async () => decodes[0].resolve());
    await wait(0);
    expect(glowing()).toEqual(["c"]);

    // A full glow after it landed (not after the delta), and no more.
    await wait(ARRIVAL_GLOW_MS - 1);
    expect(glowing()).toEqual(["c"]);
    await wait(2);
    expect(glowing()).toEqual([]);
    expect(laid()).toEqual(["c", "a", "b"]);
  });

  it("lays what is not an arrival at once: a new order, a status flip, a link landing", () => {
    const rows = hub(vi.fn());
    const view = render(<Grid items={SEED} rows={rows} />);
    // Sort reverses the same ids.
    view.rerender(<Grid items={[SEED[1], SEED[0]]} rows={rows} />);
    expect(laid()).toEqual(["b", "a"]);
    // A hide in another tab flips a status.
    view.rerender(
      <Grid items={[SEED[1], photo("a", true, "hidden")]} rows={rows} />,
    );
    expect(laid()).toEqual(["b", "a"]);
    // A window's links re-mint the same tiles.
    view.rerender(
      <Grid
        items={[
          { ...SEED[1], url: "https://r2.test/o/b?v=2" },
          photo("a", true, "hidden"),
        ]}
        rows={rows}
      />,
    );
    expect(laid()).toEqual(["b", "a"]);
    expect(decodes).toHaveLength(0);
    expect(glowing()).toEqual([]);
  });

  it("never holds the host's own optimistic hide, which adds and removes nothing", async () => {
    const rows = hub(vi.fn());
    render(<Grid items={SEED} rows={rows} />);
    await act(async () => {
      grid().onSetStatus?.(SEED[0], "hidden");
    });
    expect(laid()).toEqual(["a", "b"]);
    expect(decodes).toHaveLength(0);
    expect(glowing()).toEqual([]);
  });

  it("stops holding an arrival that is removed while it waits", async () => {
    const rows = hub(vi.fn());
    const view = render(<Grid items={SEED} rows={rows} />);
    view.rerender(<Grid items={[photo("c", false), ...SEED]} rows={rows} />);
    expect(laid()).toEqual(["a", "b"]);
    // Deleted in another tab before its photograph came.
    view.rerender(<Grid items={SEED} rows={rows} />);
    view.rerender(<Grid items={[photo("c"), ...SEED]} rows={rows} />);
    await wait(0);
    // An id that has arrived once is judged once: it comes back as the album's own tile, at once.
    expect(laid()).toEqual(["c", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });

  // ★ RESHAPED (album-moments-wiring): titled "holds at most a dozen at once, and lays the rest as they come", the three
  // past the cap laid at once. The cap's reason stands (twelve fetched, never fifteen: `onNeedLinks` hears twelve);
  // what expired is laying the rest ahead of their batch, which re-laid the top twice where guest-moments r1's
  // `batch=settle` asks a batch to land as one.
  it("fetches at most a dozen at once; the rest wait with their batch, and it goes in whole", async () => {
    const onNeedLinks = vi.fn();
    const rows = hub(onNeedLinks);
    const view = render(<Grid items={SEED} rows={rows} />);
    const burst = Array.from({ length: ARRIVAL_HOLD_MAX + 3 }, (_, i) =>
      photo(`n${i}`, false),
    );
    view.rerender(<Grid items={[...burst, ...SEED]} rows={rows} />);
    expect(onNeedLinks).toHaveBeenCalledWith(
      burst.slice(0, ARRIVAL_HOLD_MAX).map((p) => p.id),
    );
    expect(laid()).toEqual(["a", "b"]);
    // No link ever lands: the batch's wait lets all fifteen in together.
    await wait(2100);
    expect(laid()).toHaveLength(SEED.length + burst.length);
  });

  it("waits a slow arrival out and lays it as it always was, in the two seconds the gate allows", async () => {
    const rows = hub(vi.fn());
    const view = render(<Grid items={SEED} rows={rows} />);
    view.rerender(<Grid items={[photo("c", false), ...SEED]} rows={rows} />);
    await wait(2100);
    expect(laid()).toEqual(["c", "a", "b"]);
  });

  it("holds nothing under reduced motion, which pushes nothing and fades nothing", async () => {
    setReducedMotion(true);
    const rows = hub(vi.fn());
    const view = render(<Grid items={SEED} rows={rows} />);
    view.rerender(<Grid items={[photo("c", false), ...SEED]} rows={rows} />);
    expect(laid()).toEqual(["c", "a", "b"]);
    expect(decodes).toHaveLength(0);
  });

  it("with no hub behind it (the Library's plain grid) a linked arrival waits for its photograph alone", async () => {
    const view = render(<Grid items={SEED} />);
    view.rerender(<Grid items={[photo("c"), ...SEED]} />);
    expect(laid()).toEqual(["a", "b"]);
    expect(decodes.map((d) => d.src)).toEqual(["https://r2.test/t/c"]);
    await act(async () => decodes[0].resolve());
    expect(laid()).toEqual(["c", "a", "b"]);
  });
});

describe("HostMediaGrid reads what arrived through the grammar's one diff (crumbs-27)", () => {
  it("★ asks the shared diff, over the ids of the last render and of this one", () => {
    vi.mocked(newIds).mockClear();
    const { rerender } = render(<Grid items={SEED} rows={hub()} />);
    rerender(<Grid items={[photo("c"), ...SEED]} rows={hub()} />);
    expect(newIds).toHaveBeenCalledWith(new Set(["a", "b"]), ["c", "a", "b"]);
  });

  it("an album that starts empty still lights its first photograph: the seed is the first render, not the emptiness", () => {
    // The guest's reconciler answers nothing for an empty last snapshot (its own seed rule, for a teaser's
    // empty answer); the host's first render is real, so what turns up after an empty one arrives.
    const { rerender } = render(<Grid items={[]} rows={hub()} />);
    rerender(<Grid items={[photo("a")]} rows={hub()} />);
    expect(vi.mocked(newIds).mock.results.at(-1)?.value).toEqual(
      new Set(["a"]),
    );
  });
});
