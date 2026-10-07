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
vi.mock("@/components/shared/masonry", async () => {
  const { use } = await import("react");
  const { AlbumNewsContext } =
    await import("@/components/shared/album-window-news");
  return {
    // The spy also reads what the rows are told is news (album-order): the context the real rows read.
    MasonryColumns: (props: { prefix?: ReactNode }) => {
      gridSpy({ ...props, news: use(AlbumNewsContext) });
      return <div data-testid="grid">{props.prefix}</div>;
    },
  };
});

type GridProps = {
  items: GridMedia[];
  arrivedIds?: ReadonlySet<string>;
  rowAnchor?: "start" | "end";
  news?: { arrivals: readonly string[]; lens?: string } | null;
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

  // ★ RESHAPED (album-moments-wiring): this pinned her own landing's sweep handed through as it was handed
  // (`landedIds`). Guest-moments r1's `own=glow` retired the sweep: hers takes the arrival's one light, lit the
  // moment it stands and never held, so the scar kept is that both are written here, each when it lands.
  it("writes the arrival's glow when it is laid, and her own landing's the moment it stands", async () => {
    const view = render(
      <GalleryRows {...REST} items={SEED} arrivals={[]} own={[]} />,
    );
    expect(grid().arrivedIds?.size ?? 0).toBe(0);

    view.rerender(
      <GalleryRows
        {...REST}
        items={[photo("mine"), photo("c"), ...SEED]}
        arrivals={["c"]}
        own={["mine"]}
      />,
    );
    // Hers stands at once, glowing; the arrival is held, and nothing glows for it while it is not in the rows.
    expect(laid()).toEqual(["mine", "a", "b"]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(grid().arrivedIds?.has("mine")).toBe(true);
    expect(grid().arrivedIds?.has("c") ?? false).toBe(false);
    await act(async () => decodes[0].resolve());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(grid().arrivedIds?.has("c")).toBe(true);
    // The retired sweep's set is handed to nobody.
    expect("landedIds" in grid()).toBe(false);
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

  it("★ a question still standing when the x goes (its bytes are up, its complete is coming) goes with it, saying nothing", () => {
    const { rerender } = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x11", "uploading", 30)]}
        progress={store(async () => null, 30)}
      />,
    );
    fireEvent.click(xButton()!);
    expect(show.mock.calls.map(([, view]) => view.tone)).toEqual(["confirm"]);
    // Still going up, a render later: the question stands.
    rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x11", "uploading", 60)]}
        progress={store(async () => null, 60)}
      />,
    );
    expect(dismiss).not.toHaveBeenCalled();
    // Its last byte is up and nothing else goes: the same file leads, its x is gone, and so is the question.
    rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("x11", "queued", 100)]}
        progress={store(async () => null, 100)}
      />,
    );
    expect(xButton()).toBeNull();
    expect(dismiss).toHaveBeenCalledWith("stop-upload-x11");
    // Nothing was said in its place: no cancel, no "too late".
    expect(show.mock.calls.map(([, view]) => view.tone)).toEqual(["confirm"]);
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

/**
 * THE ALBUM'S ORDER AND ITS NEWS (album-order): the rows lay from the end the page's order grows at (the night in
 * order from its start, so an arrival lands at its end), and are told what arrived through her lens, so one landing
 * out of sight wears the rows' pill. Before this lane the rows were always laid newest first and told nothing.
 */
describe("GalleryRows: the album's order and its news", () => {
  it("★ lays from the end its order grows at, and tells the rows its arrivals through her lens", () => {
    render(
      <GalleryRows
        items={SEED}
        {...REST}
        arrivals={["x"]}
        anchor="start"
        lens="videos"
      />,
    );
    expect(grid().rowAnchor).toBe("start");
    expect(grid().news).toEqual({ arrivals: ["x"], lens: "videos" });
  });

  it("is newest first by default, and an album handed no arrivals has news of nothing, never no news", () => {
    render(<GalleryRows items={SEED} {...REST} />);
    expect(grid().rowAnchor).toBe("end");
    expect(grid().news).toEqual({ arrivals: [], lens: undefined });
  });
});

/**
 * WHAT SHE IS SENDING, WHERE SHE IS (red-team 56's MEDIUM): the stack keeps the slot her photograph lands in (the end of
 * an album in order), and while she cannot see it a stand-in carries its bar and its x in view. FUNCTION ONLY: the
 * observer is a stub that says in view or not; the pill's placement is `sending-stand-in.tsx`'s.
 */
describe("GalleryRows: the stack out of her sight stands in view", () => {
  let sight: ((inView: boolean) => void)[] = [];
  class FakeObserver {
    constructor(private cb: IntersectionObserverCallback) {
      sight.push((inView) =>
        this.cb(
          [
            {
              isIntersecting: inView,
              intersectionRatio: inView ? 1 : 0,
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver,
        ),
      );
    }
    observe() {}
    disconnect() {}
  }
  const standIn = () => document.querySelector("[data-sending-stand-in]");
  const store = (at: number): QueueProgress => ({
    get: () => at,
    subscribe: () => () => {},
    stop: async () => null,
  });

  beforeEach(() => {
    sight = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  it("★ stands in view with her bar and her x while the stack is out of sight, and goes when she sees it", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        anchor="start"
        pending={[pending("s1", "uploading", 40), pending("s2", "queued")]}
        progress={store(40)}
      />,
    );
    act(() => sight.at(-1)!(false));
    // A beat first: a lead handing over, or a row about to mount, never flashes the pill.
    expect(standIn()).toBeNull();
    act(() => vi.advanceTimersByTime(300));
    const pill = standIn() as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.textContent).toContain("2 to go");
    expect(
      (pill.querySelector("[data-stand-in-progress]") as HTMLElement).style
        .width,
    ).toBe("40%");
    expect(pill.querySelector("[data-stop-upload]")).not.toBeNull();
    // She scrolls the stack into view: the stand-in goes, the stack alone says it.
    act(() => sight.at(-1)!(true));
    expect(standIn()).toBeNull();
  });

  it("★ a stack the window never mounted is out of sight (the end of a long album in order)", () => {
    // The head slot is not drawn at all, so no observer ever speaks.
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        anchor="start"
        pending={[pending("s3", "uploading", 10)]}
        progress={store(10)}
      />,
    );
    sight = [];
    act(() => vi.advanceTimersByTime(300));
    expect(standIn()?.textContent).toContain("Sending");
  });

  it("★ a stack that keeps remounting out of sight faster than the beat (small files landing) still stands in", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        anchor="start"
        pending={[pending("r1", "uploading", 10), pending("r2", "queued")]}
        progress={store(10)}
      />,
    );
    // Out of sight, then reported out of sight again every 200 ms as the slot remounts.
    for (let i = 0; i < 4; i += 1) {
      act(() => sight.at(-1)!(false));
      act(() => vi.advanceTimersByTime(200));
    }
    expect(standIn()).not.toBeNull();
  });

  it("goes with the pick", () => {
    const view = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("s4", "uploading", 10)]}
        progress={store(10)}
      />,
    );
    act(() => sight.at(-1)!(false));
    act(() => vi.advanceTimersByTime(300));
    expect(standIn()).not.toBeNull();
    view.rerender(
      <GalleryRows {...REST} items={SEED} pending={[]} progress={store(0)} />,
    );
    expect(standIn()).toBeNull();
  });
});

/**
 * ★ A SEND THAT WAITS FOR THE LINE STANDS BY WHERE IT IS (no-signal r1, Will's `drop=standby`): the stack and its stand-in
 * read the wait off the progress store they already read (`QueueProgress.waits`), say "No connection" with the promise
 * in the bar's place, keep the x, open nothing by themselves, and a press on either opens the whole send.
 */
describe("GalleryRows: a send standing by for the line", () => {
  let sight: ((inView: boolean) => void)[] = [];
  class FakeObserver {
    constructor(private cb: IntersectionObserverCallback) {
      sight.push((inView) =>
        this.cb(
          [
            {
              isIntersecting: inView,
              intersectionRatio: inView ? 1 : 0,
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver,
        ),
      );
    }
    observe() {}
    disconnect() {}
  }
  /** A store where these files wait for the line, each kept on her phone or not. */
  const waitingStore = (
    holds: Record<string, "kept" | "page">,
  ): QueueProgress => ({
    get: () => 0,
    subscribe: () => () => {},
    stop: async () => null,
    waits: (id) => holds[id] ?? null,
  });

  beforeEach(() => {
    sight = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  it("★ the stack says the state and her phone's promise where the bar was, and keeps its x", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "queued"), pending("w2", "queued")]}
        progress={waitingStore({ w1: "kept", w2: "kept" })}
      />,
    );
    const pane = document.querySelector("[data-stack-standby]") as HTMLElement;
    expect(pane).toHaveTextContent("No connection");
    expect(pane).toHaveTextContent("Kept on this phone");
    expect(document.querySelector("[data-pending-progress]")).toBeNull();
    expect(document.querySelector("[data-stop-upload]")).not.toBeNull();
    // Nothing opened by itself.
    expect(document.querySelector("[data-waiting-sheet]")).toBeNull();
  });

  it("★ says to keep the page open where her phone could not hold the file", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "queued")]}
        progress={waitingStore({ w1: "page" })}
      />,
    );
    expect(
      (document.querySelector("[data-stack-standby]") as HTMLElement)
        .textContent,
    ).toContain("Keep this page open");
  });

  it("★ the stand-in says it too, with no bar and its x, when the stack is out of her sight", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        anchor="start"
        pending={[pending("w1", "queued"), pending("w2", "queued")]}
        progress={waitingStore({ w1: "kept", w2: "kept" })}
      />,
    );
    act(() => sight.at(-1)!(false));
    act(() => vi.advanceTimersByTime(300));
    const pill = document.querySelector(
      "[data-sending-stand-in]",
    ) as HTMLElement;
    expect(pill).toHaveTextContent("No connection");
    expect(pill.textContent).not.toContain("to go");
    expect(pill.querySelector("[data-stand-in-progress]")).toBeNull();
    expect(pill.querySelector("[data-stop-upload]")).not.toBeNull();
  });

  it("★ a press on the stack opens the whole send under its promise, each photograph and where it stands", () => {
    render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[
          pending("w1", "queued"),
          pending("w2", "queued"),
          pending("w3", "queued"),
        ]}
        progress={waitingStore({ w1: "kept", w2: "kept", w3: "kept" })}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "See what waits for your connection",
      }),
    );
    const sheet = document.querySelector("[data-waiting-sheet]") as HTMLElement;
    expect(sheet).not.toBeNull();
    expect(sheet).toHaveTextContent("Waiting for your connection");
    expect(sheet).toHaveTextContent(
      "Your 3 photos are kept on this phone and go by themselves once your connection is back.",
    );
    expect(sheet.querySelectorAll('[data-waiting-row="waiting"]')).toHaveLength(
      3,
    );
    expect(sheet).toHaveTextContent("w2.jpg");
  });

  it("★ the list closes once nothing waits (the line is back), and a later wait never opens it by itself", () => {
    const view = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "queued")]}
        progress={waitingStore({ w1: "kept" })}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "See what waits for your connection",
      }),
    );
    expect(document.querySelector("[data-waiting-sheet]")).not.toBeNull();
    // The line is back: the file goes again, and the list that said it waits closes.
    view.rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "uploading", 10)]}
        progress={waitingStore({})}
      />,
    );
    act(() => vi.advanceTimersByTime(400));
    expect(document.querySelector("[data-waiting-sheet]")).toBeNull();
    // It drops again: the stack stands by, and nothing opens.
    view.rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "queued")]}
        progress={waitingStore({ w1: "kept" })}
      />,
    );
    act(() => vi.advanceTimersByTime(400));
    expect(document.querySelector("[data-stack-standby]")).not.toBeNull();
    expect(document.querySelector("[data-waiting-sheet]")).toBeNull();
  });

  it("goes back to its bar the moment the file goes again", () => {
    const view = render(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "queued")]}
        progress={waitingStore({ w1: "kept" })}
      />,
    );
    expect(document.querySelector("[data-stack-standby]")).not.toBeNull();
    view.rerender(
      <GalleryRows
        {...REST}
        items={SEED}
        pending={[pending("w1", "uploading", 10)]}
        progress={waitingStore({})}
      />,
    );
    expect(document.querySelector("[data-stack-standby]")).toBeNull();
    expect(document.querySelector("[data-pending-progress]")).not.toBeNull();
  });
});
