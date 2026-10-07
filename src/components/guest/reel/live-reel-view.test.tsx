/**
 * THE REEL'S FULL-SCREEN VIEW, WHICH IS ALSO THE WALL, pinned as behaviour.
 *
 * - The chrome: the dock is up on arrival and settles to the slim bar at rest; a pointer's
 *   movement, a press on the bar, or a click or tap anywhere on the picture (the bar's own press,
 *   never the photograph's) brings it back, and the next press on the picture puts it away; every
 *   control is labelled (the tooltips hang off those labels).
 * - The controls: one row of icon buttons, Add yours an icon, "Make your own" the one primary
 *   beneath, only with a creator AND the host's plan in hand (on a browser that cannot encode it
 *   stays, greyed, and a tap bubbles up why); Include videos only where the album holds a video.
 * - The creator: opened from Make your own, and handed everything it needs (the event's name, who is
 *   making it, the plan's facts).
 * - The keyboard: Space pauses, Escape closes, the arrows step, Enter brings the controls up.
 * - The page under it cannot scroll while it is open.
 * - The hold (3 s default) and the style are the viewer's own, kept on this device and handed to the
 *   engine as a factor per mood.
 * - The arrivals: an upload that arrives while the view is open names its uploader.
 * - Reduced motion starts on the first frame with the dock up.
 * - On a screen: the Start plate, fullscreen and a wake lock on the one tap, and leaving fullscreen
 *   brings the plate back; below the minimum, the code and the address alone.
 * - Never silent: past a threshold of failed frames, one report; and the presign watchdog asked for
 *   exactly the failing ids (a still through the source, a video window through the player).
 *
 * The canvas engine is stubbed (player-live.test.tsx pins it); the code's renderer too.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
  viewerMounted: false,
  support: "yes" as "checking" | "yes" | "no",
  // The stand-in player holds its first clip back (a slow phone's first window) until a test lets it on screen.
  holdFirst: false,
}));

vi.mock("@/components/guest/gallery-live", () => ({
  useGalleryLive: () => h.live,
}));
vi.mock("@/lib/reel/engine/player-live", () => ({
  LiveReelPlayer: (props: Record<string, unknown>) => {
    h.player = props;
    useImperativeHandle(props.ref as never, () => ({ step: h.step }));
    const onClipChange = props.onClipChange as (i: LiveMediaItem) => void;
    const first = (
      props.source as { itemFor: (id: string) => LiveMediaItem }
    ).itemFor("m1");
    useEffect(() => {
      if (first && !h.holdFirst) onClipChange(first);
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
// The photo viewer, stubbed so that anything of the reel's that mounted it would show: the reel never
// opens it (a tap is the chrome's, see "a tap on the picture").
vi.mock("@/components/shared/media-lightbox.lazy", () => ({
  MediaLightboxLazy: () => {
    h.viewerMounted = true;
    return <div data-testid="lightbox" />;
  },
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
  const byId = new Map(items.map((m) => [m.id, m]));
  return {
    qrToken: "qr-token",
    access: "full",
    isDemo: false,
    teaserTotal: null,
    serverItems: items,
    items,
    serverIds: new Set(items.map((m) => m.id)),
    count: items.length,
    reel: REEL,
    reelItems: items,
    // The links by id, as the provider's resolver answers them for what it holds.
    clips: {
      get: (id: string) => {
        const m = byId.get(id);
        return m ? { tile: m.previewUrl ?? m.url, view: m.url } : undefined;
      },
      ensure: async () => {},
    },
    ensureLinks: vi.fn(),
    nameOf: (id: string) => byId.get(id)?.uploaderName ?? null,
    arrivals: [],
    ownLandings: [],
    ownIds: new Set(),
    liveOwnCount: () => 0,
    canRemove: true,
    removeOwn: async () => {},
    pendingUploads: [],
    pendingUrls: new Map(),
    uploadProgress: null,
    reportPossibleExpiry: vi.fn(),
    albumRead: "ready",
    retryAlbum: async () => {},
    ...over,
  };
}

type Props = Parameters<typeof LiveReelView>[0];

function renderView(props: Partial<Props> = {}) {
  const liveValue = h.live as GalleryLive | null;
  const all: Props = {
    mode: "hand",
    idle: false,
    eventId: "event-1",
    eventName: "Maya & Jay",
    joinUrl: "https://partyreel.com/e/qr-token",
    displayAddress: "partyreel.com/e/party",
    qrStyle: "classic",
    isDemo: false,
    playable: liveValue?.serverItems ?? [],
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
const picture = () =>
  document.querySelector<HTMLElement>("[data-reel-picture]")!;
const bar = () =>
  screen.getByRole("button", { name: "Show the reel's controls" });
// The reel's own dialog is the only one there is: nothing a press on the picture could open stands over it.
const dialogs = () => document.querySelectorAll('[role="dialog"]');
/**
 * One press as a pointer makes it: its pointerdown (which names the pointer), then its click, which
 * counts one (a click with no pointer behind it, a keyboard's, reads `detail` 0).
 */
function press(el: Element, pointerType: "mouse" | "touch" | "pen" = "mouse") {
  fireEvent.pointerDown(el, { pointerType });
  fireEvent.click(el, { detail: 1 });
}

beforeEach(() => {
  h.live = live();
  h.player = null;
  h.viewerMounted = false;
  h.step.mockClear();
  h.captureWarning.mockClear();
  h.canFullscreen.mockReturnValue(true);
  h.enterFullscreen.mockClear();
  h.wake.acquire.mockClear();
  h.wake.release.mockClear();
  h.fullscreenListeners.length = 0;
  h.support = "yes";
  h.holdFirst = false;
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * ★ THE REEL OPENS ON ITS FIRST PHOTOGRAPH (guest-moments r1, Will's `opening=still`): it was a black with no mark until
 * the player's first window drew (about a second on a slow phone), which at the very start read as broken. The
 * cover's first still stands edge to edge from the view's first frame with Close beside it, the reel's take leads with
 * it, and the first clip on screen crossfades it away; with no still (the hub's own reel before its develop), a quiet
 * dark with Close.
 */
describe("the opening", () => {
  const opening = { id: "m2", tile: "https://r2.test/p/2.webp" };
  const still = () =>
    document.querySelector<HTMLImageElement>("[data-reel-opening]");
  const closeKey = () => screen.getByRole("button", { name: "Close" });

  it("★ stands the first photograph with Close while the player loads, the dock waiting with it", () => {
    h.holdFirst = true;
    renderView({ opening });
    expect(still()?.getAttribute("src")).toBe(opening.tile);
    expect(still()?.dataset.reelOpening).toBe("in");
    expect(closeKey().closest(".lr-follow")).toHaveAttribute(
      "data-state",
      "up",
    );
    expect(dock()).toBeNull();
  });

  it("★ the reel's take leads with it, so the reel starts from the picture standing", () => {
    h.holdFirst = true;
    renderView({ opening });
    const source = h.player!.source as {
      windowAt: (i: number, look: unknown) => { ids: string[] } | null;
    };
    expect(
      source.windowAt(0, { styleId: "classic", surface: "wall" })?.ids[0],
    ).toBe("m2");
  });

  it("★ the first clip on screen crossfades it away and brings the controls up for their first beat", () => {
    vi.useFakeTimers();
    h.holdFirst = true;
    renderView({ opening });
    const onClipChange = h.player!.onClipChange as (item: unknown) => void;
    act(() => onClipChange(h.live && (h.live as GalleryLive).items[1]));
    expect(still()?.dataset.reelOpening).toBe("out");
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(300));
    expect(still()).toBeNull();
    // The controls' first-sight beat runs from the first frame, not from the press a second before it.
    act(() => vi.advanceTimersByTime(2000));
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(600));
    expect(dock()).toHaveAttribute("data-state", "rest");
  });

  it("is a quiet dark with Close where there is no photograph to stand (the hub's own reel)", () => {
    h.holdFirst = true;
    renderView();
    expect(still()).toBeNull();
    expect(closeKey().closest(".lr-follow")).toHaveAttribute(
      "data-state",
      "up",
    );
  });
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

  it("a pointer's press on a control leaves the dock free to rest, though the control keeps the focus", () => {
    vi.useFakeTimers();
    renderView();
    // A press focuses the control it pressed, and that is no reason to hold the dock up: jsdom (like a
    // browser, for a press) does not call that focus visible.
    act(() => screen.getByRole("button", { name: "Pause" }).focus());
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
  });

  it("a key's focus holds the dock up until it leaves, then it rests", () => {
    vi.useFakeTimers();
    const matches = Element.prototype.matches;
    const keyed = vi
      .spyOn(Element.prototype, "matches")
      .mockImplementation(function (this: Element, selector: string) {
        return selector === ":focus-visible"
          ? true
          : matches.call(this, selector);
      });
    try {
      renderView();
      const pause = screen.getByRole("button", { name: "Pause" });
      act(() => pause.focus());
      act(() => vi.advanceTimersByTime(10_000));
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => pause.blur());
      act(() => vi.advanceTimersByTime(2600));
      expect(dock()).toHaveAttribute("data-state", "rest");
    } finally {
      keyed.mockRestore();
    }
  });

  it("keeps the focus on the view when the half it was in goes quiet, so Space still pauses", () => {
    vi.useFakeTimers();
    renderView();
    const content = document.querySelector<HTMLElement>(
      "[data-live-reel-view]",
    )!;
    // A pointer's press leaves the control it pressed focused; when the dock rests its controls go
    // inert, which a browser answers by dropping that focus onto the page's body.
    act(() => screen.getByRole("button", { name: "Pause" }).focus());
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
    expect(document.activeElement).toBe(content);
    fireEvent.keyDown(document.activeElement!, { key: " " });
    expect(h.player?.paused).toBe(true);
    // The same when the bar holds it and the press that opens the dock turns the bar inert.
    fireEvent.keyDown(content, { key: " " });
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
    act(() => bar().focus());
    press(bar());
    expect(dock()).toHaveAttribute("data-state", "up");
    expect(document.activeElement).toBe(content);
  });

  // ★ THE PRESS ON PLAY SAYS WHOSE REST IT EARNS (red-team 52's NIT: a finger's press on Play woke the dock on the
  // pointer's 2.4 s, where the picture's and the bar's taps got the finger's 4.2 s). A paused reel keeps its controls
  // by itself, so the rest that matters starts when Play lets go of that pin.
  it.each([
    ["a finger's", "touch", 4200],
    ["a pointer's", "mouse", 2400],
  ] as const)(
    "%s press on Play lets the dock rest after its own wait, %s ms",
    (_who, pointer, ms) => {
      vi.useFakeTimers();
      renderView();
      press(screen.getByRole("button", { name: "Pause" }), pointer);
      act(() => vi.advanceTimersByTime(10_000));
      expect(dock()).toHaveAttribute("data-state", "up");
      press(screen.getByRole("button", { name: "Play" }), pointer);
      act(() => vi.advanceTimersByTime(ms - 100));
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(200));
      expect(dock()).toHaveAttribute("data-state", "rest");
    },
  );

  // ★ THE OPEN FILL READS `aria-expanded` (identity r4's finding: "data-state="closed" with aria-expanded="true" while
  // the menu is open", so the key never lit). The tooltip wraps the menu's trigger on one button, and radix spreads
  // the outer trigger's props after the inner one's own, so `data-state` there is the tooltip's; a jsdom has no
  // cascade, so what is held is that the fill follows the attribute the menu alone sets, and that it is set while open.
  it.each([
    ["Style", /^Style: /],
    ["Hold", /^Hold: /],
  ] as const)(
    "the %s key shows its open fill while its menu stands open",
    async (_key, name) => {
      renderView();
      const key = screen.getByRole("button", { name });
      expect(key).toHaveAttribute("aria-expanded", "false");
      expect(key.className).toContain("aria-expanded:bg-white/18");
      expect(key.className).not.toContain("data-[state=open]");
      fireEvent.pointerDown(key, { ctrlKey: false, button: 0 });
      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(key).toHaveAttribute("aria-expanded", "true");
    },
  );

  // ★ RED-TEAM 53's NIT (crumbs-65): the open fill (18%) lost to the pointer's hover (12%) while the pointer rested on
  // the key it had just pressed, because the hover came later in the sheet. A jsdom has no cascade either, so what is
  // held is the SHIPPED RULE: Tailwind compiles the key's own classes, and the hover rule it emits excludes an open
  // menu's key (`aria-expanded`), so the open fill wins by construction and not by where the rules happen to sit.
  it.each([
    ["Style", /^Style: /],
    ["Hold", /^Hold: /],
  ] as const)(
    "★ the %s key's hover never covers its open fill: the compiled rule leaves an open key out",
    async (_key, name) => {
      renderView();
      const key = screen.getByRole("button", { name });
      const hover = key.className
        .split(/\s+/)
        .filter((c) => c.includes("hover:") && c.includes("bg-white/12"));
      expect(hover).toHaveLength(1);
      const { compile } = await import("tailwindcss");
      const css = (
        await compile("@theme { --color-white: #fff; } @tailwind utilities;")
      ).build(hover);
      expect(css).toMatch(/:not\([^)]*\[aria-expanded="true"\]\)/);
    },
  );

  // The same fault on the keys that press (the code, the videos): a pressed key's fill is its own, with no hover
  // beside it to win; at rest it still has the hover.
  it("★ a pressed key carries its fill and no hover to cover it; at rest it has the hover", () => {
    renderView();
    const rest = screen.getByRole("button", { name: "Show the code" });
    expect(rest).toHaveAttribute("aria-pressed", "false");
    expect(rest.className).toContain("hover:bg-white/12");
    expect(rest.className).not.toMatch(/(^|\s)bg-white\/18/);

    fireEvent.click(rest);
    const pressed = screen.getByRole("button", { name: "Hide the code" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");
    expect(pressed.className).toMatch(/(^|\s)bg-white\/18/);
    expect(pressed.className).not.toContain("hover:bg-white/12");
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

  it("offers Make your own only with a creator AND the host's plan", async () => {
    const Creator = () => <div data-testid="creator" />;
    const { unmount } = renderView({ creator: Creator });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Make your own" }));
    });
    expect(screen.getByTestId("creator")).toBeInTheDocument();
    // The reel waits behind the creator.
    expect(h.player?.paused).toBe(true);
    unmount();
    h.live = live({ reel: { ...REEL, clip: null } });
    renderView({ creator: Creator });
    expect(screen.queryByRole("button", { name: "Make your own" })).toBeNull();
  });

  it("hands the creator the event's name, who is making it and the plan's facts", async () => {
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
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Make your own" }));
    });
    const props = seen.at(-1)!;
    expect(props.eventName).toBe("Maya & Jay");
    expect(props.eventId).toBe("event-1");
    expect(props.isOwner).toBe(true);
    expect(props.moderated).toBe(true);
    expect(props.ownIds).toBe(ownIds);
    expect(props.addClipToAlbum).toBe(add);
    expect(props.facts).toEqual(REEL.clip);
  });

  it("opens the creator's room on the album's links: every playable photograph asked for first, the room mounting once they land", async () => {
    const Creator = () => <div data-testid="creator" />;
    let land!: () => void;
    const ensure = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          land = resolve;
        }),
    );
    const base = live();
    h.live = { ...base, clips: { ...base.clips, ensure } };
    renderView({ creator: Creator });
    fireEvent.click(screen.getByRole("button", { name: "Make your own" }));
    expect(ensure).toHaveBeenCalledWith(["m1", "m2", "m3"]);
    // The room's dark ground covers the reel while the links come; the creator is not mounted yet.
    expect(screen.queryByTestId("creator")).toBeNull();
    await act(async () => {
      land();
    });
    expect(screen.getByTestId("creator")).toBeInTheDocument();
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

  it("Enter brings the controls up and opens nothing; on a control it is that control's own press", () => {
    vi.useFakeTimers();
    renderView();
    const content = document.querySelector<HTMLElement>(
      "[data-live-reel-view]",
    )!;
    content.focus();
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
    fireEvent.keyDown(content, { key: "Enter" });
    expect(dock()).toHaveAttribute("data-state", "up");
    // It neither pauses the reel nor puts the controls away, and nothing opens over it.
    fireEvent.keyDown(content, { key: "Enter" });
    expect(dock()).toHaveAttribute("data-state", "up");
    expect(h.player?.paused).toBe(false);
    expect(h.viewerMounted).toBe(false);
    expect(dialogs()).toHaveLength(1);
    // Space on a control is that control's press and never the view's pause.
    const play = screen.getByRole("button", { name: "Pause" });
    fireEvent.keyDown(play, { key: " " });
    expect(h.player?.paused).toBe(false);
  });
});

describe("the page under it", () => {
  it("cannot scroll while the view is open, and scrolls again once it closes", () => {
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
    const { unmount } = renderView();
    // Radix's lock (RemoveScroll, the desk's scrollbar taken away with it) is the Overlay's.
    expect(document.body).toHaveAttribute("data-scroll-locked");
    // The view sits inside it, so what it portals out (the dock's menus) is inside the lock too.
    const view = document.querySelector("[data-live-reel-view]");
    expect(view?.parentElement).toHaveAttribute("data-live-reel-overlay");
    unmount();
    expect(document.body).not.toHaveAttribute("data-scroll-locked");
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

describe("a view already open follows the event going live (build 10's red-team: 'Set for everyone' toasted the room, but a screen already open kept playing its mount-time look)", () => {
  it("adopts a live style change once the poll carries it, with no pick of its own", async () => {
    h.live = live({ reel: { ...REEL, styleId: null } });
    const { rerender, props } = renderView();
    expect(h.player?.styleId).toBe("classic");
    h.live = live({ reel: { ...REEL, styleId: "mono" } });
    await act(async () => {
      rerender(<LiveReelView {...props} />);
    });
    expect(h.player?.styleId).toBe("mono");
  });

  it("adopts a live hold change once the poll carries it, with no pick of its own", async () => {
    h.live = live({ reel: { ...REEL, styleId: null, holdSec: 3 } });
    const { rerender, props } = renderView();
    // Cinematic holds 2.7 s by design: 3 s is 3 / 2.7 of it (the first test's own comment).
    expect(h.player?.holdScale).toBeCloseTo(3 / 2.7, 5);
    h.live = live({ reel: { ...REEL, styleId: null, holdSec: 5 } });
    await act(async () => {
      rerender(<LiveReelView {...props} />);
    });
    expect(h.player?.holdScale).toBeCloseTo(5 / 2.7, 5);
  });

  it("never touches a device's own style or hold pick", async () => {
    localStorage.setItem("pr_reel_style_qr-token", "mono");
    localStorage.setItem("pr_reel_hold_qr-token", "7");
    const { rerender, props } = renderView();
    expect(h.player?.styleId).toBe("mono");
    expect(
      screen.getByRole("button", { name: "Hold: 7 s a photo" }),
    ).toBeInTheDocument();
    h.live = live({ reel: { ...REEL, styleId: "warm", holdSec: 2 } });
    await act(async () => {
      rerender(<LiveReelView {...props} />);
    });
    expect(h.player?.styleId).toBe("mono");
    expect(
      screen.getByRole("button", { name: "Hold: 7 s a photo" }),
    ).toBeInTheDocument();
  });
});

/**
 * RESHAPED ON PURPOSE. A tap on the picture used to pause the reel and open the photograph in the
 * shared viewer, which made the reel's own controls the hardest thing to reach (a tap meant to bring
 * them up opened a second layer, whose X landed on the picture that opened it again). Four tests pinned
 * that; each keeps what still holds and drops the reason that expired:
 * - "pauses and opens the photograph on screen in the media viewer": the viewer is gone, and its scar
 *   stays as the second test below (a tap never pauses the reel and never opens anything over it).
 * - "opens the clip the player says is on screen": expired with the viewer (which clip it opened on);
 *   nothing asks the player which clip is on screen any more.
 * - "grows the viewer out of the frame, and a video carries on from the reel's moment": expired (the
 *   frame's origin and the video's `startAt` left with the viewer).
 * - "a photograph carries no moment, and a frame with no size fades in": expired with the same two.
 */
describe("a tap on the picture (the bar's own press, never the photograph's)", () => {
  it("brings the controls up, and the next tap puts them away", () => {
    vi.useFakeTimers();
    renderView();
    act(() => vi.advanceTimersByTime(2600));
    expect(dock()).toHaveAttribute("data-state", "rest");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "up");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "rest");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "up");
  });

  it("never pauses the reel and never opens the photograph", () => {
    vi.useFakeTimers();
    renderView();
    act(() => vi.advanceTimersByTime(2600));
    press(picture());
    press(picture());
    press(picture(), "touch");
    expect(h.player?.paused).toBe(false);
    expect(h.viewerMounted).toBe(false);
    expect(screen.queryByTestId("lightbox")).toBeNull();
    expect(dialogs()).toHaveLength(1);
    // And the reel is still the one dialog, with its view in place.
    expect(document.querySelector("[data-live-reel-view]")).not.toBeNull();
  });

  // The bar's press and the picture's tap are one press: the same controls, the same rest.
  const WAYS: [string, () => HTMLElement][] = [
    ["the bar's press", bar],
    ["a tap on the picture", picture],
  ];
  it.each(WAYS)(
    "%s brings the controls up and they rest on their own: a pointer's 2.4 s, a finger's 4.2 s",
    (_way, target) => {
      vi.useFakeTimers();
      renderView();
      act(() => vi.advanceTimersByTime(2600));
      expect(dock()).toHaveAttribute("data-state", "rest");
      // A pointer's click.
      press(target(), "mouse");
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(2300));
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(200));
      expect(dock()).toHaveAttribute("data-state", "rest");
      // A finger's tap, which is given longer.
      press(target(), "touch");
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(4100));
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(200));
      expect(dock()).toHaveAttribute("data-state", "rest");
    },
  );

  it("a click no pointer made (a keyboard's, a screen reader's) gets the finger's longer rest", () => {
    vi.useFakeTimers();
    renderView();
    act(() => vi.advanceTimersByTime(2600));
    // `detail` 0 is how a click that was not a pointer's reads.
    fireEvent.click(picture(), { detail: 0 });
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(4100));
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(200));
    expect(dock()).toHaveAttribute("data-state", "rest");
  });

  // ★ RESHAPED ON PURPOSE (red-team 52's desk click; scar kept: a pointer's movement brings the controls up after a
  // tap put them away, and a finger's never does). The second press followed the movement in the same instant, which
  // is a click aimed with that movement and is held now (`a click aimed with the move ...`, below); a viewer who
  // answers the dock after seeing it takes longer than a beat.
  it("a pointer's movement still brings the controls up, after a tap put them away", () => {
    vi.useFakeTimers();
    renderView();
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "rest");
    fireEvent.pointerMove(document.querySelector("[data-live-reel-view]")!, {
      pointerType: "mouse",
    });
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(700));
    // A finger moving over the picture is no pointer's movement.
    press(picture());
    fireEvent.pointerMove(document.querySelector("[data-live-reel-view]")!, {
      pointerType: "touch",
    });
    expect(dock()).toHaveAttribute("data-state", "rest");
  });

  describe("a click aimed with the move that raised the dock (red-team 52: a desk viewer moves to aim, and the click hid what the move had brought)", () => {
    const view = () => document.querySelector("[data-live-reel-view]")!;
    const rest = () => {
      vi.useFakeTimers();
      renderView();
      act(() => vi.advanceTimersByTime(2600));
      expect(dock()).toHaveAttribute("data-state", "rest");
    };

    it("★ keeps the controls up, and its own rest starts from the click", () => {
      rest();
      // The mouse travels onto the picture: the move wakes the dock, and 150 ms later the click lands.
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(150));
      press(picture(), "mouse");
      expect(dock()).toHaveAttribute("data-state", "up");
      // The click restarted the pointer's rest: 2.4 s from IT, not from the move.
      act(() => vi.advanceTimersByTime(2300));
      expect(dock()).toHaveAttribute("data-state", "up");
      act(() => vi.advanceTimersByTime(200));
      expect(dock()).toHaveAttribute("data-state", "rest");
    });

    it("holds the click that lands on the dock the move just grew under the pointer (the bar's own press)", () => {
      rest();
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(120));
      // The bar went inert as the dock grew, so the click meets the dock's timeline instead.
      press(screen.getByRole("button", { name: "Hide the controls" }), "mouse");
      expect(dock()).toHaveAttribute("data-state", "up");
    });

    it("a click after the beat is the viewer's own answer to the dock: it folds away", () => {
      rest();
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      act(() => vi.advanceTimersByTime(700));
      press(picture(), "mouse");
      expect(dock()).toHaveAttribute("data-state", "rest");
    });

    it("only a movement that RAISED the dock starts a beat: a dock already up folds on the next click as ever", () => {
      vi.useFakeTimers();
      renderView();
      expect(dock()).toHaveAttribute("data-state", "up");
      // The first sight's dock is up and a pointer moves over it: nothing was raised, so nothing is held.
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      press(picture(), "mouse");
      expect(dock()).toHaveAttribute("data-state", "rest");
    });

    it("never holds a finger's tap or a key's press: neither moved anything", () => {
      rest();
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      press(picture(), "touch");
      expect(dock()).toHaveAttribute("data-state", "rest");
      // The same for a click no pointer made (`detail` 0).
      fireEvent.pointerMove(view(), { pointerType: "mouse" });
      expect(dock()).toHaveAttribute("data-state", "up");
      fireEvent.click(picture(), { detail: 0 });
      expect(dock()).toHaveAttribute("data-state", "rest");
    });

    it("holds a pen's click as a mouse's", () => {
      rest();
      fireEvent.pointerMove(view(), { pointerType: "pen" });
      act(() => vi.advanceTimersByTime(100));
      press(picture(), "pen");
      expect(dock()).toHaveAttribute("data-state", "up");
    });
  });

  it("never reaches a control: a press that lands on one acts on that control and leaves the chrome as it was", () => {
    renderView();
    expect(dock()).toHaveAttribute("data-state", "up");
    press(screen.getByRole("button", { name: "Pause" }));
    expect(h.player?.paused).toBe(true);
    expect(dock()).toHaveAttribute("data-state", "up");
    // The dock's own pane (the gaps between its controls) is chrome too, never the picture.
    press(dock()!);
    expect(dock()).toHaveAttribute("data-state", "up");
    press(screen.getByRole("button", { name: "Close" }));
    expect(dock()).toHaveAttribute("data-state", "up");
  });

  it("a paused reel keeps its controls up by itself, and a tap still puts them away on purpose", () => {
    vi.useFakeTimers();
    renderView();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "up");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "rest");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "up");
  });

  it("under reduced motion the controls never rest by themselves, and a tap still puts them away on purpose", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    renderView();
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "up");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "rest");
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "rest");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "up");
    act(() => vi.advanceTimersByTime(10_000));
    expect(dock()).toHaveAttribute("data-state", "up");
  });

  it.each(["mouse", "touch"] as const)(
    "a %s's press that dismisses a menu is only that",
    async (pointer) => {
      renderView();
      fireEvent.pointerDown(screen.getByRole("button", { name: /^Style: / }), {
        ctrlKey: false,
        button: 0,
      });
      expect(screen.getByRole("menu")).toBeInTheDocument();
      // Radix starts listening for a press outside the menu one task after it opens.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      await act(async () => {
        press(picture(), pointer);
      });
      expect(screen.queryByRole("menu")).toBeNull();
      // The menu went and the controls stayed: one press, one effect.
      expect(dock()).toHaveAttribute("data-state", "up");
      // The next press is a tap on the picture again.
      press(picture(), pointer);
      expect(dock()).toHaveAttribute("data-state", "rest");
    },
  );
});

describe("the arrivals (the arrival chip)", () => {
  it("names who just added one, once its link (and the name riding it) has landed, and never a clip", async () => {
    const { rerender, props } = renderView();
    expect(document.querySelector("[data-reel-arrivals]")).toBeNull();
    const withTheo = [
      ...(h.live as GalleryLive).items,
      item(9, { uploaderName: "Theo" }),
      item(10, { uploaderName: "Maya", reelEligible: false }),
    ];
    const ensure = vi.fn(async () => {});
    const next = live({ items: withTheo, arrivals: ["m9", "m10"] });
    h.live = { ...next, clips: { ...next.clips, ensure } };
    await act(async () => {
      rerender(<LiveReelView {...props} playable={withTheo} />);
    });
    // The arrival's link is asked for first: its attribution rides it.
    expect(ensure).toHaveBeenCalledWith(["m9"]);
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

  it("a press anywhere fills the screen and keeps it awake, and is only that; after it a tap is the chrome's like anywhere", async () => {
    renderView({ mode: "screen" });
    expect(dock()).toHaveAttribute("data-state", "up");
    await act(async () => {
      press(picture());
    });
    expect(h.enterFullscreen).toHaveBeenCalled();
    expect(h.wake.acquire).toHaveBeenCalled();
    // The press was the pill's: the controls stand as they did and nothing opened over the reel.
    expect(dock()).toHaveAttribute("data-state", "up");
    expect(h.viewerMounted).toBe(false);
    expect(dialogs()).toHaveLength(1);
    expect(document.querySelector("[data-reel-fill]")).toBeNull();
    // The pill's press is spent, so the next one is the bar's own press, as on any other surface.
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "rest");
    press(picture());
    expect(dock()).toHaveAttribute("data-state", "up");
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
  it("reports once past the failure threshold", () => {
    renderView();
    const onFailure = h.player?.onFailure as (n: number) => void;
    for (let n = 1; n <= 30; n++) act(() => onFailure(n));
    expect(h.captureWarning).toHaveBeenCalledTimes(1);
    expect(h.captureWarning).toHaveBeenCalledWith(
      "reel",
      "live reel: frames failing",
      expect.objectContaining({ eventId: "event-1", failures: 12 }),
    );
  });

  it("asks the presign watchdog for exactly the failing clip, never the album", () => {
    renderView();
    const onExpired = h.player?.onExpired as (id: string) => void;
    act(() => onExpired("m2"));
    expect((h.live as GalleryLive).reportPossibleExpiry).toHaveBeenCalledWith([
      "m2",
    ]);
  });
});

/**
 * ★ THE VIEW CARRIES ITS OWN STYLESHEET (crumbs-66). The dock's classes live in `live-reel.css`, which only the guests'
 * controller imported; the hub mounts the view without that controller, and its built route held no such sheet, so the
 * host's dock drew unclipped (the bar's glyphs over the dock's controls, the Close key never leaving).
 */
describe("the view's own stylesheet", () => {
  const read = (file: string) =>
    readFileSync(
      join(process.cwd(), "src/components/guest/reel", file),
      "utf8",
    );

  it("★ imports the sheet its dock's classes are drawn by, so any page that mounts it has them", () => {
    expect(read("live-reel-view.tsx")).toMatch(
      /^import "\.\/live-reel\.css";$/m,
    );
  });

  it("draws only classes that sheet defines (the dock's pane, its two contents and the corner that follows it)", () => {
    const view = read("live-reel-view.tsx");
    const sheet = read("live-reel.css");
    for (const name of [
      "lr-pane",
      "lr-bar-content",
      "lr-dock-content",
      "lr-follow",
    ]) {
      expect(view, name).toContain(name);
      expect(sheet, name).toContain(`.${name}`);
    }
  });
});

/**
 * ★ PLAYED FROM THE HOST'S OWN PAGE (hub-strip-wiring, Will's Q5: "the live reel is the host's to play from her own event
 * page as soon as she opens it, even while the album develops"). The hub has no guest album's live source (its album is
 * the host's own scope), so it hands the view the four things the view reads off one, as `standIn`: the links by id, the
 * host's defaults, the event's key for this device's own picks and the presign watchdog. With none, the guest source
 * answers as it always did (every test above).
 */
describe("played from the host's own page", () => {
  const playable: LiveMediaItem[] = [1, 2, 3].map((i) => ({
    id: `m${i}`,
    type: "photo",
    url: "",
    status: "approved",
    drawable: true,
  }));
  const standIn = () => {
    const clips = {
      get: vi.fn((id: string) => ({ tile: `tile-${id}`, view: `view-${id}` })),
      ensure: vi.fn(async () => {}),
    };
    return {
      clips,
      qrToken: "host-key",
      reel: { ...REEL, styleId: "mono", holdSec: 2, clip: null },
      reportPossibleExpiry: vi.fn(),
    };
  };

  it("★ plays with no guest source at all: its links come off the stand-in, by id", () => {
    h.live = null;
    const hostPage = standIn();
    renderView({ playable, standIn: hostPage });
    expect(h.player).not.toBeNull();
    // The clip source read the first clip's links through the host's own resolver.
    expect(hostPage.clips.get).toHaveBeenCalledWith("m1");
  });

  it("starts on the host's own defaults, and keeps this device's own picks under the stand-in's key", () => {
    h.live = null;
    // The player stub keeps the props it was last drawn with (read through a function: TypeScript narrows `h.player`
    // to its last assignment, which a render in between changes).
    const styleOnScreen = () => h.player?.styleId;
    const { unmount } = renderView({ playable, standIn: standIn() });
    expect(styleOnScreen()).toBe("mono");
    unmount();
    localStorage.setItem("pr_reel_style_host-key", "editorial");
    renderView({ playable, standIn: standIn() });
    expect(styleOnScreen()).toBe("editorial");
  });

  it("asks the stand-in's presign watchdog for exactly the failing clip", () => {
    h.live = null;
    const hostPage = standIn();
    renderView({ playable, standIn: hostPage });
    act(() => (h.player?.onExpired as (id: string) => void)("m2"));
    expect(hostPage.reportPossibleExpiry).toHaveBeenCalledWith(["m2"]);
  });

  // ★ THE HUB'S REEL BEFORE THE DEVELOP SAID NOTHING OF IT (red-team 53b's deferred line, crumbs-66): she plays her own scope
  // while her guests have no reel yet, and the dock, which is where she reads what this view is, carried no word of
  // that. The page that mounts the view says what it knows (`dockNote`); the guests' own page knows nothing to say.
  it("★ carries the page's note in its dock, and nothing where the page has none", () => {
    h.live = null;
    const { unmount } = renderView({
      playable,
      standIn: standIn(),
      isOwner: true,
      screenLink: false,
      dockNote: "Guests get it at the develop.",
    });
    expect(dock()).toHaveTextContent("Guests get it at the develop.");
    // In the dock's own controls, which are inert at rest: never over the picture, never a second line drawn on it.
    expect(
      document
        .querySelector(".lr-dock-content")
        ?.contains(screen.getByText("Guests get it at the develop.")),
    ).toBe(true);
    unmount();
    renderView({ playable, standIn: standIn(), isOwner: true });
    expect(dock()).not.toHaveTextContent("Guests get it");
    expect(document.querySelector("[data-reel-note]")).toBeNull();
  });

  it("offers no creator without the host's plan in hand: the stand-in names none", () => {
    h.live = null;
    renderView({ playable, standIn: standIn(), creator: vi.fn() as never });
    expect(screen.queryByRole("button", { name: /make your own/i })).toBeNull();
  });

  it("★ the owner at a desk is offered no screen link where the page says there is none", () => {
    h.live = null;
    const { unmount } = renderView({
      playable,
      standIn: standIn(),
      isOwner: true,
      screenLink: false,
    });
    expect(
      screen.queryByRole("button", { name: "Play on a screen" }),
    ).toBeNull();
    unmount();
    // And is still offered it by default, which is every guest page's own owner.
    renderView({ playable, standIn: standIn(), isOwner: true });
    expect(
      screen.getByRole("button", { name: "Play on a screen" }),
    ).toBeInTheDocument();
  });

  it("the owner's Set for everyone rides the stand-in's page just the same", () => {
    h.live = null;
    renderView({
      playable,
      standIn: standIn(),
      isOwner: true,
      onSetForEveryone: vi.fn(async () => true),
    });
    fireEvent.pointerDown(screen.getByRole("button", { name: /^Style: / }), {
      ctrlKey: false,
      button: 0,
    });
    expect(screen.getByText("Everyone sees this look")).toBeInTheDocument();
  });
});
