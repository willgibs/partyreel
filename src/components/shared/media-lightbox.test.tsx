/**
 * BEHAVIOR PINS for MediaLightbox (program Phase 2, slice 1). Freezes the
 * gesture physics + chrome contracts before Phase 4 splits the file: touch
 * gating, the 10px axis lock, edge damping + neighbor clamping, the
 * velocity/distance commit thresholds, settle durations + the reduced-motion
 * instant path, keyboard nav, drag-click suppression, and the video
 * scrubber-strip swipe exception. Pins read transforms/attributes/callbacks -
 * never theme styles.
 *
 * Geometry comes from the global getBoundingClientRect mock (800x600, bottom
 * 600). Velocity needs CONTROLLED timestamps, so gestures are dispatched as
 * hand-built PointerEvents with a defineProperty'd timeStamp.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { TooltipProvider } from "@/components/ui/tooltip";

import { setReducedMotion } from "../../../vitest.setup";
import { MediaLightbox } from "./media-lightbox";

const PHOTOS: GridMedia[] = [
  { id: "p1", type: "photo", url: "https://r2.test/p1.jpg", downloadUrl: "https://r2.test/d1.jpg" },
  { id: "p2", type: "photo", url: "https://r2.test/p2.jpg", downloadUrl: "https://r2.test/d2.jpg" },
  { id: "p3", type: "photo", url: "https://r2.test/p3.jpg", downloadUrl: "https://r2.test/d3.jpg" },
];

const WITH_VIDEO: GridMedia[] = [
  PHOTOS[0],
  { id: "v1", type: "video", url: "https://r2.test/v1.mp4", downloadUrl: "https://r2.test/dv1.mp4" },
  PHOTOS[2],
];

function track(): HTMLElement {
  const el = document.querySelector("[data-lightbox-track]");
  if (!el) throw new Error("track not mounted");
  return el as HTMLElement;
}

/* timeStamp is read-only and jsdom ignores per-instance defineProperty, so the
   prototype getter is patched once with a WeakMap override - only events this
   file registers get a synthetic clock; everything else falls through. */
const tsOverride = new WeakMap<Event, number>();
const nativeTs = Object.getOwnPropertyDescriptor(Event.prototype, "timeStamp")!;
Object.defineProperty(Event.prototype, "timeStamp", {
  configurable: true,
  get(this: Event) {
    return tsOverride.has(this)
      ? tsOverride.get(this)!
      : (nativeTs.get!.call(this) as number);
  },
});

/** Dispatch a PointerEvent with a controllable timeStamp (velocity math).
 *  React's synthetic timeStamp falls back to Date.now() on FALSY values, so
 *  all synthetic clocks ride a constant base - only deltas matter. */
const T_BASE = 1_000_000;

function firePointer(
  el: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  opts: { x: number; y?: number; t: number; id?: number; pointerType?: string },
) {
  const ev = new window.PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: opts.id ?? 1,
    pointerType: opts.pointerType ?? "touch",
    clientX: opts.x,
    clientY: opts.y ?? 300,
  } as PointerEventInit);
  tsOverride.set(ev, T_BASE + opts.t);
  act(() => {
    el.dispatchEvent(ev);
  });
}

/** down -> one axis-locking move -> further moves; returns the lock x. */
function startDrag(el: Element, startX: number, t0: number) {
  firePointer(el, "pointerdown", { x: startX, t: t0 });
  // 15px horizontal clears DIR_LOCK_PX (10) and |dx| > |dy|.
  firePointer(el, "pointermove", { x: startX + 15, t: t0 + 16 });
}

function mount(
  items: GridMedia[] = PHOTOS,
  index = 1,
  extra?: Partial<Parameters<typeof MediaLightbox>[0]>,
) {
  const onClose = vi.fn();
  const onIndexChange = vi.fn();
  const utils = render(
    // The pill actions carry styled tooltips (lightbox-only), which need a provider —
    // the app supplies one at the root (providers.tsx); the test supplies its own.
    <TooltipProvider>
      <MediaLightbox
        items={items}
        index={index}
        onClose={onClose}
        onIndexChange={onIndexChange}
        {...extra}
      />
    </TooltipProvider>,
  );
  return { ...utils, onClose, onIndexChange };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MediaLightbox: gesture gating", () => {
  it("renders centered: the track sits at -100% with zero offset", () => {
    mount();
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("mouse pointers never engage the finger-follow", () => {
    mount();
    firePointer(track(), "pointerdown", { x: 400, t: 0, pointerType: "mouse" });
    firePointer(track(), "pointermove", { x: 300, t: 50, pointerType: "mouse" });
    expect(track().dataset.dragging).toBeUndefined();
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("a sub-10px wiggle stays unlocked (tap territory)", () => {
    mount();
    firePointer(track(), "pointerdown", { x: 400, t: 0 });
    firePointer(track(), "pointermove", { x: 405, y: 303, t: 20 });
    expect(track().dataset.dragging).toBeUndefined();
  });

  it("a vertical move releases the gesture to the browser", () => {
    mount();
    firePointer(track(), "pointerdown", { x: 400, t: 0 });
    firePointer(track(), "pointermove", { x: 403, y: 340, t: 20 });
    expect(track().dataset.dragging).toBeUndefined();
    // And a later horizontal move does nothing - the gesture is gone.
    firePointer(track(), "pointermove", { x: 500, t: 40 });
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("a horizontal lock engages: data-dragging + 1:1 follow", () => {
    mount();
    startDrag(track(), 400, 0);
    expect(track().dataset.dragging).toBe("true");
    firePointer(track(), "pointermove", { x: 300, t: 40 });
    // dx = -100 within clamp -> offset -100.
    expect(track().style.transform).toBe("translateX(calc(-100% + -100px))");
  });
});

describe("MediaLightbox: friction at the edges", () => {
  it("clamps a long pull toward a real neighbor to one slide width", () => {
    mount();
    startDrag(track(), 700, 0);
    firePointer(track(), "pointermove", { x: -300, t: 40 }); // dx -1000
    expect(track().style.transform).toBe("translateX(calc(-100% + -800px))");
  });

  it("damps the pull past the FIRST item (no prev)", () => {
    mount(PHOTOS, 0);
    startDrag(track(), 100, 0);
    firePointer(track(), "pointermove", { x: 300, t: 40 }); // raw dx +200
    // damp(200, 800): maxPull 144 -> ~83.72px, far short of the raw 200.
    const m = track().style.transform.match(/\+ ([\d.]+)px/);
    expect(m).not.toBeNull();
    expect(parseFloat(m![1])).toBeCloseTo(83.72, 1);
  });
});

describe("MediaLightbox: release outcomes", () => {
  it("slow short drag springs back (200ms settle, no index change)", () => {
    const { onIndexChange } = mount();
    startDrag(track(), 400, 0);
    firePointer(track(), "pointermove", { x: 320, t: 200 });
    firePointer(track(), "pointerup", { x: 320, t: 400 }); // dx -80 (10%), v 0.2
    expect(track().style.getPropertyValue("--lightbox-settle")).toBe("200ms");
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("a long slow drag commits by DISTANCE (20% of width)", () => {
    const { onIndexChange } = mount();
    startDrag(track(), 500, 0);
    firePointer(track(), "pointermove", { x: 300, t: 1000 });
    firePointer(track(), "pointerup", { x: 300, t: 2000 }); // dx -200 (25%), v 0.1
    expect(track().style.getPropertyValue("--lightbox-settle")).toBe("240ms");
    expect(track().style.transform).toBe("translateX(calc(-100% + -800px))");
    expect(onIndexChange).not.toHaveBeenCalled(); // not before the settle lands
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
    // The new window recenters with the transition suppressed.
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("a quick flick commits by VELOCITY regardless of distance", () => {
    const { onIndexChange } = mount();
    startDrag(track(), 400, 0);
    firePointer(track(), "pointermove", { x: 340, t: 50 });
    firePointer(track(), "pointerup", { x: 340, t: 100 }); // dx -60 (7.5%), v 0.6
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("a commit toward a missing neighbor cannot happen at the END of the set", () => {
    const { onIndexChange } = mount(PHOTOS, 2); // last item: no next
    startDrag(track(), 500, 0);
    firePointer(track(), "pointermove", { x: 200, t: 50 });
    firePointer(track(), "pointerup", { x: 200, t: 100 }); // fast + far, but hasNext=false
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("pointercancel snaps back to center", () => {
    const { onIndexChange } = mount();
    startDrag(track(), 400, 0);
    firePointer(track(), "pointermove", { x: 300, t: 40 });
    firePointer(track(), "pointercancel", { x: 300, t: 60 });
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("reduced motion: a commit lands INSTANTLY, no transition round-trip", () => {
    setReducedMotion(true);
    const { onIndexChange } = mount();
    startDrag(track(), 500, 0);
    firePointer(track(), "pointermove", { x: 300, t: 1000 });
    firePointer(track(), "pointerup", { x: 300, t: 2000 });
    // No transitionEnd needed - the swap already happened.
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });
});

describe("MediaLightbox: chrome contracts", () => {
  it("arrow keys step through the set within bounds", () => {
    const { onIndexChange } = mount();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledWith(0);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("arrow keys at the edges do nothing", () => {
    const { onIndexChange } = mount(PHOTOS, 0);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("a CENTER tap on the letterbox closes; the click trailing a drag does NOT", () => {
    const { onClose } = mount();
    const centerSlot = track().children[1] as HTMLElement;

    // Drag first: the trailing click (even in the center third) is swallowed.
    startDrag(track(), 400, 0);
    firePointer(track(), "pointermove", { x: 320, t: 200 });
    firePointer(track(), "pointerup", { x: 320, t: 400 });
    fireEvent.click(centerSlot, { clientX: 400 });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a clean CENTER-third tap on the letterbox closes the viewer", () => {
    // Phase 4: side thirds NAVIGATE, only the center third closes (geometry
    // from the 800px-wide getBoundingClientRect mock → 400 is dead center).
    const { onClose, onIndexChange } = mount();
    const centerSlot = track().children[1] as HTMLElement;
    fireEvent.click(centerSlot, { clientX: 400 });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("a LEFT-third letterbox tap steps to the previous item (no close)", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 1);
    const centerSlot = track().children[1] as HTMLElement;
    fireEvent.click(centerSlot, { clientX: 80 }); // 0.1 → left third
    expect(onIndexChange).toHaveBeenCalledWith(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a RIGHT-third letterbox tap steps to the next item (no close)", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 1);
    const centerSlot = track().children[1] as HTMLElement;
    fireEvent.click(centerSlot, { clientX: 720 }); // 0.9 → right third
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a side tap at an edge is a NO-OP (never an accidental close)", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 0); // no prev
    const centerSlot = track().children[1] as HTMLElement;
    fireEvent.click(centerSlot, { clientX: 80 }); // left third, but at item 0
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the position counter reflects the controlled index (pill format)", () => {
    mount(PHOTOS, 1);
    expect(screen.getByText(/2 of 3/)).toBeInTheDocument();
  });
});

describe("MediaLightbox: video behavior", () => {
  it("a drag starting in a PLAYING video's scrubber strip never swipes", () => {
    const { onIndexChange } = mount(WITH_VIDEO, 1);
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    fireEvent.play(video); // isPlayingRef -> true

    // bottom 600, strip = 64px -> y 580 is inside the reserved band.
    firePointer(track(), "pointerdown", { x: 500, y: 580, t: 0 });
    firePointer(track(), "pointermove", { x: 300, y: 580, t: 50 });
    expect(track().dataset.dragging).toBeUndefined();
    firePointer(track(), "pointerup", { x: 300, y: 580, t: 100 });
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("the same drag swipes once the video is PAUSED", () => {
    const { onIndexChange } = mount(WITH_VIDEO, 1);
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    fireEvent.play(video);
    fireEvent.pause(video);

    firePointer(track(), "pointerdown", { x: 500, y: 580, t: 0 });
    firePointer(track(), "pointermove", { x: 300, y: 580, t: 50 });
    expect(track().dataset.dragging).toBe("true");
    firePointer(track(), "pointerup", { x: 300, y: 580, t: 100 });
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  // NOT PINNED HERE: "navigating away pauses the center video". The [index]
  // effect's captured ref resolves null under jsdom's portal/commit timing
  // (probed 2026-06-11), so the pin would test the harness, not the browser.
  // Covered by the live device pass instead (play a video, swipe past it,
  // confirm audio stops) - see the Phase 2 verification checklist.
});

// 3c.2: the host curate group is gated by viewerIsHost && onSetStatus, so the
// GUEST pill is unaffected (the shared lightbox is behavior-pinned). The buttons
// read current.status; approve/hide/unhide are reversible (direct), remove is
// behind a modal confirm.
describe("MediaLightbox: host curate actions (3c.2)", () => {
  const hostItem = (status: GridMedia["status"]): GridMedia[] => [
    {
      id: "h1",
      type: "photo",
      url: "https://r2.test/h1.jpg",
      downloadUrl: "https://r2.test/dh1.jpg",
      status,
    },
  ];

  it("the GUEST pill carries NO curate controls, even with a status", () => {
    mount(hostItem("approved"), 0, { shareUrl: "https://pr.test/e/tok" });
    expect(screen.queryByLabelText("Hide")).toBeNull();
    expect(screen.queryByLabelText("Show")).toBeNull();
    expect(screen.queryByLabelText("Approve")).toBeNull();
    expect(screen.queryByLabelText("Remove")).toBeNull();
    // The guest still gets Share (the join url).
    expect(screen.getByLabelText("Share")).toBeInTheDocument();
  });

  it("an APPROVED host item shows Hide + Remove (not Approve/Show)", () => {
    const onSetStatus = vi.fn();
    const items = hostItem("approved");
    mount(items, 0, { viewerIsHost: true, onSetStatus, onRemove: vi.fn() });
    expect(screen.queryByLabelText("Approve")).toBeNull();
    expect(screen.queryByLabelText("Show")).toBeNull();
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Hide"));
    expect(onSetStatus).toHaveBeenCalledWith(items[0], "hidden");
  });

  it("a PENDING host item shows Approve + Hide; Approve sets approved", () => {
    const onSetStatus = vi.fn();
    const items = hostItem("pending");
    mount(items, 0, { viewerIsHost: true, onSetStatus, onRemove: vi.fn() });
    expect(screen.getByLabelText("Hide")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Approve"));
    expect(onSetStatus).toHaveBeenCalledWith(items[0], "approved");
  });

  it("a HIDDEN host item shows Show (not Hide/Approve); Show sets approved", () => {
    const onSetStatus = vi.fn();
    const items = hostItem("hidden");
    mount(items, 0, { viewerIsHost: true, onSetStatus, onRemove: vi.fn() });
    expect(screen.queryByLabelText("Hide")).toBeNull();
    expect(screen.queryByLabelText("Approve")).toBeNull();
    fireEvent.click(screen.getByLabelText("Show"));
    expect(onSetStatus).toHaveBeenCalledWith(items[0], "approved");
  });

  it("host Remove is behind a modal confirm (no accidental delete)", () => {
    const onRemove = vi.fn();
    const items = hostItem("approved");
    mount(items, 0, {
      viewerIsHost: true,
      onSetStatus: vi.fn(),
      onRemove,
    });
    // The pill button only OPENS the confirm.
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByText("Remove this item?")).toBeInTheDocument();
    // Confirming inside the dialog fires it with the current item.
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    expect(onRemove).toHaveBeenCalledWith(items[0]);
  });
});
