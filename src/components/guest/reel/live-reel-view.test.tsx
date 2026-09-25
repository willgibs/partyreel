/**
 * THE REEL'S FULL-SCREEN VIEW, WHICH IS ALSO THE WALL, pinned as behaviour.
 *
 * - The chrome: the dock is up on arrival and settles to the slim bar at rest; a pointer's
 *   movement, or a tap on the bar, brings it back; every control is labelled (the tooltips hang off
 *   those labels).
 * - The controls: one row of icon buttons, Add yours an icon, "Make your own" the one primary
 *   beneath, only with a creator AND the host's plan in hand (on a browser that cannot encode it
 *   stays, greyed, and a tap bubbles up why); Include videos only where the album holds a video.
 * - The creator: opened from Make your own, or on arrival when the tile's line asked for it, and
 *   handed everything it needs (the event's name, who is making it, the plan's facts).
 * - The keyboard: Space pauses, Escape closes, the arrows step.
 * - The hold (3 s default) and the style are the viewer's own, kept on this device and handed to the
 *   engine as a factor per mood.
 * - The arrivals: an upload that arrives while the view is open names its uploader.
 * - Reduced motion starts on the first frame with the dock up.
 * - On a screen: the Start plate, fullscreen and a wake lock on the one tap, and leaving fullscreen
 *   brings the plate back; below the minimum, the code and the address alone.
 * - Never silent: past a threshold of failed frames, one report, and the presign watchdog asked.
 *
 * The canvas engine is stubbed (player-live.test.tsx pins it); the code's renderer too.
 */
import { useEffect, useImperativeHandle } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GalleryLive } from "@/components/guest/gallery-live";
import type { GalleryItem, GalleryReel } from "@/lib/events/gallery-reel";
import type { LiveMediaItem } from "@/lib/reel/live/items";

import { setReducedMotion, setViewportWidth } from "../../../../vitest.setup";

const h = vi.hoisted(() => ({
  live: null as unknown,
  player: null as null | Record<string, unknown>,
  step: vi.fn(),
  moment: vi.fn((): unknown => null),
  captureWarning: vi.fn(),
  canFullscreen: vi.fn(() => true),
  enterFullscreen: vi.fn(async () => true),
  exitFullscreen: vi.fn(async () => {}),
  isFullscreen: vi.fn(() => true),
  fullscreenListeners: [] as (() => void)[],
  wake: {
    acquire: vi.fn(async () => true),
    release: vi.fn(),
    wanted: vi.fn(() => true),
  },
  lightbox: null as null | Record<string, unknown>,
  support: "yes" as "checking" | "yes" | "no",
}));

vi.mock("@/components/guest/gallery-live", () => ({
  useGalleryLive: () => h.live,
}));
vi.mock("@/lib/reel/engine/player-live", () => ({
  LiveReelPlayer: (props: Record<string, unknown>) => {
    h.player = props;
    useImperativeHandle(props.ref as never, () => ({
      step: h.step,
      moment: h.moment,
    }));
    const onClipChange = props.onClipChange as (i: LiveMediaItem) => void;
    const first = (
      props.source as { itemFor: (id: string) => LiveMediaItem }
    ).itemFor("m1");
    useEffect(() => {
      if (first) onClipChange(first);
      // Once, as the first clip reaches the screen.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="player" data-paused={String(props.paused)} />;
  },
}));
vi.mock("@/components/app/styled-qr", () => ({
  StyledQr: ({ value }: { value: string }) => (
    <div data-testid="qr" data-value={value} />
  ),
}));
vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: (props: Record<string, unknown>) => {
    h.lightbox = props;
    return props.index === null ? null : <div data-testid="lightbox" />;
  },
}));
vi.mock("@/components/likes/likes-provider", () => ({
  LikesProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: (...args: unknown[]) => h.captureWarning(...args),
}));
// The device's answer, by hand: jsdom has no WebCodecs, and the probe itself is clip-support's own.
vi.mock("@/lib/reel/clip-support", () => ({
  useClipSupport: (enabled: boolean) => (enabled ? h.support : "checking"),
  probeClipSupport: async () => h.support === "yes",
}));
vi.mock("@/lib/guest/screen-posture", () => ({
  canFullscreen: () => h.canFullscreen(),
  enterFullscreen: () => h.enterFullscreen(),
  exitFullscreen: () => h.exitFullscreen(),
  isFullscreen: () => h.isFullscreen(),
  onFullscreenChange: (cb: () => void) => {
    h.fullscreenListeners.push(cb);
    return () => {};
  },
  createWakeLock: () => h.wake,
}));

const { LiveReelView } = await import("./live-reel-view");

const REEL: GalleryReel = {
  showReel: true,
  liveReelEnabled: true,
  styleId: null,
  clip: { videoAllowed: true, watermark: false, maxSeconds: 60 },
};

function item(i: number, over: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: `m${i}`,
    type: "photo",
    url: `https://r2.test/o/${i}.jpg`,
    previewUrl: `https://r2.test/p/${i}.webp`,
    status: "approved",
    uploaderName: `Guest ${i}`,
    ...over,
  };
}

function live(over: Partial<GalleryLive> = {}): GalleryLive {
  const items = over.items ?? [item(1), item(2), item(3)];
  return {
    qrToken: "qr-token",
    access: "full",
    isDemo: false,
    seed: { items, teaserTotal: null, approvedTotal: items.length, etag: "e" },
    serverItems: items,
    items,
    serverIds: new Set(items.map((m) => m.id)),
    count: items.length,
    reel: REEL,
    arrivals: [],
    ownLandings: [],
    ownIds: new Set(),
    liveOwnCount: () => 0,
    canRemove: true,
    removeOwn: async () => {},
    pendingUploads: [],
    pendingUrls: new Map(),
    reportPossibleExpiry: vi.fn(),
    ...over,
  };
}

type Props = Parameters<typeof LiveReelView>[0];

function renderView(props: Partial<Props> = {}) {
  const liveValue = h.live as GalleryLive;
  const all: Props = {
    mode: "hand",
    idle: false,
    eventId: "event-1",
    eventName: "Maya & Jay",
    joinUrl: "https://partyreel.com/e/qr-token",
    displayAddress: "partyreel.com/e/party",
    qrStyle: "classic",
    isDemo: false,
    playable: liveValue.serverItems,
    onAddYours: vi.fn(),
    creator: null,
    addClipToAlbum: null,
    onClose: vi.fn(),
    ...props,
  };
  const utils = render(<LiveReelView {...all} />);
  return { ...utils, props: all };
}

const dock = () => document.querySelector("[data-reel-dock]");

beforeEach(() => {
  h.live = live();
  h.player = null;
  h.lightbox = null;
  h.step.mockClear();
  h.moment.mockReset();
  h.moment.mockReturnValue(null);
  h.captureWarning.mockClear();
  h.canFullscreen.mockReturnValue(true);
  h.enterFullscreen.mockClear();
  h.wake.acquire.mockClear();
  h.wake.release.mockClear();
  h.fullscreenListeners.length = 0;
  h.support = "yes";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the chrome (the thin bar)", () => {
  it("arrives with the dock up, then settles to the bar; a pointer's movement brings it back", () => {
    vi.useFakeTimers();
    renderView();
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
    const content = document.querySelector("[data-live-reel-view]")!;
    fireEvent.pointerMove(content, { pointerType: "mouse" });
    expect(dock()).toHaveAttribute("data-state", "up");
  });

  it("a tap on the bar opens the dock, and a tap on the timeline folds it away", () => {
    vi.useFakeTimers();
    renderView();
    act(() => vi.advanceTimersByTime(2600));
    fireEvent.click(
      screen.getByRole("button", { name: "Show the reel's controls" }),
    );
    expect(dock()).toHaveAttribute("data-state", "up");
    fireEvent.click(screen.getByRole("button", { name: "Hide the controls" }));
    expect(dock()).toHaveAttribute("data-state", "rest");
  });

  it("labels every control: play, style, hold, the code, Add yours, and Close", () => {
    renderView();
    for (const name of [
      "Pause",
      "Style: Cinematic",
      "Hold: 3 s a photo",
      "Show the code",
      "Add yours",
      "Close",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    // No video in this album: no switch that would do nothing.
    expect(screen.queryByRole("button", { name: /Videos/ })).toBeNull();
    // No creator: nothing leads to a dead end.
    expect(screen.queryByRole("button", { name: "Make your own" })).toBeNull();
  });

  it("offers Include videos once the album holds a video", () => {
    h.live = live({
      items: [item(1), item(2, { type: "video", url: "/v.mp4" })],
    });
    renderView();
    expect(screen.getByRole("button", { name: "Videos play" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers Make your own only with a creator AND the host's plan", () => {
    const Creator = () => <div data-testid="creator" />;
    const { unmount } = renderView({ creator: Creator });
    fireEvent.click(screen.getByRole("button", { name: "Make your own" }));
    expect(screen.getByTestId("creator")).toBeInTheDocument();
    // The reel waits behind the creator.
    expect(h.player?.paused).toBe(true);
    unmount();
    h.live = live({ reel: { ...REEL, clip: null } });
    renderView({ creator: Creator });
    expect(screen.queryByRole("button", { name: "Make your own" })).toBeNull();
  });

  it("hands the creator the event's name, who is making it and the plan's facts", () => {
    const seen: Record<string, unknown>[] = [];
    const Creator = (props: Record<string, unknown>) => {
      seen.push(props);
      return <div data-testid="creator" />;
    };
    const ownIds = new Set(["m2"]);
    h.live = live({ ownIds });
    const add = vi.fn();
    renderView({
      creator: Creator,
      addClipToAlbum: add,
      isOwner: true,
      moderated: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Make your own" }));
    const props = seen.at(-1)!;
    expect(props.eventName).toBe("Maya & Jay");
    expect(props.eventId).toBe("event-1");
    expect(props.isOwner).toBe(true);
    expect(props.moderated).toBe(true);
    expect(props.ownIds).toBe(ownIds);
    expect(props.addClipToAlbum).toBe(add);
    expect(props.facts).toEqual(REEL.clip);
  });

  it("keeps Make your own on a browser that cannot encode, greyed, and says why on a tap", () => {
    vi.useFakeTimers();
    h.support = "no";
    const Creator = () => <div data-testid="creator" />;
    renderView({ creator: Creator });
    const door = screen.getByRole("button", { name: "Make your own" });
    expect(door).toHaveAttribute("aria-disabled", "true");
    // Nothing over the reel until she asks.
    expect(screen.queryByRole("status")).toBeNull();
    fireEvent.click(door);
    expect(screen.queryByTestId("creator")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "This browser can't make clips. Open the album on another device to make one.",
    );
    // The reel keeps playing: a door that explains is not a door that opens.
    expect(h.player?.paused).toBe(false);
    act(() => {
      vi.advanceTimersByTime(4300);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("opens the creator on arrival when the tile's line asked for it, once", async () => {
    const Creator = () => <div data-testid="creator" />;
    const spent = vi.fn();
    renderView({
      creator: Creator,
      creatorAsked: true,
      onCreatorAskSpent: spent,
    });
    await act(async () => {});
    expect(screen.getByTestId("creator")).toBeInTheDocument();
    expect(spent).toHaveBeenCalledTimes(1);
  });

  it("asked for on a browser that cannot encode, it opens on the reel with the door explaining", async () => {
    h.support = "no";
    const Creator = () => <div data-testid="creator" />;
    renderView({
      creator: Creator,
      creatorAsked: true,
      onCreatorAskSpent: vi.fn(),
    });
    await act(async () => {});
    expect(screen.queryByTestId("creator")).toBeNull();
    expect(dock()).toHaveAttribute("data-state", "up");
    expect(screen.getByRole("status")).toHaveTextContent(
      "This browser can't make clips.",
    );
  });
});

describe("the keyboard", () => {
  it("Space pauses and plays, the arrows step, Escape closes", () => {
    const { props } = renderView();
    const content = document.querySelector<HTMLElement>(
      "[data-live-reel-view]",
    )!;
    content.focus();
    expect(h.player?.paused).toBe(false);
    fireEvent.keyDown(content, { key: " " });
    expect(h.player?.paused).toBe(true);
    fireEvent.keyDown(content, { key: " " });
    expect(h.player?.paused).toBe(false);
    fireEvent.keyDown(content, { key: "ArrowRight" });
    fireEvent.keyDown(content, { key: "ArrowLeft" });
    expect(h.step.mock.calls).toEqual([[1], [-1]]);
    fireEvent.keyDown(content, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalled();
  });
});

describe("the viewer's own knobs", () => {
  it("defaults to a 3 s hold, handed to the engine as the mood's own factor", () => {
    renderView();
    // Cinematic holds 2.7 s by design: 3 s is 3 / 2.7 of it.
    expect(h.player?.holdScale).toBeCloseTo(3 / 2.7, 5);
    expect(h.player?.surface).toBe("wall");
  });

  it("starts in the host's mood, and a viewer's pick is kept for this event", () => {
    h.live = live({ reel: { ...REEL, styleId: "warm" } });
    const { unmount } = renderView();
    expect(h.player?.styleId).toBe("warm");
    unmount();
    localStorage.setItem("pr_reel_style_qr-token", "mono");
    renderView();
    expect(h.player?.styleId).toBe("mono");
  });

  it("keeps a chosen hold for this event on this device", () => {
    localStorage.setItem("pr_reel_hold_qr-token", "7");
    renderView();
    expect(
      screen.getByRole("button", { name: "Hold: 7 s a photo" }),
    ).toBeInTheDocument();
  });

  it("shows the code with the ask and the readable address, the link inside it", () => {
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Show the code" }));
    expect(screen.getByText("Scan to add yours")).toBeInTheDocument();
    expect(screen.getByText("partyreel.com/e/party")).toBeInTheDocument();
    expect(screen.getByTestId("qr")).toHaveAttribute(
      "data-value",
      "https://partyreel.com/e/qr-token",
    );
    // No event name, anywhere on the view.
    expect(document.body.textContent).not.toMatch(/Mia & Theo|Reel lane/);
  });
});

describe("a tap on the picture (a tap opens the viewer)", () => {
  it("pauses and opens the photograph on screen in the media viewer", () => {
    renderView();
    fireEvent.click(document.querySelector("[data-reel-picture]")!);
    expect(screen.getByTestId("lightbox")).toBeInTheDocument();
    expect(h.lightbox?.index).toBe(0);
    expect(h.player?.paused).toBe(true);
  });

  it("opens the clip the player says is on screen", () => {
    renderView();
    h.moment.mockReturnValue({ clipId: "m2", videoSec: null });
    fireEvent.click(document.querySelector("[data-reel-picture]")!);
    expect(h.lightbox?.index).toBe(1);
  });

  it("grows the viewer out of the frame, and a video carries on from the reel's moment", () => {
    h.live = live({ items: [item(1, { type: "video" }), item(2), item(3)] });
    renderView();
    const picture = document.querySelector<HTMLElement>("[data-reel-picture]")!;
    vi.spyOn(picture, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1440,
      bottom: 900,
      width: 1440,
      height: 900,
      toJSON: () => ({}),
    } as DOMRect);
    h.moment.mockReturnValue({ clipId: "m1", videoSec: 2.5 });
    fireEvent.click(picture);
    expect(h.lightbox?.origin).toEqual({
      kind: "reel",
      rect: expect.objectContaining({ width: 1440, height: 900 }),
    });
    // No `returnTo`: the way out lands back in the frame.
    expect(h.lightbox?.origin).not.toHaveProperty("returnTo");
    expect(h.lightbox?.startAt).toBe(2.5);
  });

  it("a photograph carries no moment, and a frame with no size fades in", () => {
    renderView();
    const picture = document.querySelector<HTMLElement>("[data-reel-picture]")!;
    // A frame not laid out yet is no box to grow from.
    vi.spyOn(picture, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    } as DOMRect);
    h.moment.mockReturnValue({ clipId: "m1", videoSec: null });
    fireEvent.click(picture);
    expect(h.lightbox?.origin).toEqual({ kind: "reel", rect: null });
    expect(h.lightbox?.startAt).toBeUndefined();
  });
});

describe("the arrivals (the arrival chip)", () => {
  it("names who just added one, and never a clip", () => {
    const { rerender, props } = renderView();
    expect(document.querySelector("[data-reel-arrivals]")).toBeNull();
    const withTheo = [
      ...(h.live as GalleryLive).items,
      item(9, { uploaderName: "Theo" }),
      item(10, { uploaderName: "Maya", reelEligible: false }),
    ];
    h.live = live({ items: withTheo, arrivals: ["m9", "m10"] });
    rerender(<LiveReelView {...props} playable={withTheo} />);
    const feed = document.querySelector("[data-reel-arrivals]");
    expect(feed).toHaveTextContent("Theo");
    expect(feed).not.toHaveTextContent("Maya");
  });
});

describe("reduced motion (reduced motion starts paused)", () => {
  it("starts on the first frame with the dock up, and the dock stays", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    renderView();
    expect(h.player?.paused).toBe(true);
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "up");
  });
});

describe("on a screen (the view is the wall)", () => {
  it("plays in the window at once, the code on, under a pill that asks for one press", () => {
    renderView({ mode: "screen" });
    expect(h.player?.paused).toBe(false);
    expect(document.querySelector("[data-reel-code]")).not.toBeNull();
    expect(document.querySelector("[data-reel-start]")).toBeNull();
    expect(document.querySelector("[data-reel-fill]")).toHaveTextContent(
      "Press anywhere to fill the screen",
    );
  });

  it("a press anywhere fills the screen and keeps it awake, and opens nothing else", async () => {
    renderView({ mode: "screen" });
    await act(async () => {
      fireEvent.click(document.querySelector("[data-reel-picture]")!);
    });
    expect(h.enterFullscreen).toHaveBeenCalled();
    expect(h.wake.acquire).toHaveBeenCalled();
    // The press was the pill's, not the media viewer's.
    expect(screen.queryByTestId("lightbox")).toBeNull();
    expect(document.querySelector("[data-reel-fill]")).toBeNull();
  });

  it("leaving fullscreen never pauses it or lets go of the screen: the pill simply returns", async () => {
    renderView({ mode: "screen" });
    await act(async () => {
      fireEvent.click(document.querySelector("[data-reel-fill]")!);
    });
    h.isFullscreen.mockReturnValue(false);
    act(() => {
      for (const cb of h.fullscreenListeners) cb();
    });
    expect(document.querySelector("[data-reel-fill]")).not.toBeNull();
    expect(h.player?.paused).toBe(false);
    expect(h.wake.release).not.toHaveBeenCalled();
    h.isFullscreen.mockReturnValue(true);
  });

  it("under reduced motion the window holds its first frame until the press", async () => {
    setReducedMotion(true);
    renderView({ mode: "screen" });
    expect(h.player?.paused).toBe(true);
    await act(async () => {
      fireEvent.click(document.querySelector("[data-reel-fill]")!);
    });
    expect(h.player?.paused).toBe(false);
  });

  it("where the platform has no fullscreen, the press keeps the screen awake and the pill says so", async () => {
    h.canFullscreen.mockReturnValue(false);
    renderView({ mode: "screen" });
    expect(document.querySelector("[data-reel-fill]")).toHaveTextContent(
      "Press anywhere to keep the screen awake",
    );
    await act(async () => {
      fireEvent.click(document.querySelector("[data-reel-fill]")!);
    });
    expect(h.wake.acquire).toHaveBeenCalled();
    expect(h.enterFullscreen).not.toHaveBeenCalled();
    expect(document.querySelector("[data-reel-fill]")).toBeNull();
    h.canFullscreen.mockReturnValue(true);
  });

  it("below the minimum it is the code and the address alone", () => {
    renderView({ mode: "screen", idle: true });
    expect(document.querySelector("[data-reel-idle]")).not.toBeNull();
    expect(screen.queryByTestId("player")).toBeNull();
    expect(screen.getByText("partyreel.com/e/party")).toBeInTheDocument();
    // Nothing to press and nothing to read but the code: no Start, no line, no pill.
    expect(screen.queryByRole("button", { name: /Start/ })).toBeNull();
    expect(document.querySelector("[data-reel-fill]")).toBeNull();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});

describe("the owner's Set for everyone", () => {
  function openStyle() {
    fireEvent.pointerDown(screen.getByRole("button", { name: /^Style: / }), {
      ctrlKey: false,
      button: 0,
    });
  }

  it("says the look is this device's until set, and sets the look and the hold for everyone", async () => {
    localStorage.setItem("pr_reel_style_qr-token", "mono");
    localStorage.setItem("pr_reel_hold_qr-token", "5");
    const onSetForEveryone = vi.fn(async () => true);
    renderView({ isOwner: true, onSetForEveryone });
    openStyle();
    expect(
      screen.getByText("Only on this device, for now"),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: "Set for everyone" }),
      );
    });
    expect(onSetForEveryone).toHaveBeenCalledWith({
      styleId: "mono",
      holdSec: 5,
    });
    expect(screen.getByText("Everyone sees this look")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Set for everyone" }),
    ).toBeNull();
  });

  it("with the event's own defaults on screen there is nothing to set", () => {
    renderView({ isOwner: true, onSetForEveryone: vi.fn(async () => true) });
    openStyle();
    expect(screen.getByText("Everyone sees this look")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Set for everyone" }),
    ).toBeNull();
  });

  it("a refused set leaves the look this device's", async () => {
    localStorage.setItem("pr_reel_style_qr-token", "mono");
    renderView({ isOwner: true, onSetForEveryone: vi.fn(async () => false) });
    openStyle();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("menuitem", { name: "Set for everyone" }),
      );
    });
    expect(
      screen.getByText("Only on this device, for now"),
    ).toBeInTheDocument();
  });

  it("a guest's Style list carries no footer at all", () => {
    localStorage.setItem("pr_reel_style_qr-token", "mono");
    renderView({ onSetForEveryone: vi.fn(async () => true) });
    openStyle();
    expect(screen.queryByText("Only on this device, for now")).toBeNull();
  });
});

describe("the desk's extras", () => {
  it("the code toggle lives at a desk only", () => {
    const { unmount } = renderView();
    expect(
      screen.getByRole("button", { name: "Show the code" }),
    ).toBeInTheDocument();
    unmount();
    setViewportWidth(375);
    renderView();
    expect(screen.queryByRole("button", { name: /the code/ })).toBeNull();
    setViewportWidth(1024);
  });

  it("the owner at a desk can play it on a screen, in a new tab", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderView({ isOwner: true });
    fireEvent.click(screen.getByRole("button", { name: "Play on a screen" }));
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("reel=screen"),
      "_blank",
      "noopener",
    );
    open.mockRestore();
  });

  it("a guest never gets it, and neither does the owner on a phone", () => {
    const { unmount } = renderView();
    expect(
      screen.queryByRole("button", { name: "Play on a screen" }),
    ).toBeNull();
    unmount();
    setViewportWidth(375);
    renderView({ isOwner: true });
    expect(
      screen.queryByRole("button", { name: "Play on a screen" }),
    ).toBeNull();
    setViewportWidth(1024);
  });
});

describe("never silent", () => {
  it("reports once past the failure threshold, and asks the presign watchdog every time", () => {
    renderView();
    const onFailure = h.player?.onFailure as (n: number) => void;
    for (let n = 1; n <= 30; n++) act(() => onFailure(n));
    expect(h.captureWarning).toHaveBeenCalledTimes(1);
    expect(h.captureWarning).toHaveBeenCalledWith(
      "reel",
      "live reel: frames failing",
      expect.objectContaining({ eventId: "event-1", failures: 12 }),
    );
    expect((h.live as GalleryLive).reportPossibleExpiry).toHaveBeenCalledTimes(
      30,
    );
  });
});
