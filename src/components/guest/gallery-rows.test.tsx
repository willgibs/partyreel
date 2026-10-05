import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportToasts } from "@/components/app/export/export-toast";
import type { GridMedia } from "@/components/app/media-grid";
import { GalleryRows, type PendingTile } from "@/components/guest/gallery-rows";
import type { QueueProgress } from "@/lib/guest/use-upload-queue";
import type { ToastView } from "@/components/app/export/export-walk";

/**
 * THE GUEST ALBUM'S ROWS HOLD A LIVE ARRIVAL AT THE DOOR UNTIL IT CAN LAND COMPLETE (crumbs-23, build 26's
 * red-team: "A live pushed arrival still fades").
 *
 * The one grid (`MasonryColumns`) is a spy here: what is pinned is what the guest's wiring HANDS it, the
 * list it lays, the marks it writes and the slot it opens the album with (the stack for a pick in
 * flight, which the spy draws). Until this lane the wiring passed the album through untouched, so
 * an arrival was laid the moment the manifest brought it, before its link had been asked for, and its
 * photograph faded in a beat after the row had opened. The gate's own rules are `use-arrival-gate.test`'s.
 */
const { gridSpy } = vi.hoisted(() => ({ gridSpy: vi.fn() }));
// The product's toast, as a spy: what the stack's x asks and says is drawn through it (`stop-upload.ts`).
vi.mock("@/components/app/export/export-toast", () => ({
  exportToasts: { show: vi.fn(), dismiss: vi.fn() },
}));
vi.mock("@/components/shared/masonry", () => ({
  MasonryColumns: (props: { prefix?: ReactNode }) => {
    gridSpy(props);
    return <div data-testid="grid">{props.prefix}</div>;
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

/**
 * THE ALBUM'S HEAD: what a guest's own device puts there, and what it refuses to.
 *
 * FUNCTION ONLY. The stack's own drawing is `stack-tile.test.tsx`'s, and the grid under it is
 * `masonry.test.tsx`'s. What is held here is the SEAM: the files in flight go in, and exactly one stack
 * comes out.
 *
 * ★ EACH RULE BELOW STANDS AGAINST A FAILURE, WHICH IS WHY EACH IS WORTH A PIN: twelve files drawing twelve
 * tiles, and a stack whose bar sits at zero while another file's bytes are going. A held upload hands the
 * head nothing at all (a held photograph shows only in her uploads, the badge beside Add counting it): that
 * rule is `live-gallery.test.tsx`'s.
 */
const pending = (
  queueId: string,
  status: PendingTile["status"],
  progress = 0,
): PendingTile => ({
  queueId,
  url: `blob:${queueId}`,
  file: new File([new Uint8Array([1])], `${queueId}.jpg`, {
    type: "image/jpeg",
  }),
  kind: "photo",
  status,
  progress,
});

const stacks = () => document.querySelectorAll("[data-upload-stack]");

describe("GalleryRows: a pick in flight is ONE object at the album's head", () => {
  it("collapses a batch into a single stack that counts what is left", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[
          pending("1", "uploading", 30),
          pending("2", "queued"),
          pending("3", "queued"),
        ]}
      />,
    );
    expect(stacks()).toHaveLength(1);
    expect(screen.getByText("3 to go")).toBeInTheDocument();
  });

  it("leads with the file actually in the air, not the first of the batch", () => {
    // The queue runs one at a time, so the stack's photograph and its progress must be the one that is
    // moving: otherwise the bar sits at zero while bytes are visibly going somewhere.
    const { container } = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[
          pending("1", "queued"),
          pending("2", "uploading", 77),
          pending("3", "queued"),
        ]}
      />,
    );
    const bar = container.querySelector(
      "[data-pending-progress]",
    ) as HTMLElement;
    expect(bar.style.width).toBe("77%");
  });

  it("draws no stack when nothing is flying", () => {
    render(<GalleryRows {...REST} items={SEED} pending={[]} />);
    expect(stacks()).toHaveLength(0);
  });
});

/**
 * THE STACK'S x STOPS THE FILE IN THE AIR (upload-cancel, E6 for uploads). FUNCTION ONLY: the x is drawn only while the
 * lead file can still be stopped; it asks first on the product's toast (Keep going first); the stop it confirms is the
 * queue's, for the LEAD file's queue id alone (the stack stands for a pick, but a stop is one file's); a stopped file
 * is told as "Upload cancelled." with a Try again that sends it again; and a question about a file that left the stack
 * goes with it. The question's own flow is `stop-upload.test.ts`'s.
 */
describe("GalleryRows: the stack's x", () => {
  const show = vi.mocked(exportToasts.show);
  const dismiss = vi.mocked(exportToasts.dismiss);
  /** The progress store the queue hands the stack, with its stop; `at` is every file's progress. */
  const store = (stop?: QueueProgress["stop"], at = 0): QueueProgress => ({
    get: () => at,
    subscribe: () => () => {},
    stop,
  });
  const lastView = () => show.mock.calls.at(-1)![1] as ToastView;
  const xButton = () => screen.queryByRole("button", { name: "Stop upload" });

  beforeEach(() => {
    show.mockClear();
    dismiss.mockClear();
  });

  it("is drawn on a file going up, and not on a store that cannot stop (a reading only)", () => {
    const { rerender } = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x1", "uploading", 30)]}
        progress={store(async () => null, 30)}
      />,
    );
    expect(xButton()).not.toBeNull();
    rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x1", "uploading", 30)]}
        progress={store(undefined, 30)}
      />,
    );
    expect(xButton()).toBeNull();
  });

  it("★ is gone once the file's bytes are up (waiting to be recorded), but stays while R2 answers a full bar", () => {
    const { rerender } = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x2", "queued", 100)]}
        progress={store(async () => null, 100)}
      />,
    );
    expect(xButton()).toBeNull();
    rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x2", "uploading", 100)]}
        progress={store(async () => null, 100)}
      />,
    );
    expect(xButton()).not.toBeNull();
  });

  it("★ asks first, on the toast: Keep going first, and nothing is stopped by the press", () => {
    const stop = vi.fn(async () => null);
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x3", "uploading", 30), pending("x4", "queued")]}
        progress={store(stop, 30)}
      />,
    );
    fireEvent.click(xButton()!);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0]![0]).toBe("stop-upload-x3");
    const asked = lastView();
    expect(asked).toMatchObject({
      tone: "confirm",
      title: "Stop this upload?",
    });
    expect(
      (asked as Extract<ToastView, { tone: "confirm" }>).actions.map(
        (a) => a.label,
      ),
    ).toEqual(["Keep going", "Stop upload"]);
    expect(stop).not.toHaveBeenCalled();
  });

  it("★ Stop upload stops the LEAD file's queue id alone, and says it was cancelled with a Try again that sends it again", async () => {
    const tryAgain = vi.fn();
    const stop = vi.fn(async () => tryAgain);
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[
          pending("x5", "queued"),
          pending("x6", "uploading", 30),
          pending("x7", "queued"),
        ]}
        progress={store(stop, 30)}
      />,
    );
    fireEvent.click(xButton()!);
    (lastView() as Extract<ToastView, { tone: "confirm" }>).actions[1]!.run();
    await act(async () => {
      await Promise.resolve();
    });
    // The stack leads with the file in the air, so that is the one the stop is for: not the first of the pick.
    expect(stop).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledWith("x6");
    const told = lastView() as Extract<ToastView, { tone: "cancelled" }>;
    expect(told).toMatchObject({
      tone: "cancelled",
      title: "Upload cancelled.",
    });
    told.action!.run();
    expect(tryAgain).toHaveBeenCalledTimes(1);
  });

  it("a stop that came too late says nothing: the question goes and no cancel is told", async () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x8", "uploading", 30)]}
        progress={store(async () => null, 30)}
      />,
    );
    fireEvent.click(xButton()!);
    (lastView() as Extract<ToastView, { tone: "confirm" }>).actions[1]!.run();
    await act(async () => {
      await Promise.resolve();
    });
    expect(show.mock.calls.map(([, view]) => view.tone)).toEqual(["confirm"]);
    expect(dismiss).toHaveBeenCalledWith("stop-upload-x8");
  });

  it("★ a question about a file that left the stack is withdrawn with it", () => {
    const { rerender } = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x9", "uploading", 30)]}
        progress={store(async () => null, 30)}
      />,
    );
    fireEvent.click(xButton()!);
    expect(dismiss).not.toHaveBeenCalled();
    // The file landed and the next one leads: the question about the first has nothing left to ask.
    rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x10", "uploading", 5)]}
        progress={store(async () => null, 5)}
      />,
    );
    expect(dismiss).toHaveBeenCalledWith("stop-upload-x9");
  });
});
