// @contract-for: src/components/shared/unverified-mark.tsx
// @contract-for: src/components/shared/media-lightbox.tsx
/**
 * BEHAVIOR PINS for MediaLightbox (program Phase 2, slice 1; reshaped by
 * media-viewer r1, 2026-09-24). Freezes the gesture physics + chrome contracts:
 * touch gating, the 10px axis lock, edge damping + neighbor clamping, the
 * velocity/distance commit thresholds, settle durations + the reduced-motion
 * instant path, keyboard nav, drag-click suppression. Pins read
 * transforms/attributes/callbacks - never theme styles.
 *
 * ★ WHAT r1 CHANGED, DELIBERATELY, AND WHY (Will's rulings, each pin below says
 * which): a tap on blank space CLOSES wherever it lands (`wayout=down`, "clicking
 * on any blank space around the media should close"), so the 30% side zones that
 * stepped through the album went and a tap on a PEEKING NEIGHBOUR steps instead
 * (`next=peek`); a vertical move is the way out, no longer the browser's; the
 * "i of N" counter went (the neighbours say there is more); the browser's video
 * bar went, and with it the strip a playing clip reserved from the swipe (the
 * scrubber is its own control now).
 *
 * Geometry comes from the global getBoundingClientRect mock (800x600, bottom
 * 600). Velocity needs CONTROLLED timestamps, so gestures are dispatched as
 * hand-built PointerEvents with a defineProperty'd timeStamp.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
// The mark's one label constant, read rather than retyped (Will, 2026-09-22
// re-ruled its word): the pill, the guest list and the menu move together, and
// a regex copy of the old string here would have been the one thing that did not.
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DeleteConsequence } from "@/lib/guest/delete-consequence";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";

import { setReducedMotion } from "../../../vitest.setup";
import { MediaLightbox, type ViewerMedia } from "./media-lightbox";

const PHOTOS: GridMedia[] = [
  {
    id: "p1",
    type: "photo",
    url: "https://r2.test/p1.jpg",
    downloadUrl: "https://r2.test/d1.jpg",
  },
  {
    id: "p2",
    type: "photo",
    url: "https://r2.test/p2.jpg",
    downloadUrl: "https://r2.test/d2.jpg",
  },
  {
    id: "p3",
    type: "photo",
    url: "https://r2.test/p3.jpg",
    downloadUrl: "https://r2.test/d3.jpg",
  },
];

const WITH_VIDEO: GridMedia[] = [
  PHOTOS[0],
  {
    id: "v1",
    type: "video",
    url: "https://r2.test/v1.mp4",
    downloadUrl: "https://r2.test/dv1.mp4",
  },
  PHOTOS[2],
];

function track(): HTMLElement {
  const el = document.querySelector("[data-lightbox-track]");
  if (!el) throw new Error("track not mounted");
  return el as HTMLElement;
}

function content(): HTMLElement {
  return document.querySelector("[data-lightbox-content]") as HTMLElement;
}

/** The centre photograph's zoom layer (the close-up and the pull down write here). */
function centerZoom(): HTMLElement {
  return document.querySelector(
    "[data-lightbox-slot][data-current] [data-lightbox-zoom]",
  ) as HTMLElement;
}

/** Each slot's media box, in track order: [prev, current, next]. */
function mediaOf(): HTMLElement[] {
  return [...track().children].map(
    (slot) => slot.querySelector("[data-lightbox-media]") as HTMLElement,
  );
}

/* jsdom implements no media playback: the clip's play and pause are spies, so
   a pin reads what the viewer asked of the element. */
const media = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
};
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: media.play,
});
Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: media.pause,
});

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
    firePointer(track(), "pointermove", {
      x: 300,
      t: 50,
      pointerType: "mouse",
    });
    expect(track().dataset.dragging).toBeUndefined();
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("a sub-10px wiggle stays unlocked (tap territory)", () => {
    mount();
    firePointer(track(), "pointerdown", { x: 400, t: 0 });
    firePointer(track(), "pointermove", { x: 405, y: 303, t: 20 });
    expect(track().dataset.dragging).toBeUndefined();
  });

  // r1 (`wayout=down`): a vertical move used to be released to the browser; it
  // is the way out now. The track still never moves on a vertical lock.
  it("a vertical move locks to the way out, and the track never moves", () => {
    mount();
    firePointer(track(), "pointerdown", { x: 400, t: 0 });
    firePointer(track(), "pointermove", { x: 403, y: 340, t: 20 });
    expect(track().dataset.dragging).toBeUndefined();
    expect(content().hasAttribute("data-dismissing")).toBe(true);
    expect(centerZoom().style.transform).toMatch(/translate3d\(0, 40px, 0\)/);
    // And a later horizontal move never reaches the track: the gesture is locked.
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

  // r1 (`wayout=down`, Will: "clicking on any blank space around the media
  // should close... Feels weird when I tap the empty space expecting a close").
  // This pin used to close on the CENTER third only.
  it("a tap on blank space closes the viewer, wherever it lands", () => {
    for (const clientX of [80, 400, 720]) {
      const { onClose, onIndexChange, unmount } = mount(PHOTOS, 1);
      const centerSlot = track().children[1] as HTMLElement;
      fireEvent.click(centerSlot, { clientX });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onIndexChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  // r1: the LEFT- and RIGHT-third taps used to step to the neighbours, and a
  // side tap at an edge was a no-op. The side zones went: blank is blank.
  it("blank space beside the first photograph closes too: there is no side zone", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 0);
    const centerSlot = track().children[1] as HTMLElement;
    fireEvent.click(centerSlot, { clientX: 80 });
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // r1 (`next=peek`): the sliver of a neighbour is the tap target now, and it
  // slides there the way a swipe would (the settle, then the swap).
  it("a tap on a peeking neighbour steps to it, and never closes", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 1);
    const [prev, , next] = mediaOf();
    fireEvent.click(next);
    expect(track().style.getPropertyValue("--lightbox-settle")).toBe("240ms");
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(prev);
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("a tap on the photograph itself neither closes nor steps", () => {
    const { onClose, onIndexChange } = mount(PHOTOS, 1);
    fireEvent.click(mediaOf()[1]);
    expect(onClose).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  // ◇ r1: the "i of N" counter went (the neighbours say there is more). The
  // position survives as the dialog's accessible name, for a screen reader.
  it("draws no counter; the dialog's name still says where it is", () => {
    mount(PHOTOS, 1);
    expect(screen.getByRole("dialog", { name: "Photo 2 of 3" })).toBeTruthy();
    const title = screen.getByText("Photo 2 of 3");
    expect(title).toHaveClass("sr-only");
    expect(screen.queryAllByText(/\b2 of 3\b/)).toHaveLength(1);
  });
});

describe("MediaLightbox: video behavior", () => {
  // r1 (`video=auto`): the browser's bar is gone, and with it the 64px strip a
  // PLAYING clip used to reserve from the swipe. The scrubber is its own
  // control outside the track, so a drag on it seeks and never swipes...
  it("the scrubber is its own control: a drag on it seeks and never swipes", () => {
    const { onIndexChange } = mount(WITH_VIDEO, 1);
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    Object.defineProperty(video, "duration", { value: 10, configurable: true });
    fireEvent.loadedMetadata(video);
    const scrubber = screen.getByRole("slider", { name: "Seek" });
    expect(track().contains(scrubber)).toBe(false);
    firePointer(scrubber, "pointerdown", { x: 600, t: 0 });
    firePointer(scrubber, "pointermove", { x: 300, t: 50 });
    firePointer(scrubber, "pointerup", { x: 300, t: 100 });
    expect(track().dataset.dragging).toBeUndefined();
    expect(onIndexChange).not.toHaveBeenCalled();
    // 300 of the (mocked) 800px bar = 3.75 of 10 seconds.
    expect(video.currentTime).toBeCloseTo(3.75, 2);
  });

  // ...and a drag on the clip itself swipes, whether it plays or not.
  it("a drag on the clip swipes, playing or paused", () => {
    for (const playing of [true, false]) {
      const { onIndexChange, unmount } = mount(WITH_VIDEO, 1);
      const video = document.querySelector(
        "video[data-center-media]",
      ) as HTMLVideoElement;
      fireEvent.play(video);
      if (!playing) fireEvent.pause(video);
      firePointer(track(), "pointerdown", { x: 500, y: 580, t: 0 });
      firePointer(track(), "pointermove", { x: 300, y: 580, t: 50 });
      expect(track().dataset.dragging).toBe("true");
      firePointer(track(), "pointerup", { x: 300, y: 580, t: 100 });
      fireEvent.transitionEnd(track(), { propertyName: "transform" });
      expect(onIndexChange).toHaveBeenCalledWith(2);
      unmount();
    }
  });

  it("plays muted and looping the moment it is on screen, and stops when the viewer moves on", () => {
    const { rerender } = mount(WITH_VIDEO, 1);
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    expect(media.play).toHaveBeenCalled();
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    media.pause.mockClear();
    rerender(
      <TooltipProvider>
        <MediaLightbox
          items={WITH_VIDEO}
          index={2}
          onClose={() => {}}
          onIndexChange={() => {}}
        />
      </TooltipProvider>,
    );
    expect(media.pause).toHaveBeenCalled();
  });

  it("under reduced motion it waits for Play", () => {
    setReducedMotion(true);
    mount(WITH_VIDEO, 1);
    expect(media.play).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("keeps its sound in the capsule, one tap away, out of the credit's corner", () => {
    mount([{ ...WITH_VIDEO[1], uploaderName: "Priya" }], 0);
    const capsule = document.querySelector(
      "[data-lightbox-capsule]",
    ) as HTMLElement;
    const sound = within(capsule).getByRole("button", {
      name: "Turn sound on",
    });
    const credit = document.querySelector("[data-lightbox-credit]")!;
    expect(credit.contains(sound)).toBe(false);
    fireEvent.click(sound);
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    expect(video.muted).toBe(false);
  });

  it("opened from the reel, it carries on from the reel's moment", () => {
    mount(WITH_VIDEO, 1, { startAt: 2.4 });
    const video = document.querySelector(
      "video[data-center-media]",
    ) as HTMLVideoElement;
    Object.defineProperty(video, "readyState", {
      value: 1,
      configurable: true,
    });
    fireEvent.loadedMetadata(video);
    expect(video.currentTime).toBeCloseTo(2.4, 5);
  });
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

/* THE SEAM (the Orchestrator, 2026-09-20): `canDelete` gates the personal Delete per item, so a
   surface that may remove SOME photographs (a guest's own) shows the Trash only on those. */
describe("canDelete gates the personal Delete per item", () => {
  it("shows the Trash on the item it allows and never on another", () => {
    const onDeleteCurrent = vi.fn();
    const allowP2 = (m: GridMedia) => m.id === "p2";
    const first = render(
      <TooltipProvider>
        <MediaLightbox
          items={PHOTOS}
          index={0}
          onClose={() => {}}
          onIndexChange={() => {}}
          onDeleteCurrent={onDeleteCurrent}
          canDelete={allowP2}
        />
      </TooltipProvider>,
    );
    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
    first.unmount();
    render(
      <TooltipProvider>
        <MediaLightbox
          items={PHOTOS}
          index={1}
          onClose={() => {}}
          onIndexChange={() => {}}
          onDeleteCurrent={onDeleteCurrent}
          canDelete={allowP2}
        />
      </TooltipProvider>,
    );
    expect(screen.getByRole("button", { name: /^delete$/i })).toBeTruthy();
  });
});

/* A GUEST'S OWN DELETE IS FINAL, AND SAYS SO (Will, 2026-09-23: "I want it gone everywhere, not
   still visible to the host as well", in words "closer to 'deleted immediately from event and
   cannot be recovered' so they don't confuse a 30-day hold with a host still having access"). The
   promise is pinned, never the sentence: the uploader's own confirm names no window and no place
   it waits; a HOST's own upload (the personal Uploads' host arm, which stays restorable) keeps the
   host's Deleted and its window; the album's consequence line still follows either. */
describe("the uploader's own delete says what it does", () => {
  const WINDOW = `${RECENTLY_DELETED_WINDOW_DAYS} days`;

  function openOwnDelete(item: GridMedia, consequence?: string) {
    const onDeleteCurrent = vi.fn();
    render(
      <TooltipProvider>
        <DeleteConsequence.Provider
          value={consequence ? () => consequence : null}
        >
          <MediaLightbox
            items={[item]}
            index={0}
            onClose={() => {}}
            onIndexChange={() => {}}
            onDeleteCurrent={onDeleteCurrent}
          />
        </DeleteConsequence.Provider>
      </TooltipProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = screen.getByRole("dialog", { name: /delete this upload/i });
    return { dialog, onDeleteCurrent };
  }

  it("a guest's own delete promises no window and no place it waits, and still deletes", () => {
    const { dialog, onDeleteCurrent } = openOwnDelete(PHOTOS[0]);
    expect(dialog.textContent).not.toContain(WINDOW);
    // "Deleted" is the host's place; a guest's withdrawal never reaches it.
    expect(dialog.textContent).not.toMatch(/\bDeleted\b/);
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onDeleteCurrent).toHaveBeenCalledWith(PHOTOS[0]);
  });

  it("a host's own upload keeps the host's words: Deleted, and the window off the constant", () => {
    const { dialog } = openOwnDelete({ ...PHOTOS[0], isHost: true });
    expect(dialog.textContent).toMatch(/\bDeleted\b/);
    expect(dialog.textContent).toContain(WINDOW);
  });

  it("the album's consequence line still follows the final sentence", () => {
    const line =
      "This is your last upload here, so the album closes until you add another.";
    const { dialog } = openOwnDelete(PHOTOS[0], line);
    expect(dialog.textContent).toContain(line);
    expect(dialog.textContent).not.toContain(WINDOW);
  });
});

/**
 * THE GROUND BEHIND A PHOTOGRAPH (`behind=album`, Will 2026-09-20), and the one
 * way of drawing it that does not defeat itself.
 *
 * ★ A BACKDROP FILTER BLURS WHAT IS BEHIND THE ELEMENT IT SITS ON. Put it on an
 * ancestor of the media and the viewer blurs the photograph it exists to show —
 * a failure that neither throws nor type-errors and looks plausible in the
 * source, which is exactly the shape of failure a contract is for. So the pin is
 * structural: the ground is its OWN element, and the media is not inside it.
 * Nothing here reads a blur radius or a brightness; those are Will's to retune.
 */
describe("the lightbox's ground is separate from the photograph", () => {
  it("draws the album on its own element, with the media never inside it", () => {
    render(
      <TooltipProvider>
        <MediaLightbox
          items={PHOTOS}
          index={0}
          onClose={() => {}}
          onIndexChange={() => {}}
        />
      </TooltipProvider>,
    );
    const ground = document.querySelector("[data-lightbox-ground]");
    expect(ground, "the lightbox must draw a ground of its own").toBeTruthy();
    expect(ground).toHaveClass("glass-behind");

    // Every photograph in the viewer lives ABOVE the ground, never within it.
    const media = document.querySelectorAll("[data-lightbox-track] img");
    expect(media.length).toBeGreaterThan(0);
    for (const el of media) expect(ground!.contains(el)).toBe(false);
  });

  // r1 moved the credit to the top (`who=face`); it is still one of the three
  // panes a finger's width apart, and a clip adds its transport as a fourth.
  it("wears the ONE material on the credit, the capsule and the close", () => {
    // `grades=one` (Will, 2026-09-20): "This feels more consistent across
    // surfaces that are close to each other, else it looks weird they're
    // different." Three surfaces a finger's width apart, one class between them.
    render(
      <TooltipProvider>
        <MediaLightbox
          items={[{ ...PHOTOS[0], uploaderName: "Priya" }]}
          index={0}
          onClose={() => {}}
          onIndexChange={() => {}}
        />
      </TooltipProvider>,
    );
    const panes = document.querySelectorAll(".glass");
    // The face-led credit, the action capsule and the close button.
    expect(panes.length).toBe(3);
    for (const pane of panes) {
      // A second recipe is the drift the round retired: no surface may reach
      // for its own tint or its own blur on top of the material.
      expect(pane.className).not.toMatch(/\bbg-(black|white)\/\d+/);
      expect(pane.className).not.toMatch(/backdrop-blur/);
    }
  });
});

/**
 * THE CREDIT, AFTER THE IDENTITY RESHAPE (2026-09-21).
 *
 * Anonymity left the product, so what is pinned is the three things a credit can
 * now BE and nothing about how any of them look: a confirmed name stands plain, a
 * typed one is marked, and a row with no name names nobody (no invented stand-in,
 * no mark, the counter alone). The mark's own way out is pinned too, because it
 * is the one Will asked for by name ("want to correct that immediately by
 * verifying") and it exists only on your own upload.
 */
describe("MediaLightbox: the uploader's credit", () => {
  const credited = (extra: Partial<GridMedia>): GridMedia[] => [
    { ...PHOTOS[0], ...extra },
  ];

  it("a confirmed name stands plain, with no mark", () => {
    mount(credited({ uploaderName: "Priya", isVerified: true }), 0);
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UNVERIFIED_LABEL })).toBeNull();
  });

  it("a name nobody proved is named AND marked", () => {
    mount(credited({ uploaderName: "Sam", isVerified: false }), 0);
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UNVERIFIED_LABEL }),
    ).toBeInTheDocument();
  });

  // r1: the counter went, so a nameless row now shows no credit at all.
  it("a row with no name names nobody: no credit, no stand-in, no mark", () => {
    mount(credited({ uploaderName: null, isVerified: false }), 0);
    expect(screen.queryByText(/a guest/i)).toBeNull();
    expect(screen.queryByRole("button", { name: UNVERIFIED_LABEL })).toBeNull();
    expect(document.querySelector("[data-lightbox-credit]")).toBeNull();
  });

  it("the mark offers the way out on the viewer's OWN upload only", () => {
    // Somebody else's: the explanation, and no action.
    const others = mount(
      credited({ uploaderName: "Sam", isVerified: false }),
      0,
    );
    fireEvent.click(screen.getByRole("button", { name: UNVERIFIED_LABEL }));
    expect(
      screen.queryByRole("button", { name: /confirm your email/i }),
    ).toBeNull();
    others.unmount();

    // Mine (the `canDelete` seam is the "this is yours" answer every surface
    // that can say so already carries).
    mount(credited({ uploaderName: "Sam", isVerified: false }), 0, {
      canDelete: () => true,
    });
    fireEvent.click(screen.getByRole("button", { name: UNVERIFIED_LABEL }));
    expect(
      screen.getByRole("button", { name: /confirm your email/i }),
    ).toBeInTheDocument();
  });

  it("says nothing about proof it was never given: an item with no flag is plain", () => {
    mount(credited({ uploaderName: "Priya" }), 0);
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UNVERIFIED_LABEL })).toBeNull();
  });
});

/**
 * THE FACE-LED CREDIT (`who=face`, r1). Top left, in the guest list's grammar:
 * a disc and the name, the mark on a name nobody proved, "You" on your own
 * upload, the proved address for the host, and a door only where a page exists.
 */
describe("MediaLightbox: the face-led credit (r1)", () => {
  const one = (extra: Partial<ViewerMedia>): ViewerMedia[] => [
    { ...PHOTOS[0], ...extra },
  ];

  it("leads with a disc and the name, in its own pane at the top", () => {
    mount(one({ uploaderName: "Leah", isVerified: true }), 0);
    const credit = document.querySelector("[data-lightbox-credit]")!;
    expect(credit).toHaveClass("glass");
    expect(within(credit as HTMLElement).getByText("Leah")).toBeInTheDocument();
    expect(within(credit as HTMLElement).getByText("L")).toBeInTheDocument();
    // The credit is not the capsule: the actions stack apart from it.
    const capsule = document.querySelector("[data-lightbox-capsule]")!;
    expect(capsule.contains(credit)).toBe(false);
  });

  it("reads You on the viewer's own upload, and keeps the way out beside it", () => {
    mount(one({ uploaderName: "Sam", isVerified: false }), 0, {
      canDelete: () => true,
    });
    const credit = document.querySelector(
      "[data-lightbox-credit]",
    ) as HTMLElement;
    expect(within(credit).getByText("You")).toBeInTheDocument();
    expect(within(credit).queryByText("Sam")).toBeNull();
    expect(
      within(credit).getByRole("button", { name: UNVERIFIED_LABEL }),
    ).toBeInTheDocument();
  });

  it("shows the host the proved address under the name, and marks the host's own", () => {
    mount(
      one({
        uploaderName: "Leah",
        isVerified: true,
        uploaderEmail: "leah@example.com",
      }),
      0,
      { viewerIsHost: true },
    );
    expect(screen.getByText("leah@example.com")).toBeInTheDocument();
    mount(one({ uploaderName: "Maya", isHost: true, isVerified: true }), 0);
    expect(screen.getAllByText("Host").length).toBeGreaterThan(0);
  });

  it("opens a door only where a page exists, and never behind a typed name", () => {
    const face = { avatarUrl: null, seed: "s", href: "/u/leah" };
    const confirmed = mount(
      one({ uploaderName: "Leah", isVerified: true, uploaderFace: face }),
      0,
    );
    const door = screen.getByRole("link", { name: "Leah" });
    expect(door).toHaveAttribute("href", "/u/leah");
    confirmed.unmount();

    mount(
      one({ uploaderName: "Priya", isVerified: false, uploaderFace: face }),
      0,
    );
    expect(screen.queryByRole("link", { name: "Priya" })).toBeNull();
    expect(screen.getByText("Priya")).toBeInTheDocument();
  });

  it("names the event instead on the personal feed, whose items name no uploader", () => {
    mount(
      one({
        uploaderName: null,
        eventName: "Maya & Jay",
        eventDateLabel: "Jun 14",
        eventQrToken: "tok",
      }),
      0,
    );
    const link = screen.getByRole("link", { name: "Maya & Jay · Jun 14" });
    expect(link).toHaveAttribute("href", "/e/tok");
  });
});

/**
 * THE CAPSULE'S SHARE, COPY LINK AND SAVE (`link=file` and his notes, r1). The
 * decision tree is lib/media/share-save.ts (tested there over mocked
 * navigators); these pin the WIRING: which control shows where, what address a
 * link carries, and that Share hands the sheet the file.
 */
describe("MediaLightbox: share, copy link and save (r1)", () => {
  const ALBUM = "https://partyreel.com/e/tok";
  const nav = navigator as unknown as Record<string, unknown>;
  const saved: Record<string, PropertyDescriptor | undefined> = {};
  const stub = (key: string, value: unknown) => {
    if (!(key in saved))
      saved[key] = Object.getOwnPropertyDescriptor(navigator, key);
    Object.defineProperty(navigator, key, { configurable: true, value });
  };
  /** A Response stand-in from jsdom's own realm (undici's Response cannot read a jsdom Blob). */
  const jpegResponse = () => ({
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "image/jpeg" }),
    blob: async () => new Blob(["jpeg"], { type: "image/jpeg" }),
  });
  afterEach(() => {
    for (const [key, d] of Object.entries(saved)) {
      if (d) Object.defineProperty(navigator, key, d);
      else delete nav[key];
      delete saved[key];
    }
    vi.unstubAllGlobals();
  });

  it("copies the PUBLIC album link that opens on this photograph, never the page's own address", async () => {
    window.history.replaceState(null, "", "/dashboard/evt?view=album");
    const writeText = vi.fn(async () => {});
    stub("clipboard", { writeText });
    mount(PHOTOS, 1, {
      shareUrl: ALBUM,
      viewerIsHost: true,
      onSetStatus: vi.fn(),
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    });
    expect(writeText).toHaveBeenCalledWith(`${ALBUM}?photo=p2`);
    window.history.replaceState(null, "", "/");
  });

  it("offers Copy link only on an approved photograph, and only with an album link", () => {
    const pending = mount([{ ...PHOTOS[0], status: "pending" }], 0, {
      shareUrl: ALBUM,
    });
    expect(screen.queryByRole("button", { name: "Copy link" })).toBeNull();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    pending.unmount();
    mount(PHOTOS, 0);
    expect(screen.queryByRole("button", { name: "Copy link" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("Share hands the system sheet the picture itself", async () => {
    const share = vi.fn(async () => {});
    stub("share", share);
    stub("canShare", () => true);
    stub("userActivation", { isActive: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jpegResponse()),
    );
    mount(PHOTOS, 1, { shareUrl: ALBUM });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    await vi.waitFor(() => expect(share).toHaveBeenCalled());
    const sent = (share.mock.calls[0] as unknown as [ShareData])[0];
    expect(sent.files?.[0]).toBeInstanceOf(File);
    expect(sent.url).toBeUndefined();
  });

  it("turns Share into a one-tap Ready when the tap lapsed while the file loaded", async () => {
    const share = vi.fn(async () => {});
    stub("share", share);
    stub("canShare", () => true);
    stub("userActivation", { isActive: false });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jpegResponse()),
    );
    mount(PHOTOS, 1, { shareUrl: ALBUM });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    const ready = await screen.findByRole("button", {
      name: "Ready to share. Tap to share.",
    });
    expect(share).not.toHaveBeenCalled();
    stub("userActivation", { isActive: true });
    await act(async () => {
      fireEvent.click(ready);
    });
    expect(share).toHaveBeenCalledTimes(1);
  });

  it("saves with the plain download on a desk and on Android", () => {
    mount(PHOTOS, 1);
    const save = screen.getByRole("link", { name: "Save" });
    expect(save).toHaveAttribute("href", "https://r2.test/d2.jpg");
  });

  it("offers Save to Photos first and the file second on iOS", async () => {
    stub(
      "userAgent",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    );
    mount(PHOTOS, 1);
    const save = screen.getByRole("button", { name: "Save" });
    // Radix's menu opens on the pointer going down.
    fireEvent.pointerDown(save, {
      button: 0,
      ctrlKey: false,
      pointerType: "mouse",
    });
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((i) => i.textContent)).toEqual([
      "Save to Photos",
      "Download file",
    ]);
    expect(items[1].closest("a") ?? items[1]).toHaveAttribute(
      "href",
      "https://r2.test/d2.jpg",
    );
  });
});

/**
 * CLOSE UP (`closeup=pinch`, r1): two fingers scale in place up to three times,
 * one finger pans while close (never a swipe), letting go under fit goes home.
 */
describe("MediaLightbox: the close-up (r1)", () => {
  const SIZED: GridMedia[] = PHOTOS.map((p) => ({
    ...p,
    width: 3000,
    height: 4000,
  }));

  function pinch(from: number, to: number) {
    firePointer(track(), "pointerdown", {
      x: 400 - from / 2,
      y: 300,
      t: 0,
      id: 1,
    });
    firePointer(track(), "pointerdown", {
      x: 400 + from / 2,
      y: 300,
      t: 0,
      id: 2,
    });
    firePointer(track(), "pointermove", {
      x: 400 - to / 2,
      y: 300,
      t: 30,
      id: 1,
    });
    firePointer(track(), "pointermove", {
      x: 400 + to / 2,
      y: 300,
      t: 30,
      id: 2,
    });
  }

  it("scales in place under two fingers, and the neighbours step aside", () => {
    mount(SIZED, 1);
    pinch(100, 250);
    expect(centerZoom().style.transform).toMatch(/scale\(2\.5\)/);
    expect(track().hasAttribute("data-quiet")).toBe(true);
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("goes home when let go under fit", () => {
    mount(SIZED, 1);
    pinch(200, 100);
    firePointer(track(), "pointerup", { x: 350, y: 300, t: 60, id: 1 });
    firePointer(track(), "pointerup", { x: 450, y: 300, t: 60, id: 2 });
    expect(centerZoom().style.transform).toBe("");
    expect(track().hasAttribute("data-quiet")).toBe(false);
  });

  it("pans with one finger while close, and never swipes to the next photograph", () => {
    const { onIndexChange } = mount(SIZED, 1);
    pinch(100, 300);
    firePointer(track(), "pointerup", { x: 250, y: 300, t: 60, id: 1 });
    firePointer(track(), "pointerup", { x: 550, y: 300, t: 60, id: 2 });
    const zoomed = centerZoom().style.transform;
    expect(zoomed).toMatch(/scale\(3\)/);
    firePointer(track(), "pointerdown", { x: 400, y: 300, t: 100, id: 3 });
    firePointer(track(), "pointermove", { x: 340, y: 300, t: 120, id: 3 });
    firePointer(track(), "pointermove", { x: 300, y: 300, t: 140, id: 3 });
    expect(centerZoom().style.transform).not.toBe(zoomed);
    firePointer(track(), "pointerup", { x: 300, y: 300, t: 160, id: 3 });
    fireEvent.transitionEnd(track(), { propertyName: "transform" });
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(track().style.transform).toBe("translateX(calc(-100% + 0px))");
  });

  it("zooms a clip never: two fingers on a video do nothing", () => {
    mount(
      WITH_VIDEO.map((m) => ({ ...m, width: 1920, height: 1080 })),
      1,
    );
    pinch(100, 250);
    expect(centerZoom().style.transform).toBe("");
  });
});

/**
 * THE WAY OUT BY HAND (`wayout=down`, r1): the photograph follows a finger down
 * and leaves past the line or on a flick; a short pull comes back.
 */
describe("MediaLightbox: the pull down (r1)", () => {
  it("leaves past the line", () => {
    const { onClose } = mount(PHOTOS, 1);
    firePointer(track(), "pointerdown", { x: 400, y: 100, t: 0 });
    firePointer(track(), "pointermove", { x: 402, y: 160, t: 100 });
    firePointer(track(), "pointermove", { x: 404, y: 300, t: 400 });
    firePointer(track(), "pointerup", { x: 404, y: 300, t: 500 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves on a flick, even a short one", () => {
    const { onClose } = mount(PHOTOS, 1);
    firePointer(track(), "pointerdown", { x: 400, y: 100, t: 0 });
    firePointer(track(), "pointermove", { x: 400, y: 130, t: 20 });
    firePointer(track(), "pointerup", { x: 400, y: 150, t: 60 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("comes back from a short slow pull, and the chrome with it", () => {
    const { onClose } = mount(PHOTOS, 1);
    firePointer(track(), "pointerdown", { x: 400, y: 100, t: 0 });
    firePointer(track(), "pointermove", { x: 400, y: 130, t: 200 });
    expect(content().hasAttribute("data-dismissing")).toBe(true);
    firePointer(track(), "pointerup", { x: 400, y: 140, t: 600 });
    expect(onClose).not.toHaveBeenCalled();
    expect(content().hasAttribute("data-dismissing")).toBe(false);
    expect(centerZoom().style.transform).toBe("");
  });

  it("never eats the click after a pull: the trailing click does not close twice", () => {
    const { onClose } = mount(PHOTOS, 1);
    firePointer(track(), "pointerdown", { x: 400, y: 100, t: 0 });
    firePointer(track(), "pointermove", { x: 400, y: 130, t: 200 });
    firePointer(track(), "pointerup", { x: 400, y: 140, t: 600 });
    fireEvent.click(track().children[1] as HTMLElement, { clientX: 400 });
    expect(onClose).not.toHaveBeenCalled();
  });
});

/**
 * THE GROWING PHOTOGRAPH AND THE DROP (`opening=grow` and `wayout=down`, r1).
 * jsdom has no Web Animations, so `animate` is a recorder: the pins read the
 * frames the viewer asked for, never a rendered look.
 */
describe("MediaLightbox: grow out of the tile, drop back in (r1)", () => {
  const SIZED: GridMedia[] = PHOTOS.map((p) => ({
    ...p,
    width: 3000,
    height: 4000,
  }));
  const TILE = { left: 20, top: 400, width: 160, height: 120 };
  type Call = {
    el: Element;
    frames: Keyframe[];
    opts: KeyframeAnimationOptions;
    anim: { onfinish: (() => void) | null; oncancel: (() => void) | null };
  };
  let calls: Call[] = [];

  beforeEach(() => {
    calls = [];
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value(this: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) {
        const anim = { onfinish: null, oncancel: null, cancel() {} };
        calls.push({ el: this, frames, opts, anim });
        return anim;
      },
    });
    Object.defineProperty(Element.prototype, "getAnimations", {
      configurable: true,
      value: () => [],
    });
  });
  afterEach(() => {
    delete (Element.prototype as unknown as Record<string, unknown>).animate;
    delete (Element.prototype as unknown as Record<string, unknown>)
      .getAnimations;
  });

  it("grows out of the tile it was tapped on, the chrome waiting until it lands", async () => {
    mount(SIZED, 1, { origin: { kind: "tile", rect: TILE } });
    await act(async () => {});
    const flight = calls.find((c) => c.el.hasAttribute("data-lightbox-media"));
    expect(flight, "the photograph flies").toBeTruthy();
    // It starts on the tile: shrunk toward it, clipped to its crop...
    expect(String(flight!.frames[0].transform)).toMatch(/scale\(0\.\d+\)/);
    expect(String(flight!.frames[0].clipPath)).toMatch(/^inset\(/);
    // ...and ends at rest.
    expect(flight!.frames[1].transform).toBe("translate(0px, 0px) scale(1)");
    expect(flight!.opts.duration).toBeLessThan(300);
    // The ground fades in step; the chrome is hidden until the landing.
    expect(calls.some((c) => c.el.hasAttribute("data-lightbox-ground"))).toBe(
      true,
    );
    const chrome = document.querySelector("[data-lightbox-chrome]")!;
    expect(chrome.hasAttribute("data-hidden")).toBe(true);
    await act(async () => {
      flight!.anim.onfinish?.();
    });
    expect(chrome.hasAttribute("data-hidden")).toBe(false);
  });

  it("under reduced motion it fades as it always has: no flight", async () => {
    setReducedMotion(true);
    mount(SIZED, 1, { origin: { kind: "tile", rect: TILE } });
    await act(async () => {});
    expect(
      calls.filter((c) => c.el.hasAttribute("data-lightbox-media")),
    ).toHaveLength(0);
    expect(
      document
        .querySelector("[data-lightbox-chrome]")!
        .hasAttribute("data-hidden"),
    ).toBe(false);
  });

  it("drops back into the tile of the photograph showing at close, then gives it focus", async () => {
    const tile = document.createElement("div");
    tile.innerHTML = `<button type="button">View photo</button>`;
    document.body.appendChild(tile);
    const returnTo = vi.fn(() => tile);
    const { onClose } = mount(SIZED, 1, {
      origin: { kind: "tile", rect: TILE, returnTo },
    });
    await act(async () => {});
    const grow = calls.find((c) => c.el.hasAttribute("data-lightbox-media"))!;
    await act(async () => {
      grow.anim.onfinish?.();
    });
    calls = [];
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(returnTo).toHaveBeenCalledWith(SIZED[1]);
    const drop = calls.find((c) => c.el.hasAttribute("data-lightbox-media"));
    expect(drop, "the photograph drops").toBeTruthy();
    expect(drop!.opts.fill).toBe("forwards");
    expect(String(drop!.frames[1].clipPath)).toMatch(/^inset\(/);
    expect(onClose).not.toHaveBeenCalled(); // not before it lands
    await act(async () => {
      drop!.anim.onfinish?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    tile.remove();
  });

  it("with nowhere to land, it closes at once", async () => {
    const { onClose } = mount(SIZED, 1, {
      origin: { kind: "tile", rect: TILE, returnTo: () => null },
    });
    await act(async () => {});
    const grow = calls.find((c) => c.el.hasAttribute("data-lightbox-media"))!;
    await act(async () => {
      grow.anim.onfinish?.();
    });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opened from the address (no rect), it fades in and still returns", async () => {
    mount(SIZED, 1, {
      origin: { kind: "tile", rect: null, returnTo: () => null },
    });
    await act(async () => {});
    expect(
      calls.filter((c) => c.el.hasAttribute("data-lightbox-media")),
    ).toHaveLength(0);
  });
});

/**
 * THE PEEK (`next=peek`, r1): a sliver of each neighbour at the edges, which
 * the geometry module proves in numbers; here, that the viewer applies it.
 */
describe("MediaLightbox: the neighbours peek (r1)", () => {
  it("stands each neighbour off toward the photograph, and holds the photograph at its place", () => {
    const SIZED: GridMedia[] = PHOTOS.map((p) => ({
      ...p,
      width: 4000,
      height: 3000,
    }));
    mount(SIZED, 1);
    const [prev, current, next] = mediaOf();
    const shift = (el: HTMLElement) =>
      parseFloat(
        el.style.transform.match(/translateX\((-?[\d.]+)px\)/)?.[1] ?? "0",
      );
    expect(shift(prev)).toBeGreaterThan(0);
    expect(shift(next)).toBeLessThan(0);
    expect(current.style.transform).toBe("");
  });

  it("stays today's full-width swipe when a photograph's size is unknown", () => {
    mount(PHOTOS, 1);
    for (const el of mediaOf()) expect(el.style.transform).toBe("");
  });
});
