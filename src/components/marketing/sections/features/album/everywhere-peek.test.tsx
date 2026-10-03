import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReducedMotion } from "../../../../../../vitest.setup";

import {
  EVERYWHERE_FIXTURES,
  EVERYWHERE_SEED_COUNT,
} from "./album-fill-fixtures";
import { AlbumFillGrid, type PeekRequest } from "./album-fill-grid";
import { EverywherePeek } from "./everywhere-peek";
import { EverywhereStage } from "./everywhere-stage";
import { deriveAlbumFill } from "./use-album-fill";

// jsdom has no IntersectionObserver, so the stage would sit paused for want of
// an observer: the stage's own pause (the lightbox) is what its test is about.
vi.mock("@/lib/shared/use-ambient-pause", () => ({
  useAmbientPause: () => ({ ref: () => {}, paused: false }),
}));

/**
 * THE EVERYWHERE STAGE'S EASTER EGG (`loose-ends` r1, `everywhere-pill=corner`
 * with his note: "a fun little lightbox preview ... it should clearly feel like
 * a fun easter egg demo, not trap visitors in a demo they didn't ask for").
 * What fails here fails quietly on the page: a tile that opens nothing, a mark
 * on the wrong tile, a lightbox with no way out but one, or one that asks a
 * visitor for something back.
 */

const REQUEST: PeekRequest = {
  id: "wedding-rings",
  by: "Jay",
  from: {
    left: 100,
    top: 50,
    width: 200,
    height: 150,
    right: 300,
    bottom: 200,
    x: 100,
    y: 50,
    toJSON: () => ({}),
  } as DOMRect,
  poster: null,
};

/** jsdom implements no Web Animations: give the card an `animate` for a test. */
function stubAnimate(animate: (...args: unknown[]) => unknown) {
  Object.defineProperty(HTMLElement.prototype, "animate", {
    value: animate,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setReducedMotion(false);
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  // Radix leaves the page's scroll lock and hidden siblings behind a test that
  // closes nothing; the setup's cleanup unmounts them, this clears the body.
  document.body.removeAttribute("style");
});

function lightbox(open = true, onOpenChange = vi.fn()) {
  render(
    <EverywherePeek peek={REQUEST} open={open} onOpenChange={onOpenChange} />,
  );
  return onOpenChange;
}

describe("the lightbox", () => {
  it("draws nothing until a tile has been pressed", () => {
    render(<EverywherePeek peek={null} open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a dialog about that photograph and says outright that it is a demo", () => {
    lightbox();
    const dialog = screen.getByRole("dialog", {
      name: "A demo photo added by Jay",
    });
    expect(dialog).toHaveAccessibleDescription(
      "Just a demo. Tap anywhere to close.",
    );
    // The photograph carries the marketing manifest's own honest description.
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "alt",
      "Hands with wedding rings over a peach bouquet",
    );
  });

  it("asks nothing of the visitor: one control, and it only closes", () => {
    lightbox();
    const dialog = screen.getByRole("dialog");
    // No link out, no sign-up, no like, no download: it is not a way into the
    // product, and a visitor who tapped a tile out of curiosity owes it nothing.
    expect(within(dialog).queryAllByRole("link")).toHaveLength(0);
    const controls = within(dialog).getAllByRole("button");
    expect(controls).toHaveLength(1);
    expect(controls[0]).toHaveAccessibleName("Close the demo photo");
  });

  it("closes on one tap of the photograph, of the ground, and on Escape", async () => {
    const onOpenChange = lightbox();
    // Radix arms its outside-press listener a tick after it opens, so the tap
    // that opened a layer cannot close it.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Close the demo photo" }),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    // The ground is the other direct child of the portal beside the dialog.
    const ground = [...document.body.children].find(
      (el) =>
        el.getAttribute("data-state") === "open" &&
        el.getAttribute("role") !== "dialog",
    )!;
    fireEvent.pointerDown(ground, { pointerType: "mouse" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("goes when `open` turns false while `peek` stays held, so its exit still has a photograph to draw", () => {
    const { rerender } = render(
      <EverywherePeek peek={REQUEST} open onOpenChange={vi.fn()} />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    rerender(
      <EverywherePeek peek={REQUEST} open={false} onOpenChange={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("the card grows out of the tile that was pressed", () => {
  it("starts at the tile's box and returns to its own, then lets go of the animation with the card", () => {
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    stubAnimate(animate);
    // The setup's getBoundingClientRect answers 800x600 at the origin for every
    // node, so the card's own box is that and the tile's is REQUEST.from's.
    const { unmount } = render(
      <EverywherePeek peek={REQUEST} open onOpenChange={vi.fn()} />,
    );
    expect(animate).toHaveBeenCalledTimes(1);
    const [keyframes] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ];
    // (100 + 200/2) - 800/2 = -200 across, (50 + 150/2) - 600/2 = -175 down,
    // and a 200px tile is a quarter of an 800px card.
    expect(keyframes[0].transform).toBe(
      "translate(-200px, -175px) scale(0.25)",
    );
    expect(keyframes[1].transform).toBe("none");
    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("does not travel for a reader who asked for reduced motion", () => {
    setReducedMotion(true);
    const animate = vi.fn();
    stubAnimate(animate);
    lightbox();
    expect(animate).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("the stage's tiles", () => {
  const opts = {
    fixtures: EVERYWHERE_FIXTURES,
    seedCount: EVERYWHERE_SEED_COUNT,
    loop: true,
    upload: false,
    maxPerColumn: 4,
  } as const;
  const tiles = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>("[data-mkt-fly]")].filter((el) =>
      el.querySelector("img"),
    );
  const marked = (root: HTMLElement) =>
    [...root.querySelectorAll<HTMLElement>('span[data-on="true"]')].filter(
      (el) => el.querySelector("svg.lucide-maximize2"),
    );

  function grid(peek?: (r: PeekRequest) => void, tick = 6) {
    const view = deriveAlbumFill(tick, opts);
    const { container } = render(
      <AlbumFillGrid
        view={view}
        cols={3}
        frameHeight={236}
        sizes="140px"
        reduced
        peek={peek}
      />,
    );
    return { view, container };
  }

  it("open on a press, handing over the tile's photograph, its uploader and its box", () => {
    const peek = vi.fn();
    const { container } = grid(peek);
    const first = tiles(container)[0];
    fireEvent.click(first);
    expect(peek).toHaveBeenCalledTimes(1);
    const request = peek.mock.calls[0][0] as PeekRequest;
    expect(EVERYWHERE_FIXTURES.map((f) => f.id)).toContain(request.id);
    expect(typeof request.by).toBe("string");
    expect(request.from.width).toBeGreaterThan(0);
  });

  it("wear one quiet mark, on the newest tile, and hand over that tile's photograph when it is pressed", () => {
    const peek = vi.fn();
    const { view, container } = grid(peek);
    const marks = marked(container);
    expect(marks).toHaveLength(1);
    fireEvent.click(marks[0].parentElement!);
    const newest = view.columns.flat().find((t) => t.key === view.newest)!;
    expect((peek.mock.calls[0][0] as PeekRequest).id).toBe(newest.fixture.id);
    // The mark is drawn, never announced or focusable: the stage is aria-hidden.
    expect(marks[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("carry the mark from the first frame: the resting album's newest wears it before anything lands", () => {
    const { container } = grid(vi.fn(), 0);
    expect(marked(container)).toHaveLength(1);
  });

  it("stay plain without `peek`: no mark, and a press does nothing", () => {
    const { container } = grid(undefined);
    expect(container.querySelector("svg.lucide-maximize2")).toBeNull();
    expect(() => fireEvent.click(tiles(container)[0])).not.toThrow();
  });
});

describe("the stage that holds them", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** What is on screen: every tile's photograph, on both screens. */
  const onScreen = (root: HTMLElement) =>
    [...root.querySelectorAll("[data-mkt-fly] img")]
      .map((img) => img.getAttribute("src"))
      .join("|");
  /** One beat at a time: each tick's timer is scheduled by the render before it. */
  const ticks = (n: number) => {
    for (let i = 0; i < n; i++) {
      act(() => {
        vi.advanceTimersByTime(800);
      });
    }
  };

  it("holds its loop still while the lightbox is up and lets it carry on when it closes", () => {
    const { container } = render(<EverywhereStage />);
    const start = onScreen(container);
    ticks(6);
    expect(onScreen(container), "the loop runs").not.toBe(start);

    fireEvent.click(container.querySelector("[data-mkt-fly]")!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const held = onScreen(container);
    // The album is where the visitor left it, however long they look.
    ticks(12);
    expect(onScreen(container), "and holds").toBe(held);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    ticks(6);
    expect(onScreen(container), "then carries on").not.toBe(held);
  });

  it("stays aria-hidden decoration: the tiles are pressed, never tabbed to", () => {
    const { container } = render(<EverywhereStage />);
    const stage = container.firstElementChild as HTMLElement;
    expect(stage).toHaveAttribute("aria-hidden", "true");
    expect(stage.querySelectorAll("[data-mkt-fly]").length).toBeGreaterThan(4);
    // A focusable inside an aria-hidden region is worse than none.
    const tabStops = [...stage.querySelectorAll<HTMLElement>("*")].filter(
      (el) => el.tabIndex >= 0,
    );
    expect(tabStops).toHaveLength(0);
  });
});
